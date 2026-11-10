const Transaction = require('../models/Transaction');

// @desc    Get all transactions for user
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res) => {
  try {
    const { type, startDate, endDate, search, page = 1, limit = 20 } = req.query;

    const filter = { user: req.user._id };

    if (type && type !== 'All') filter.type = type;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    if (search) {
      filter.assetName = { $regex: search, $options: 'i' };
    }

    const total = await Transaction.countDocuments(filter);
    const transactions = await Transaction.find(filter)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      transactions,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create transaction
// @route   POST /api/transactions
// @access  Private
const createTransaction = async (req, res) => {
  try {
    const { type, assetName, assetCategory, quantity, price, amount, date, notes } = req.body;

    if (!type || !amount) {
      return res.status(400).json({ message: 'Type and amount are required' });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    // For Buy/Sell, asset info is required
    if ((type === 'Buy' || type === 'Sell') && !assetName) {
      return res.status(400).json({ message: 'Asset name is required for Buy/Sell transactions' });
    }

    const transaction = await Transaction.create({
      user: req.user._id,
      type,
      assetName: assetName || '',
      assetCategory: assetCategory || '',
      quantity: quantity || 0,
      price: price || 0,
      amount: Number(amount),
      date: date || Date.now(),
      notes: notes || '',
    });

    // Emit Socket.IO notification
    const io = req.app.get('io');
    if (io) {
      io.to(req.user._id.toString()).emit('notification', {
        type: 'transaction_created',
        message: `New ${type} transaction recorded${assetName ? ` for ${assetName}` : ''}`,
        timestamp: new Date(),
      });
    }

    res.status(201).json({ message: 'Transaction created successfully', transaction });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Private
const updateTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const { type, assetName, assetCategory, quantity, price, amount, date, notes, status } = req.body;

    if (type !== undefined) transaction.type = type;
    if (assetName !== undefined) transaction.assetName = assetName;
    if (assetCategory !== undefined) transaction.assetCategory = assetCategory;
    if (quantity !== undefined) transaction.quantity = quantity;
    if (price !== undefined) transaction.price = price;
    if (amount !== undefined) transaction.amount = amount;
    if (date !== undefined) transaction.date = date;
    if (notes !== undefined) transaction.notes = notes;
    if (status !== undefined) transaction.status = status;

    const updated = await transaction.save();
    res.json({ message: 'Transaction updated successfully', transaction: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private
const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    await transaction.deleteOne();
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getTransactions, createTransaction, updateTransaction, deleteTransaction };
