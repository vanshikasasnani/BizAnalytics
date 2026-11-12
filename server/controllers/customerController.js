const Customer = require('../models/Customer');
const Sale = require('../models/Sale');
const Notification = require('../models/Notification');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
const getCustomers = async (req, res) => {
  try {
    const { search, status, sortBy = 'createdAt', order = 'desc', page = 1, limit = 50 } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ];
    }
    if (status && status !== 'All') {
      query.status = status;
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      customers,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get customer by ID
// @route   GET /api/customers/:id
// @access  Private
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json({ customer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get customer purchase history
// @route   GET /api/customers/:id/sales
// @access  Private
const getCustomerSales = async (req, res) => {
  try {
    const sales = await Sale.find({ customer: req.params.id }).sort({ date: -1 });
    res.json({ sales });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create customer
// @route   POST /api/customers
// @access  Private
const createCustomer = async (req, res) => {
  try {
    const { name, email, phone, company, address, city, country, status, notes } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Prevent duplicate customer records by email
    const existingCustomer = await Customer.findOne({ email: cleanEmail });
    if (existingCustomer) {
      return res.status(400).json({
        message: `A customer with email "${cleanEmail}" already exists.`,
      });
    }

    const customer = await Customer.create({
      name,
      email: cleanEmail,
      phone: phone || '',
      company: company || '',
      address: address || '',
      city: city || '',
      country: country || 'India',
      status: status || 'Active',
      notes: notes || '',
    });

    // Create Notification & Emit Socket Event
    const notification = await Notification.create({
      title: 'New Customer Added',
      message: `Customer "${customer.name}" (${customer.email}) has been registered.`,
      type: 'customer',
      link: '/customers',
    });

    const io = req.app.get('io');
    if (io) io.emit('notification', notification);

    res.status(201).json({ message: 'Customer created successfully', customer });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A customer with this email already exists.' });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
const updateCustomer = async (req, res) => {
  try {
    const { name, email, phone, company, address, city, country, status, notes } = req.body;

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check duplicate email if email is being changed
    if (email) {
      const cleanEmail = email.trim().toLowerCase();
      if (cleanEmail !== customer.email) {
        const duplicate = await Customer.findOne({
          email: cleanEmail,
          _id: { $ne: customer._id },
        });
        if (duplicate) {
          return res.status(400).json({
            message: `Another customer with email "${cleanEmail}" already exists.`,
          });
        }
        customer.email = cleanEmail;
      }
    }

    customer.name = name || customer.name;
    customer.phone = phone !== undefined ? phone : customer.phone;
    customer.company = company !== undefined ? company : customer.company;
    customer.address = address !== undefined ? address : customer.address;
    customer.city = city !== undefined ? city : customer.city;
    customer.country = country !== undefined ? country : customer.country;
    customer.status = status || customer.status;
    customer.notes = notes !== undefined ? notes : customer.notes;

    const updatedCustomer = await customer.save();
    res.json({ message: 'Customer updated successfully', customer: updatedCustomer });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A customer with this email already exists.' });
    }
    res.status(500).json({ message: error.message });
  }
};
// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private (Admin only)
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const customerName = customer.name;
    await customer.deleteOne();

    res.json({ message: `Customer "${customerName}" deleted successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  getCustomerSales,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};

