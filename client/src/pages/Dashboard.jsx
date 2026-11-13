import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

const StatCard = ({ title, value, subtitle, icon, color = 'navy' }) => {
  const colorStyles = {
    navy: 'from-navy-600/20 to-navy-500/5 border-navy-500/20 text-navy-400',
    purple: 'from-purple-600/20 to-purple-500/5 border-purple-500/20 text-purple-400',
    amber: 'from-amber-600/20 to-amber-500/5 border-amber-500/20 text-amber-400',
    emerald: 'from-emerald-600/20 to-emerald-500/5 border-emerald-500/20 text-emerald-400',
  };

  return (
    <div className={`card bg-gradient-to-br ${colorStyles[color]} border p-5 transition-all duration-200`}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-dark-700/60 flex items-center justify-center text-xl">
          {icon}
        </div>
      </div>
      <p className="text-dark-400 text-xs font-medium uppercase tracking-wider">{title}</p>
      <p className="text-2xl sm:text-3xl font-bold text-white mt-1 font-display tracking-tight">{value}</p>
      {subtitle && <p className="text-dark-400 text-xs mt-1.5">{subtitle}</p>}
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/analytics/dashboard');
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-navy-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-dark-400 text-sm">Loading business overview...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card text-center py-12">
        <p className="text-danger-400 font-semibold mb-2">Error Loading Dashboard</p>
        <p className="text-dark-400 text-sm mb-4">{error || 'Could not load data. Please try again.'}</p>
        <button onClick={fetchDashboard} className="btn-primary">
          Retry
        </button>
      </div>
    );
  }

  const { cards, charts, recentSales } = data;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. Header with simple title & subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-display">
              {user?.role === 'admin' ? 'Business Overview' : 'Staff Dashboard'}
            </h1>
            <span className="badge bg-navy-500/10 text-navy-400 border border-navy-500/20 text-xs px-2.5 py-0.5 font-semibold">
              {user?.role === 'admin' ? 'Business View' : 'Staff View'}
            </span>
          </div>
          <p className="text-sm text-dark-300 mt-1">
            {user?.role === 'admin'
              ? "Welcome back! Here's how your business is doing."
              : `Welcome, ${user?.name || 'Staff Member'}! Manage orders, catalog products, and customer relations.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {user?.role === 'admin' && (
            <Link to="/admin" className="btn-secondary text-xs flex items-center gap-1.5 border-purple-500/30 text-purple-300 hover:text-white">
              <span>🛡️</span>
              <span>Admin Dashboard</span>
            </Link>
          )}
          <Link to="/sales" className="btn-primary text-xs flex items-center gap-1.5">
            <span>+</span>
            <span>New Sale</span>
          </Link>
          <Link to="/reports" className="btn-secondary text-xs">
            Export Reports
          </Link>
        </div>
      </div>

      {/* Low stock warning banner - displayed only when lowStockCount > 0 */}
      {cards.lowStockCount > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <span>
              <strong>Low Stock Notice:</strong> {cards.lowStockCount} product{cards.lowStockCount > 1 ? 's have' : ' has'} low inventory.
            </span>
          </div>
          <Link to="/products" className="font-semibold text-amber-400 hover:text-amber-200 underline whitespace-nowrap">
            View Products →
          </Link>
        </div>
      )}

      {/* 2. Four Main Cards: Revenue, Orders, Customers, Products */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(cards.totalRevenue)}
          subtitle="Cumulative gross sales"
          icon="💰"
          color="navy"
        />
        <StatCard
          title="Total Orders"
          value={cards.totalOrders}
          subtitle={`Avg. ${formatCurrency(cards.averageOrderValue)} / order`}
          icon="🛍️"
          color="purple"
        />
        <StatCard
          title="Total Customers"
          value={cards.totalCustomers}
          subtitle="Registered customer accounts"
          icon="👥"
          color="amber"
        />
        <StatCard
          title="Total Products"
          value={cards.totalProducts}
          subtitle={cards.lowStockCount > 0 ? `${cards.lowStockCount} items low in stock` : 'All items in stock'}
          icon="📦"
          color="emerald"
        />
      </div>

      {/* 3. Two Visualizations: Monthly Sales Overview + Best-Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Sales Overview */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Monthly Sales Overview</h3>
              <p className="text-xs text-dark-400">Total sales revenue per month</p>
            </div>
            <Link to="/analytics" className="text-xs text-navy-400 hover:text-navy-300 font-medium">
              Detailed Analytics →
            </Link>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.monthlyRevenue}>
                <defs>
                  <linearGradient id="colorMonthlyRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '0.75rem', color: '#f8fafc' }}
                  formatter={(val) => [formatCurrency(val), 'Sales Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Sales Revenue"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorMonthlyRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Best-Selling Products */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Best-Selling Products</h3>
              <p className="text-xs text-dark-400">Top 5 products by units sold</p>
            </div>
            <Link to="/products" className="text-xs text-navy-400 hover:text-navy-300 font-medium">
              All Products →
            </Link>
          </div>
          <div className="h-64 w-full">
            {charts.topProducts.length === 0 ? (
              <div className="h-full flex items-center justify-center text-dark-500 text-sm">
                No product sales recorded yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.topProducts.slice(0, 5)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={11}
                    width={110}
                    tickFormatter={(v) => (v.length > 15 ? `${v.slice(0, 15)}...` : v)}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '0.75rem', color: '#f8fafc' }}
                    formatter={(val) => [val, 'Units Sold']}
                  />
                  <Bar dataKey="sales" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* 4. Recent Sales Table (Full width, renamed, no recent customers panel) */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Recent Sales</h3>
            <p className="text-xs text-dark-400">Latest completed customer orders</p>
          </div>
          <Link to="/sales" className="text-xs text-navy-400 hover:text-navy-300 font-medium">
            View All →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-dark-750 text-dark-300 uppercase text-[10px] tracking-wider border-b border-dark-700">
              <tr>
                <th className="py-2.5 px-3">Invoice Number</th>
                <th className="py-2.5 px-3">Customer Name</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Payment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/40">
              {recentSales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-dark-500">
                    No sales recorded yet. Click "+ New Sale" to record your first order.
                  </td>
                </tr>
              ) : (
                recentSales.map((s) => (
                  <tr key={s._id} className="hover:bg-dark-750 transition-colors">
                    <td className="py-3 px-3 font-mono font-medium text-navy-300">{s.saleNumber}</td>
                    <td className="py-3 px-3 text-white font-medium">
                      {s.customer?.name || s.customerName || 'Customer'}
                    </td>
                    <td className="py-3 px-3 text-dark-400">
                      {new Date(s.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 font-semibold text-emerald-400">
                      {formatCurrency(s.totalAmount)}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`badge ${
                        s.paymentStatus === 'Paid'
                          ? 'bg-success-500/10 text-success-400 border border-success-500/20'
                          : s.paymentStatus === 'Pending'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-dark-700 text-dark-300'
                      }`}>
                        {s.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
