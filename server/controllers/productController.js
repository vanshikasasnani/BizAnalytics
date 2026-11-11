const Product = require('../models/Product');
const Notification = require('../models/Notification');

// @desc    Get all products
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res) => {
  try {
    const { search, category, status, sortBy = 'createdAt', order = 'desc', page = 1, limit = 50 } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (category && category !== 'All') {
      query.category = category;
    }
    if (status && status !== 'All') {
      query.status = status;
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj = { [sortBy]: sortOrder };

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      products,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Private
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private (Admin or Staff)
const createProduct = async (req, res) => {
  try {
    const { name, sku, description, category, price, costPrice, stock, lowStockThreshold, status } = req.body;

    if (!name || !sku || price === undefined || costPrice === undefined || stock === undefined) {
      return res.status(400).json({ message: 'Please provide name, SKU, price, cost price, and stock' });
    }

    if (Number(price) < 0 || Number(costPrice) < 0 || Number(stock) < 0) {
      return res.status(400).json({ message: 'Price, cost price, and stock must be non-negative' });
    }

    const existingSku = await Product.findOne({ sku: sku.trim().toUpperCase() });
    if (existingSku) {
      return res.status(400).json({ message: `Product with SKU "${sku.toUpperCase()}" already exists` });
    }

    const product = await Product.create({
      name,
      sku: sku.trim().toUpperCase(),
      description: description || '',
      category: category || 'Electronics',
      price: Number(price),
      costPrice: Number(costPrice),
      stock: Number(stock),
      lowStockThreshold: lowStockThreshold !== undefined ? Number(lowStockThreshold) : 5,
      status: status || 'Active',
    });

    // Create Notification & Emit Socket Event
    const notification = await Notification.create({
      title: 'New Product Added',
      message: `Product "${product.name}" (${product.sku}) added with ${product.stock} units in stock.`,
      type: 'product',
      link: '/products',
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('notification', notification);
    }

    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin or Staff)
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const { name, sku, description, category, price, costPrice, stock, lowStockThreshold, status } = req.body;

    if (sku && sku.trim().toUpperCase() !== product.sku) {
      const existingSku = await Product.findOne({ sku: sku.trim().toUpperCase() });
      if (existingSku) {
        return res.status(400).json({ message: `SKU "${sku.toUpperCase()}" is already in use` });
      }
      product.sku = sku.trim().toUpperCase();
    }

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (category !== undefined) product.category = category;
    if (price !== undefined) product.price = Number(price);
    if (costPrice !== undefined) product.costPrice = Number(costPrice);
    if (stock !== undefined) product.stock = Number(stock);
    if (lowStockThreshold !== undefined) product.lowStockThreshold = Number(lowStockThreshold);
    if (status !== undefined) product.status = status;

    await product.save();

    // Check if stock is low
    if (product.stock <= product.lowStockThreshold && product.stock > 0) {
      const notification = await Notification.create({
        title: 'Low Stock Alert',
        message: `Product "${product.name}" is low on stock (${product.stock} remaining)!`,
        type: 'low_stock',
        link: '/products',
      });
      const io = req.app.get('io');
      if (io) io.emit('notification', notification);
    }

    res.json({ message: 'Product updated successfully', product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin only)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const productName = product.name;
    await product.deleteOne();

    res.json({ message: `Product "${productName}" deleted successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};

