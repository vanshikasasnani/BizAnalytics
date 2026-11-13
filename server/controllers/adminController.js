const User = require('../models/User');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Sale = require('../models/Sale');
const Notification = require('../models/Notification');

// @desc    Get all users (admin only)
// @route   GET /api/admin/users
// @access  Admin
const getUsers = async (req, res) => {
  try {
    const { search, role, page = 1, limit = 50 } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role && role !== 'All') {
      query.role = role;
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ users, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get admin statistics
// @route   GET /api/admin/stats
// @access  Admin
const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const staffUsers = await User.countDocuments({ role: 'user' });
    const totalProducts = await Product.countDocuments();
    const totalCustomers = await Customer.countDocuments();
    const totalSales = await Sale.countDocuments();

    const revenueResult = await Sale.aggregate([
      { $group: { _id: null, total: { $sum: '$totalAmount' }, profit: { $sum: '$totalProfit' } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;
    const totalProfit = revenueResult[0]?.profit || 0;

    // Monthly revenue and growth (past 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const monthlySalesRaw = await Sale.aggregate([
      { $match: { date: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' } },
          revenue: { $sum: '$totalAmount' },
          profit: { $sum: '$totalProfit' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let prevRevenue = 0;
    const monthlyRevenue = monthlySalesRaw.map((m) => {
      const label = `${monthNames[m._id.month - 1]} ${m._id.year}`;
      const growth = prevRevenue > 0 ? Number((((m.revenue - prevRevenue) / prevRevenue) * 100).toFixed(1)) : 0;
      prevRevenue = m.revenue;
      return {
        month: label,
        revenue: Math.round(m.revenue),
        profit: Math.round(m.profit),
        orders: m.orders,
        growth,
      };
    });

    // Best-Selling Products
    const bestSellingProducts = await Product.find()
      .sort({ soldCount: -1 })
      .limit(6)
      .select('name sku category price stock soldCount');

    // Product Category Distribution
    const categoryDistribution = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          stock: { $sum: '$stock' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Low stock products
    const lowStockProducts = await Product.find({
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
    }).sort({ stock: 1 }).limit(10);

    // Recent Sales
    const recentSales = await Sale.find()
      .sort({ date: -1 })
      .limit(6)
      .populate('customer', 'name email');

    // Recent user signups (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsers = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    // Recent audit activities (from Notifications & Sales)
    const recentActivities = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(10);

    // Monthly user growth
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
      metrics: {
        totalUsers,
        activeUsers,
        adminUsers,
        staffUsers,
        newUsers,
        totalProducts,
        totalCustomers,
        totalSales,
        totalRevenue: Math.round(totalRevenue),
        totalProfit: Math.round(totalProfit),
        lowStockCount: lowStockProducts.length,
      },
      monthlyRevenue,
      bestSellingProducts,
      categoryDistribution: categoryDistribution.map((c) => ({
        category: c._id || 'Other',
        count: c.count,
        stock: c.stock,
      })),
      recentSales,
      lowStockProducts,
      userGrowth,
      recentActivities,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle user active status
// @route   PUT /api/admin/users/:id/toggle
// @access  Admin
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot deactivate your own account' });
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

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Admin
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be user or admin' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user._id.toString() === req.user._id.toString() && role !== 'admin') {
      return res.status(400).json({ message: 'You cannot revoke your own admin rights' });
    }

    user.role = role;
    await user.save();

    res.json({ message: `Role updated to "${role}"`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const name = user.name;
    await user.deleteOne();

    res.json({ message: `User "${name}" deleted successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new staff / user (admin only)
// @route   POST /api/admin/users
// @access  Admin
const createStaffUser = async (req, res) => {
  try {
    const { name, email, password, role = 'user' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (password.length !== 8) {
      return res.status(400).json({ message: 'Password must be exactly 8 characters.' });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'This email is already registered.' });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role === 'admin' ? 'admin' : 'user',
      isActive: true,
    });

    res.status(201).json({
      message: `${user.role === 'admin' ? 'Admin' : 'Staff'} user created successfully`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update staff / user details (admin only)
// @route   PUT /api/admin/users/:id
// @access  Admin
const updateStaffUser = async (req, res) => {
  try {
    const { name, email, role, isActive } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name.trim();
    if (email && email.toLowerCase() !== user.email) {
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Please enter a valid email address.' });
      }
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res.status(400).json({ message: 'This email is already in use by another user.' });
      }
      user.email = email.toLowerCase().trim();
    }

    if (role && ['user', 'admin'].includes(role)) {
      if (user._id.toString() === req.user._id.toString() && role !== 'admin') {
        return res.status(400).json({ message: 'You cannot revoke your own admin rights' });
      }
      user.role = role;
    }

    if (typeof isActive === 'boolean') {
      if (user._id.toString() === req.user._id.toString() && !isActive) {
        return res.status(400).json({ message: 'You cannot deactivate your own account' });
      }
      user.isActive = isActive;
    }

    await user.save();
    res.json({ message: 'User details updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUsers,
  getAdminStats,
  toggleUserStatus,
  updateUserRole,
  deleteUser,
  createStaffUser,
  updateStaffUser,
};
