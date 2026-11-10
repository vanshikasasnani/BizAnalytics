const mongoose = require('mongoose');

const watchlistItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Asset name is required'],
      trim: true,
    },
    symbol: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },
    category: {
      type: String,
      enum: ['Stocks', 'Mutual Funds', 'ETFs', 'Bonds', 'Other'],
      required: [true, 'Category is required'],
    },
    targetPrice: {
      type: Number,
      default: 0,
    },
    currentPrice: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const watchlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: [watchlistItemSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Watchlist', watchlistSchema);
