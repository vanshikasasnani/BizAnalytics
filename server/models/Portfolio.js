const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema(
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
      required: [true, 'Asset category is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
    },
    purchasePrice: {
      type: Number,
      required: [true, 'Purchase price is required'],
      min: [0, 'Purchase price cannot be negative'],
    },
    currentPrice: {
      type: Number,
      required: [true, 'Current price is required'],
      min: [0, 'Current price cannot be negative'],
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Virtual fields
assetSchema.virtual('totalInvested').get(function () {
  return this.quantity * this.purchasePrice;
});

assetSchema.virtual('currentValue').get(function () {
  return this.quantity * this.currentPrice;
});

assetSchema.virtual('profitLoss').get(function () {
  return this.currentValue - this.totalInvested;
});

assetSchema.virtual('returnPercentage').get(function () {
  if (this.totalInvested === 0) return 0;
  return ((this.profitLoss / this.totalInvested) * 100).toFixed(2);
});

assetSchema.set('toJSON', { virtuals: true });
assetSchema.set('toObject', { virtuals: true });

const portfolioSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    assets: [assetSchema],
    description: {
      type: String,
      default: 'My Investment Portfolio',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Portfolio', portfolioSchema);
