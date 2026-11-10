const Watchlist = require('../models/Watchlist');

// Helper to get or create watchlist
const getOrCreateWatchlist = async (userId) => {
  let watchlist = await Watchlist.findOne({ user: userId });
  if (!watchlist) {
    watchlist = await Watchlist.create({ user: userId, items: [] });
  }
  return watchlist;
};

// @desc    Get watchlist
// @route   GET /api/watchlist
// @access  Private
const getWatchlist = async (req, res) => {
  try {
    const watchlist = await getOrCreateWatchlist(req.user._id);
    res.json({ watchlist });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add item to watchlist
// @route   POST /api/watchlist
// @access  Private
const addWatchlistItem = async (req, res) => {
  try {
    const { name, symbol, category, targetPrice, currentPrice, notes } = req.body;

    if (!name || !category) {
      return res.status(400).json({ message: 'Name and category are required' });
    }

    const watchlist = await getOrCreateWatchlist(req.user._id);

    const newItem = {
      name,
      symbol: symbol || '',
      category,
      targetPrice: targetPrice || 0,
      currentPrice: currentPrice || 0,
      notes: notes || '',
    };

    watchlist.items.push(newItem);
    await watchlist.save();

    const addedItem = watchlist.items[watchlist.items.length - 1];
    res.status(201).json({ message: 'Item added to watchlist', item: addedItem, watchlist });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete watchlist item
// @route   DELETE /api/watchlist/:id
// @access  Private
const deleteWatchlistItem = async (req, res) => {
  try {
    const watchlist = await Watchlist.findOne({ user: req.user._id });
    if (!watchlist) return res.status(404).json({ message: 'Watchlist not found' });

    const item = watchlist.items.id(req.params.id);
    if (!item) return res.status(404).json({ message: 'Watchlist item not found' });

    const itemName = item.name;
    watchlist.items.pull({ _id: req.params.id });
    await watchlist.save();

    res.json({ message: `"${itemName}" removed from watchlist` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update watchlist item
// @route   PUT /api/watchlist/:id
// @access  Private
const updateWatchlistItem = async (req, res) => {
  try {
    const watchlist = await Watchlist.findOne({ user: req.user._id });
    if (!watchlist) return res.status(404).json({ message: 'Watchlist not found' });

    const item = watchlist.items.id(req.params.id);
    if (!item) return res.status(404).json({ message: 'Watchlist item not found' });

    const { name, symbol, category, targetPrice, currentPrice, notes } = req.body;

    if (name !== undefined) item.name = name;
    if (symbol !== undefined) item.symbol = symbol;
    if (category !== undefined) item.category = category;
    if (targetPrice !== undefined) item.targetPrice = targetPrice;
    if (currentPrice !== undefined) item.currentPrice = currentPrice;
    if (notes !== undefined) item.notes = notes;

    await watchlist.save();
    res.json({ message: 'Watchlist item updated', item, watchlist });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getWatchlist, addWatchlistItem, deleteWatchlistItem, updateWatchlistItem };
