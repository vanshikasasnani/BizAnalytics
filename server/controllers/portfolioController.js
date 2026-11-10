const Portfolio = require('../models/Portfolio');

// Helper to get or create portfolio for user
const getOrCreatePortfolio = async (userId) => {
  let portfolio = await Portfolio.findOne({ user: userId });
  if (!portfolio) {
    portfolio = await Portfolio.create({ user: userId, assets: [] });
  }
  return portfolio;
};

// @desc    Get user portfolio
// @route   GET /api/portfolio
// @access  Private
const getPortfolio = async (req, res) => {
  try {
    const portfolio = await getOrCreatePortfolio(req.user._id);
    res.json({ portfolio });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add asset to portfolio
// @route   POST /api/portfolio
// @access  Private
const addAsset = async (req, res) => {
  try {
    const { name, symbol, category, quantity, purchasePrice, currentPrice, purchaseDate, notes } = req.body;

    if (!name || !category || !quantity || !purchasePrice || !currentPrice) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    if (quantity <= 0) return res.status(400).json({ message: 'Quantity must be greater than 0' });
    if (purchasePrice <= 0) return res.status(400).json({ message: 'Purchase price must be greater than 0' });
    if (currentPrice <= 0) return res.status(400).json({ message: 'Current price must be greater than 0' });

    const portfolio = await getOrCreatePortfolio(req.user._id);

    const newAsset = {
      name,
      symbol: symbol || '',
      category,
      quantity: Number(quantity),
      purchasePrice: Number(purchasePrice),
      currentPrice: Number(currentPrice),
      purchaseDate: purchaseDate || Date.now(),
      notes: notes || '',
    };

    portfolio.assets.push(newAsset);
    await portfolio.save();

    const addedAsset = portfolio.assets[portfolio.assets.length - 1];

    // Emit Socket.IO notification
    const io = req.app.get('io');
    if (io) {
      io.to(req.user._id.toString()).emit('notification', {
        type: 'asset_added',
        message: `Asset "${name}" added to your portfolio`,
        timestamp: new Date(),
      });
    }

    res.status(201).json({
      message: 'Asset added successfully',
      asset: addedAsset,
      portfolio,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single portfolio asset
// @route   GET /api/portfolio/:id
// @access  Private
const getAsset = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ user: req.user._id });
    if (!portfolio) return res.status(404).json({ message: 'Portfolio not found' });

    const asset = portfolio.assets.id(req.params.id);
    if (!asset) return res.status(404).json({ message: 'Asset not found' });

    res.json({ asset });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update asset
// @route   PUT /api/portfolio/:id
// @access  Private
const updateAsset = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ user: req.user._id });
    if (!portfolio) return res.status(404).json({ message: 'Portfolio not found' });

    const asset = portfolio.assets.id(req.params.id);
    if (!asset) return res.status(404).json({ message: 'Asset not found' });

    const { name, symbol, category, quantity, purchasePrice, currentPrice, purchaseDate, notes } = req.body;

    if (name !== undefined) asset.name = name;
    if (symbol !== undefined) asset.symbol = symbol;
    if (category !== undefined) asset.category = category;
    if (quantity !== undefined) asset.quantity = Number(quantity);
    if (purchasePrice !== undefined) asset.purchasePrice = Number(purchasePrice);
    if (currentPrice !== undefined) asset.currentPrice = Number(currentPrice);
    if (purchaseDate !== undefined) asset.purchaseDate = purchaseDate;
    if (notes !== undefined) asset.notes = notes;

    await portfolio.save();

    // Emit Socket.IO notification
    const io = req.app.get('io');
    if (io) {
      io.to(req.user._id.toString()).emit('notification', {
        type: 'portfolio_updated',
        message: `Portfolio updated: "${asset.name}" details changed`,
        timestamp: new Date(),
      });
    }

    res.json({ message: 'Asset updated successfully', asset, portfolio });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete asset
// @route   DELETE /api/portfolio/:id
// @access  Private
const deleteAsset = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ user: req.user._id });
    if (!portfolio) return res.status(404).json({ message: 'Portfolio not found' });

    const asset = portfolio.assets.id(req.params.id);
    if (!asset) return res.status(404).json({ message: 'Asset not found' });

    const assetName = asset.name;
    portfolio.assets.pull({ _id: req.params.id });
    await portfolio.save();

    res.json({ message: `Asset "${assetName}" deleted successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getPortfolio, addAsset, getAsset, updateAsset, deleteAsset };
