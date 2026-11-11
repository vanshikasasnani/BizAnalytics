const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Notification = require('../models/Notification');

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private
const getSales = async (req, res) => {
  try {
    const {
      search,
      customerId,
      paymentMethod,
      paymentStatus,
      startDate,
      endDate,
      sortBy = 'date',
      order = 'desc',
      page = 1,
      limit = 50,
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { saleNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
        { 'items.name': { $regex: search, $options: 'i' } },
      ];
    }

    if (customerId) {
      query.customer = customerId;
    }

    if (paymentMethod && paymentMethod !== 'All') {
      query.paymentMethod = paymentMethod;
    }

    if (paymentStatus && paymentStatus !== 'All') {
      query.paymentStatus = paymentStatus;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const total = await Sale.countDocuments(query);
    const sales = await Sale.find(query)
      .populate('customer', 'name email phone company')
      .populate('items.product', 'name sku category')
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      sales,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get sale by ID
// @route   GET /api/sales/:id
// @access  Private
const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('customer')
      .populate('items.product');

    if (!sale) {
      return res.status(404).json({ message: 'Sale record not found' });
    }

    res.json({ sale });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new sale
// @route   POST /api/sales
// @access  Private
const createSale = async (req, res) => {
  try {
    const { customerId, items, paymentMethod, paymentStatus, tax = 0, discount = 0, notes, date } = req.body;

    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Please select a customer and at least one product' });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Selected customer not found' });
    }

    // Process items and validate stock
    const processedItems = [];
    const productsToUpdate = [];
    let subtotal = 0;
    let totalCost = 0;
    let totalProfit = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId || item.product);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.name || item.productId}` });
      }

      const qty = Number(item.quantity);
      if (!qty || qty <= 0) {
        return res.status(400).json({ message: `Invalid quantity for ${product.name}` });
      }

      // Check stock
      if (product.stock < qty) {
        return res.status(400).json({
          message: `Insufficient stock for "${product.name}". Available: ${product.stock}, requested: ${qty}. Stock cannot be negative.`,
        });
      }

      const unitPrice = item.unitPrice !== undefined ? Number(item.unitPrice) : product.price;
      const unitCost = product.costPrice || 0;
      const itemSubtotal = qty * unitPrice;
      const itemCost = qty * unitCost;
      const itemProfit = itemSubtotal - itemCost;

      subtotal += itemSubtotal;
      totalCost += itemCost;
      totalProfit += itemProfit;

      processedItems.push({
        product: product._id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        quantity: qty,
        unitPrice,
        unitCost,
        subtotal: itemSubtotal,
        profit: itemProfit,
      });

      // Prepare product stock update
      product.stock -= qty;
      product.soldCount += qty;
      productsToUpdate.push(product);
    }

    const numTax = Number(tax) || 0;
    const numDiscount = Number(discount) || 0;
    const totalAmount = Math.max(0, subtotal + numTax - numDiscount);
    const finalProfit = totalProfit + numTax - numDiscount;

    // Generate unique sale number
    const timestamp = Date.now().toString().slice(-6);
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const saleNumber = `INV-${timestamp}-${randomSuffix}`;

    const sale = await Sale.create({
      saleNumber,
      customer: customer._id,
      customerName: customer.name,
      customerEmail: customer.email,
      items: processedItems,
      subtotal,
      tax: numTax,
      discount: numDiscount,
      totalAmount,
      totalCost,
      totalProfit: finalProfit,
      paymentMethod: paymentMethod || 'Credit Card',
      paymentStatus: paymentStatus || 'Paid',
      date: date ? new Date(date) : new Date(),
      notes: notes || '',
      createdBy: req.user?._id,
    });

    // Save product stock updates & check for low stock
    const io = req.app.get('io');
    for (const prod of productsToUpdate) {
      await prod.save();
      if (prod.stock <= prod.lowStockThreshold) {
        const lowStockNotif = await Notification.create({
          title: 'Low Stock Alert',
          message: `Product "${prod.name}" has only ${prod.stock} unit(s) remaining!`,
          type: 'low_stock',
          link: '/products',
        });
        if (io) io.emit('notification', lowStockNotif);
      }
    }

    // Update customer stats
    customer.totalOrders += 1;
    customer.totalSpent += totalAmount;
    await customer.save();

    // Create Sale Notification & Emit Socket Event
    const saleNotif = await Notification.create({
      title: 'New Sale Recorded',
      message: `Sale ${sale.saleNumber} completed for ₹${totalAmount.toLocaleString('en-IN')} with ${customer.name}.`,
      type: 'sale',
      link: '/sales',
    });
    if (io) {
      io.emit('notification', saleNotif);
      io.emit('sale_created', { saleNumber: sale.saleNumber, totalAmount });
    }

    res.status(201).json({ message: 'Sale created successfully', sale });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update sale status / notes
// @route   PUT /api/sales/:id
// @access  Private
const updateSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale record not found' });
    }

    const { paymentStatus, paymentMethod, notes } = req.body;

    if (paymentStatus) sale.paymentStatus = paymentStatus;
    if (paymentMethod) sale.paymentMethod = paymentMethod;
    if (notes !== undefined) sale.notes = notes;

    await sale.save();

    res.json({ message: 'Sale record updated successfully', sale });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete sale
// @route   DELETE /api/sales/:id
// @access  Private (Admin only)
const deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale record not found' });
    }

    // Restore product stock and soldCount
    for (const item of sale.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.quantity;
        product.soldCount = Math.max(0, product.soldCount - item.quantity);
        await product.save();
      }
    }

    // Restore customer stats
    const customer = await Customer.findById(sale.customer);
    if (customer) {
      customer.totalOrders = Math.max(0, customer.totalOrders - 1);
      customer.totalSpent = Math.max(0, customer.totalSpent - sale.totalAmount);
      await customer.save();
    }

    const saleNumber = sale.saleNumber;
    await sale.deleteOne();

    res.json({ message: `Sale "${saleNumber}" deleted and stock restored successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSales,
  getSaleById,
  createSale,
  updateSale,
  deleteSale,
};

