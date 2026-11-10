const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const Transaction = require('../models/Transaction');
const Watchlist = require('../models/Watchlist');

// @desc    Get all users (admin)
// @route   GET /api/admin/users
// @access  Admin
const getUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ users, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get platform statistics (admin)
// @route   GET /api/admin/stats
// @access  Admin
const getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const totalTransactions = await Transaction.countDocuments();
    const totalPortfolios = await Portfolio.countDocuments();
    const totalWatchlists = await Watchlist.countDocuments();

    // Recent users (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsersThisWeek = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    // Recent transactions
    const recentTransactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name email');

    // Transaction type breakdown
    const transactionBreakdown = await Transaction.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
    ]);

    // User registration per month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({
      stats: {
        totalUsers,
        activeUsers,
        adminUsers,
        totalTransactions,
        totalPortfolios,
        totalWatchlists,
        newUsersThisWeek,
      },
      transactionBreakdown,
      userGrowth,
      recentTransactions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle user active status (admin)
// @route   PUT /api/admin/users/:id/toggle
// @access  Admin
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot deactivate admin accounts' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user: { _id: user._id, name: user.name, email: user.email, isActive: user.isActive },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user (admin)
// @route   DELETE /api/admin/users/:id
// @access  Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin accounts' });
    }

    // Delete related data
    await Portfolio.deleteOne({ user: user._id });
    await Transaction.deleteMany({ user: user._id });
    await Watchlist.deleteOne({ user: user._id });
    await user.deleteOne();

    res.json({ message: 'User and all associated data deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getUsers, getStats, toggleUserStatus, deleteUser };
