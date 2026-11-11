const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const User = require('../models/User');

// Helper to calculate date range filter
const getDateFilter = (filterType, customStart, customEnd) => {
  const now = new Date();
  let startDate = null;
  let endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999);

  if (filterType === '7days') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (filterType === '30days') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (filterType === '6months') {
    startDate = new Date(now);
    startDate.setMonth(now.getMonth() - 6);
  } else if (filterType === 'thisYear') {
    startDate = new Date(now.getFullYear(), 0, 1);
  } else if (filterType === 'custom' && customStart && customEnd) {
    startDate = new Date(customStart);
    endDate = new Date(customEnd);
    endDate.setHours(23, 59, 59, 999);
  } else {
    // Default: all time or past 12 months
    startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
  }

  return { startDate, endDate };
};

// @desc    Get dashboard metrics & summary
// @route   GET /api/analytics/dashboard
// @access  Private
const getDashboardData = async (req, res) => {
  try {
    // 1. Total Products & Customers
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ status: 'Active' });
    const lowStockProducts = await Product.countDocuments({
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
    });
    const totalCustomers = await Customer.countDocuments();

    // 2. Sales Aggregates
    const salesAggregate = await Sale.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalProfit: { $sum: '$totalProfit' },
          totalCost: { $sum: '$totalCost' },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: '$totalAmount' },
        },
      },
    ]);

    const stats = salesAggregate[0] || {
      totalRevenue: 0,
      totalProfit: 0,
      totalCost: 0,
      totalOrders: 0,
      averageOrderValue: 0,
    };

    // 3. Monthly Revenue, Profit, and Orders (Last 6-12 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 11);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyDataRaw = await Sale.aggregate([
      { $match: { date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          revenue: { $sum: '$totalAmount' },
          profit: { $sum: '$totalProfit' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let prevRev = 0;
    const monthlyData = monthlyDataRaw.map((item) => {
      const monthLabel = `${monthNames[item._id.month - 1]} ${item._id.year}`;
      const growth = prevRev > 0 ? Number((((item.revenue - prevRev) / prevRev) * 100).toFixed(1)) : 0;
      prevRev = item.revenue;

      return {
        month: monthLabel,
        revenue: Math.round(item.revenue),
        profit: Math.round(item.profit),
        orders: item.orders,
        growth,
      };
    });

    // 4. Sales by Category
    const categoryDataRaw = await Sale.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.category',
          revenue: { $sum: '$items.subtotal' },
          quantity: { $sum: '$items.quantity' },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    const categoryData = categoryDataRaw.map((c) => ({
      name: c._id || 'Other',
      revenue: Math.round(c.revenue),
      quantity: c.quantity,
    }));

    // 5. Top-Selling Products
    const topProductsRaw = await Product.find()
      .sort({ soldCount: -1 })
      .limit(5)
      .select('name sku category price stock soldCount');

    // 6. Recent Sales Transactions
    const recentSales = await Sale.find()
      .sort({ date: -1 })
      .limit(5)
      .populate('customer', 'name email');

    // 7. Recent Customers
    const recentCustomers = await Customer.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email phone totalOrders totalSpent createdAt');

    // 8. Performance Summary
    const profitMargin = stats.totalRevenue > 0
      ? Number(((stats.totalProfit / stats.totalRevenue) * 100).toFixed(2))
      : 0;

    res.json({
      cards: {
        totalRevenue: Math.round(stats.totalRevenue),
        totalSales: stats.totalOrders,
        totalOrders: stats.totalOrders,
        totalCustomers,
        totalProducts,
        totalProfit: Math.round(stats.totalProfit),
        profitMargin,
        averageOrderValue: Math.round(stats.averageOrderValue || 0),
        lowStockCount: lowStockProducts,
        activeProducts,
      },
      charts: {
        monthlyRevenue: monthlyData,
        salesByCategory: categoryData,
        topProducts: topProductsRaw.map((p) => ({
          name: p.name,
          sales: p.soldCount,
          revenue: Math.round(p.soldCount * p.price),
        })),
      },
      recentSales,
      topProducts: topProductsRaw,
      recentCustomers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get detailed analytics with date filtering
// @route   GET /api/analytics/detailed
// @access  Private
const getDetailedAnalytics = async (req, res) => {
  try {
    const { filter = '30days', startDate: qStart, endDate: qEnd } = req.query;
    const { startDate, endDate } = getDateFilter(filter, qStart, qEnd);

    const matchQuery = { date: { $gte: startDate, $lte: endDate } };

    // Overview in period
    const overview = await Sale.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$totalAmount' },
          profit: { $sum: '$totalProfit' },
          orders: { $sum: 1 },
          itemsSold: { $sum: { $size: '$items' } },
        },
      },
    ]);

    // Product-wise sales in period
    const productSales = await Sale.aggregate([
      { $match: matchQuery },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          category: { $first: '$items.category' },
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.subtotal' },
          profit: { $sum: '$items.profit' },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]);

    // Category-wise performance in period
    const categorySales = await Sale.aggregate([
      { $match: matchQuery },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.category',
          revenue: { $sum: '$items.subtotal' },
          profit: { $sum: '$items.profit' },
          quantity: { $sum: '$items.quantity' },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    // Daily breakdown for period
    const timeline = await Sale.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          revenue: { $sum: '$totalAmount' },
          profit: { $sum: '$totalProfit' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Payment methods breakdown
    const paymentMethods = await Sale.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          amount: { $sum: '$totalAmount' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({
      filter,
      dateRange: { startDate, endDate },
      summary: overview[0] || { revenue: 0, profit: 0, orders: 0, itemsSold: 0 },
      productSales: productSales.map((p) => ({
        name: p._id,
        category: p.category,
        quantity: p.quantity,
        revenue: Math.round(p.revenue),
        profit: Math.round(p.profit),
      })),
      categorySales: categorySales.map((c) => ({
        name: c._id || 'Other',
        revenue: Math.round(c.revenue),
        profit: Math.round(c.profit),
        quantity: c.quantity,
      })),
      timeline: timeline.map((t) => ({
        date: t._id,
        revenue: Math.round(t.revenue),
        profit: Math.round(t.profit),
        orders: t.orders,
      })),
      paymentMethods: paymentMethods.map((pm) => ({
        method: pm._id,
        count: pm.count,
        amount: Math.round(pm.amount),
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Download CSV reports
// @route   GET /api/analytics/export/:reportType
// @access  Private
const exportReportCSV = async (req, res) => {
  try {
    const { reportType } = req.params; // 'sales', 'products', 'customers'
    const { filter = 'all', startDate: qStart, endDate: qEnd } = req.query;

    let csvContent = '';
    const nowStr = new Date().toISOString().split('T')[0];

    if (reportType === 'sales') {
      const query = {};
      if (filter !== 'all') {
        const { startDate, endDate } = getDateFilter(filter, qStart, qEnd);
        query.date = { $gte: startDate, $lte: endDate };
      }

      const sales = await Sale.find(query).sort({ date: -1 });

      // CSV Header
      csvContent += 'Invoice Number,Date,Customer Name,Customer Email,Items Count,Subtotal,Tax,Discount,Total Amount,Total Profit,Payment Method,Payment Status\n';

      sales.forEach((s) => {
        const d = new Date(s.date).toISOString().split('T')[0];
        const row = [
          `"${s.saleNumber}"`,
          `"${d}"`,
          `"${(s.customerName || '').replace(/"/g, '""')}"`,
          `"${(s.customerEmail || '').replace(/"/g, '""')}"`,
          s.items?.length || 0,
          s.subtotal,
          s.tax,
          s.discount,
          s.totalAmount,
          s.totalProfit,
          `"${s.paymentMethod}"`,
          `"${s.paymentStatus}"`,
        ];
        csvContent += row.join(',') + '\n';
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=sales_report_${nowStr}.csv`);
      return res.send(csvContent);
    } else if (reportType === 'products') {
      const products = await Product.find().sort({ name: 1 });

      csvContent += 'SKU,Product Name,Category,Price,Cost Price,Profit Margin (%),Current Stock,Low Stock Threshold,Sold Count,Status\n';

      products.forEach((p) => {
        const row = [
          `"${p.sku}"`,
          `"${(p.name || '').replace(/"/g, '""')}"`,
          `"${p.category}"`,
          p.price,
          p.costPrice,
          p.profitMargin || 0,
          p.stock,
          p.lowStockThreshold,
          p.soldCount,
          `"${p.status}"`,
        ];
        csvContent += row.join(',') + '\n';
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=inventory_report_${nowStr}.csv`);
      return res.send(csvContent);
    } else if (reportType === 'customers') {
      const customers = await Customer.find().sort({ totalSpent: -1 });

      csvContent += 'Customer Name,Email,Phone,Company,City,Country,Total Orders,Total Spent,Status\n';

      customers.forEach((c) => {
        const row = [
          `"${(c.name || '').replace(/"/g, '""')}"`,
          `"${c.email}"`,
          `"${c.phone || ''}"`,
          `"${(c.company || '').replace(/"/g, '""')}"`,
          `"${(c.city || '').replace(/"/g, '""')}"`,
          `"${c.country || ''}"`,
          c.totalOrders,
          c.totalSpent,
          `"${c.status}"`,
        ];
        csvContent += row.join(',') + '\n';
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=customer_report_${nowStr}.csv`);
      return res.send(csvContent);
    } else {
      return res.status(400).json({ message: 'Invalid report type. Supported: sales, products, customers' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardData,
  getDetailedAnalytics,
  exportReportCSV,
};

