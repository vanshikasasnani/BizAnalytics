const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const User = require('./models/User');
const Portfolio = require('./models/Portfolio');
const Transaction = require('./models/Transaction');
const Watchlist = require('./models/Watchlist');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB for seeding');

    // Clean up existing collections
    await User.deleteMany({});
    await Portfolio.deleteMany({});
    await Transaction.deleteMany({});
    await Watchlist.deleteMany({});
    console.log('🧹 Cleared existing database records');

    // 1. Create Admin & Demo Users
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin',
    });

    const demoUser = await User.create({
      name: 'Demo Investor',
      email: 'demo@example.com',
      password: 'password123',
      role: 'user',
    });

    console.log('👤 Created Admin & Demo users');

    // 2. Create Portfolio for Demo User
    const portfolio = await Portfolio.create({
      user: demoUser._id,
      name: 'Core Growth Portfolio',
      description: 'Long-term equity and ETF investment strategy',
      totalValue: 54200,
      totalInvested: 45000,
      totalGainLoss: 9200,
      totalGainLossPercentage: 20.44,
      assets: [
        {
          name: 'Apple Inc.',
          symbol: 'AAPL',
          category: 'Stocks',
          quantity: 45,
          purchasePrice: 175.5,
          currentPrice: 228.0,
          purchaseDate: new Date('2024-01-15'),
          notes: 'Tech growth anchor',
        },
        {
          name: 'Microsoft Corp.',
          symbol: 'MSFT',
          category: 'Stocks',
          quantity: 30,
          purchasePrice: 380.0,
          currentPrice: 425.5,
          purchaseDate: new Date('2024-02-10'),
          notes: 'Enterprise cloud leader',
        },
        {
          name: 'Vanguard S&P 500 ETF',
          symbol: 'VOO',
          category: 'ETFs',
          quantity: 50,
          purchasePrice: 440.0,
          currentPrice: 512.0,
          purchaseDate: new Date('2023-11-20'),
          notes: 'Broad market index',
        },
        {
          name: 'US Treasury 10-Yr Bond Fund',
          symbol: 'IEF',
          category: 'Bonds',
          quantity: 40,
          purchasePrice: 94.0,
          currentPrice: 96.5,
          purchaseDate: new Date('2024-03-05'),
          notes: 'Hedging and stability',
        },
      ],
    });

    console.log('📊 Created Demo Portfolio holdings');

    // 3. Create Sample Transactions
    await Transaction.create([
      {
        user: demoUser._id,
        type: 'Deposit',
        assetName: 'Cash Funding',
        amount: 25000,
        date: new Date('2023-11-01'),
        status: 'Completed',
        notes: 'Initial account funding',
      },
      {
        user: demoUser._id,
        type: 'Buy',
        assetName: 'Vanguard S&P 500 ETF',
        assetCategory: 'ETFs',
        quantity: 50,
        price: 440.0,
        amount: 22000,
        date: new Date('2023-11-20'),
        status: 'Completed',
        notes: 'Market entry allocation',
      },
      {
        user: demoUser._id,
        type: 'Deposit',
        assetName: 'Monthly Contribution',
        amount: 20000,
        date: new Date('2024-01-05'),
        status: 'Completed',
        notes: 'Savings deposit',
      },
      {
        user: demoUser._id,
        type: 'Buy',
        assetName: 'Apple Inc.',
        assetCategory: 'Stocks',
        quantity: 45,
        price: 175.5,
        amount: 7897.5,
        date: new Date('2024-01-15'),
        status: 'Completed',
      },
      {
        user: demoUser._id,
        type: 'Buy',
        assetName: 'Microsoft Corp.',
        assetCategory: 'Stocks',
        quantity: 30,
        price: 380.0,
        amount: 11400,
        date: new Date('2024-02-10'),
        status: 'Completed',
      },
      {
        user: demoUser._id,
        type: 'Buy',
        assetName: 'US Treasury 10-Yr Bond Fund',
        assetCategory: 'Bonds',
        quantity: 40,
        price: 94.0,
        amount: 3760,
        date: new Date('2024-03-05'),
        status: 'Completed',
      },
    ]);

    console.log('💳 Created Sample Transactions');

    // 4. Create Sample Watchlist
    await Watchlist.create({
      user: demoUser._id,
      items: [
        {
          symbol: 'NVDA',
          name: 'NVIDIA Corporation',
          category: 'Stocks',
          targetPrice: 120,
          currentPrice: 135.5,
          notes: 'Looking to enter on dips below $120',
        },
        {
          symbol: 'AMZN',
          name: 'Amazon.com, Inc.',
          category: 'Stocks',
          targetPrice: 180,
          currentPrice: 195.2,
          notes: 'E-commerce and AWS growth',
        },
        {
          symbol: 'QQQ',
          name: 'Invesco QQQ Trust',
          category: 'ETFs',
          targetPrice: 460,
          currentPrice: 485.0,
          notes: 'Nasdaq-100 tracker',
        },
      ],
    });

    console.log('👀 Created Watchlist items');
    console.log('\n🎉 Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
};

seedData();
