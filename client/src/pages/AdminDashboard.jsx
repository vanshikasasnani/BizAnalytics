import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

// Modal for Adding or Editing Staff User
const StaffUserModal = ({ user, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'user',
    isActive: user ? user.isActive : true,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.email) {
      return setError('Name and email are required');
    }

    if (!user && (!form.password || form.password.length !== 8)) {
      return setError('Password must be exactly 8 characters.');
    }

    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save staff user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700 bg-dark-850">
          <h2 className="text-white font-bold text-base font-display">
            {user ? 'Edit Staff User Details' : 'Add New Staff / User'}
          </h2>
          <button onClick={onClose} className="text-dark-400 hover:text-white p-1 rounded-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-400 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="label">Full Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field text-xs w-full"
              placeholder="e.g. Ramesh Sharma"
              required
            />
          </div>

          <div>
            <label className="label">Email Address *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input-field text-xs w-full"
              placeholder="e.g. staff@bizanalytics.com"
              required
            />
          </div>

          {!user && (
            <div>
              <label className="label">Initial Password * (Exactly 8 chars)</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input-field text-xs font-mono"
                placeholder="8 characters"
                maxLength={8}
                required
              />
              <p className="text-[11px] text-dark-400 mt-1">Must be exactly 8 characters.</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Account Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="select-field text-xs"
              >
                <option value="user">Staff / Normal User</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            {user && (
              <div>
                <label className="label">Status</label>
                <select
                  value={form.isActive ? 'true' : 'false'}
                  onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}
                  className="select-field text-xs"
                >
                  <option value="true">Active</option>
                  <option value="false">Deactivated</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs px-4 py-2"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-xs px-5 py-2 flex items-center gap-2"
              disabled={saving}
            >
              {saving && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
              <span>{user ? 'Save Changes' : 'Create User'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'activity'
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  const notify = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (err) {
      notify('error', 'Failed to load administrator statistics');
    }
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roleFilter !== 'All') params.set('role', roleFilter);

      const res = await api.get(`/admin/users?${params.toString()}`);
      setUsers(res.data.users || []);
    } catch (err) {
      notify('error', 'Failed to retrieve user accounts');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async (user) => {
    if (user._id === currentUser._id) {
      return notify('error', 'You cannot deactivate your own administrative account');
    }

    try {
      const res = await api.put(`/admin/users/${user._id}/toggle`);
      notify('success', res.data.message);
      fetchUsers();
      fetchStats();
    } catch (err) {
      notify('error', err.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleRoleChange = async (user, newRole) => {
    if (user._id === currentUser._id && newRole !== 'admin') {
      return notify('error', 'You cannot remove your own admin privileges');
    }

    try {
      const res = await api.put(`/admin/users/${user._id}/role`, { role: newRole });
      notify('success', res.data.message);
      fetchUsers();
      fetchStats();
    } catch (err) {
      notify('error', err.response?.data?.message || 'Failed to update user role');
    }
  };

  const handleDeleteUser = async (user) => {
    if (user._id === currentUser._id) {
      return notify('error', 'You cannot delete your own account');
    }
    if (!confirm(`Are you sure you want to permanently delete user "${user.name}" (${user.email})?`)) return;

    try {
      const res = await api.delete(`/admin/users/${user._id}`);
      notify('success', res.data.message);
      fetchUsers();
      fetchStats();
    } catch (err) {
      notify('error', err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleSaveStaffUser = async (formData) => {
    if (selectedUserForEdit) {
      // Update
      const res = await api.put(`/admin/users/${selectedUserForEdit._id}`, formData);
      notify('success', res.data.message);
    } else {
      // Create
      const res = await api.post('/admin/users', formData);
      notify('success', res.data.message);
    }
    fetchUsers();
    fetchStats();
  };

  const metrics = stats?.metrics || {
    totalRevenue: 0,
    totalSales: 0,
    totalCustomers: 0,
    totalProducts: 0,
    staffUsers: 0,
    totalUsers: 0,
    totalProfit: 0,
    lowStockCount: 0,
  };

  const monthlyRevenue = stats?.monthlyRevenue || [];
  const bestSellingProducts = stats?.bestSellingProducts || [];
  const categoryDistribution = stats?.categoryDistribution || [];
  const recentSales = stats?.recentSales || [];
  const lowStockProducts = stats?.lowStockProducts || [];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-display">Admin Dashboard</h1>
            <span className="badge bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs px-2.5 py-0.5 font-semibold">
              Full Privileges
            </span>
          </div>
          <p className="text-xs sm:text-sm text-dark-300 mt-1">
            Executive oversight, company analytics, inventory alerts, and user administration
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedUserForEdit(null);
              setShowUserModal(true);
            }}
            className="btn-primary text-xs flex items-center gap-1.5"
          >
            <span>+</span>
            <span>Add Staff User</span>
          </button>
          <Link
            to="/messages"
            className="btn-secondary text-xs flex items-center gap-1.5 border-blue-500/30 text-blue-300 hover:text-white"
          >
            <span>💬</span>
            <span>Messages</span>
          </Link>
          <Link to="/reports" className="btn-secondary text-xs">
            Export All Data
          </Link>
        </div>
      </div>

      {feedback.message && (
        <div className={`p-4 rounded-xl text-sm font-medium ${
          feedback.type === 'success'
            ? 'bg-success-500/10 border border-success-500/20 text-success-400'
            : 'bg-danger-500/10 border border-danger-500/20 text-danger-400'
        }`}>
          {feedback.message}
        </div>
      )}

      {/* 1. Overview Cards (6 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="card p-4 border border-emerald-500/20 bg-gradient-to-br from-emerald-600/15 to-emerald-500/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg">💰</span>
            <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded">Gross</span>
          </div>
          <p className="text-[11px] font-medium text-dark-400 uppercase tracking-wider">Total Revenue</p>
          <p className="text-xl sm:text-2xl font-bold text-white mt-1 font-display truncate">
            {formatCurrency(metrics.totalRevenue)}
          </p>
          <span className="text-[10px] text-dark-400 mt-1 block">Cumulative billing</span>
        </div>

        {/* Total Sales */}
        <div className="card p-4 border border-cyan-500/20 bg-gradient-to-br from-cyan-600/15 to-cyan-500/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg">💳</span>
            <span className="text-[10px] text-cyan-400 font-semibold bg-cyan-500/10 px-1.5 py-0.5 rounded">Orders</span>
          </div>
          <p className="text-[11px] font-medium text-dark-400 uppercase tracking-wider">Total Sales</p>
          <p className="text-xl sm:text-2xl font-bold text-white mt-1 font-display">
            {metrics.totalSales}
          </p>
          <span className="text-[10px] text-dark-400 mt-1 block">Invoices generated</span>
        </div>

        {/* Total Customers */}
        <div className="card p-4 border border-navy-500/20 bg-gradient-to-br from-navy-600/15 to-navy-500/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg">👥</span>
            <span className="text-[10px] text-navy-400 font-semibold bg-navy-500/10 px-1.5 py-0.5 rounded">Clients</span>
          </div>
          <p className="text-[11px] font-medium text-dark-400 uppercase tracking-wider">Total Customers</p>
          <p className="text-xl sm:text-2xl font-bold text-white mt-1 font-display">
            {metrics.totalCustomers}
          </p>
          <span className="text-[10px] text-dark-400 mt-1 block">In directory</span>
        </div>

        {/* Total Products */}
        <div className="card p-4 border border-indigo-500/20 bg-gradient-to-br from-indigo-600/15 to-indigo-500/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg">📦</span>
            <span className="text-[10px] text-indigo-400 font-semibold bg-indigo-500/10 px-1.5 py-0.5 rounded">SKUs</span>
          </div>
          <p className="text-[11px] font-medium text-dark-400 uppercase tracking-wider">Total Products</p>
          <p className="text-xl sm:text-2xl font-bold text-white mt-1 font-display">
            {metrics.totalProducts}
          </p>
          <span className="text-[10px] text-dark-400 mt-1 block">Catalog inventory</span>
        </div>

        {/* Total Staff Users */}
        <div className="card p-4 border border-purple-500/20 bg-gradient-to-br from-purple-600/15 to-purple-500/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg">🛡️</span>
            <span className="text-[10px] text-purple-400 font-semibold bg-purple-500/10 px-1.5 py-0.5 rounded">Team</span>
          </div>
          <p className="text-[11px] font-medium text-dark-400 uppercase tracking-wider">Total Staff Users</p>
          <p className="text-xl sm:text-2xl font-bold text-white mt-1 font-display">
            {metrics.staffUsers || (metrics.totalUsers - metrics.adminUsers)}
          </p>
          <span className="text-[10px] text-dark-400 mt-1 block">{metrics.totalUsers} Total Accounts</span>
        </div>

        {/* Total Profit */}
        <div className="card p-4 border border-emerald-500/20 bg-gradient-to-br from-emerald-600/20 to-teal-500/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg">📈</span>
            <span className="text-[10px] text-emerald-300 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded">Net</span>
          </div>
          <p className="text-[11px] font-medium text-dark-400 uppercase tracking-wider">Total Profit</p>
          <p className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1 font-display truncate">
            {formatCurrency(metrics.totalProfit)}
          </p>
          <span className="text-[10px] text-dark-400 mt-1 block">After product costs</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-dark-700">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'overview'
              ? 'border-purple-500 text-white'
              : 'border-transparent text-dark-400 hover:text-white'
          }`}
        >
          Analytics & Performance
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'users'
              ? 'border-purple-500 text-white'
              : 'border-transparent text-dark-400 hover:text-white'
          }`}
        >
          Staff & User Management ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'activity'
              ? 'border-purple-500 text-white'
              : 'border-transparent text-dark-400 hover:text-white'
          }`}
        >
          System Audit Log
        </button>
      </div>

      {/* Tab 1: Analytics & Business Performance */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Revenue Chart */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-white text-sm font-display">Monthly Revenue Trend</h3>
                  <p className="text-[11px] text-dark-400">Total gross revenue collected per month</p>
                </div>
                <span className="text-xs font-medium text-emerald-400">Live MongoDB</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyRevenue}>
                    <defs>
                      <linearGradient id="adminRevGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#232838" />
                    <XAxis dataKey="month" stroke="#62708d" tick={{ fontSize: 11 }} />
                    <YAxis
                      stroke="#62708d"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                    />
                    <Tooltip
                      formatter={(v) => [formatCurrency(v), 'Revenue']}
                      contentStyle={{ backgroundColor: '#131722', border: '1px solid #283046', borderRadius: '0.75rem', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#adminRevGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sales Growth Chart */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-white text-sm font-display">Monthly Net Profit vs Orders</h3>
                  <p className="text-[11px] text-dark-400">Profit generation across billing cycles</p>
                </div>
                <span className="text-xs font-medium text-purple-400">Profit Margins</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#232838" />
                    <XAxis dataKey="month" stroke="#62708d" tick={{ fontSize: 11 }} />
                    <YAxis
                      stroke="#62708d"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                    />
                    <Tooltip
                      formatter={(v) => [formatCurrency(v), 'Net Profit']}
                      contentStyle={{ backgroundColor: '#131722', border: '1px solid #283046', borderRadius: '0.75rem', fontSize: '12px' }}
                    />
                    <Bar dataKey="profit" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Best Selling Products & Category Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Best Selling Products */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white text-sm font-display">Best-Selling Products</h3>
                <Link to="/products" className="text-xs text-navy-400 hover:text-navy-300">View Catalog →</Link>
              </div>
              <div className="space-y-3">
                {bestSellingProducts.length === 0 ? (
                  <p className="text-xs text-dark-400 py-6 text-center">No sales recorded yet</p>
                ) : (
                  bestSellingProducts.map((p, idx) => (
                    <div key={p._id} className="flex items-center justify-between p-3 rounded-xl bg-dark-750/50 hover:bg-dark-750 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-navy-500/20 text-navy-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{p.name}</p>
                          <p className="text-[10px] text-dark-400">{p.category} • SKU: {p.sku}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold text-emerald-400">{p.soldCount || 0} units sold</p>
                        <p className="text-[10px] text-dark-400">Stock: {p.stock}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Product Category Distribution */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white text-sm font-display">Product Category Distribution</h3>
                <span className="text-xs text-dark-400">{categoryDistribution.length} Categories</span>
              </div>
              <div className="space-y-3.5">
                {categoryDistribution.length === 0 ? (
                  <p className="text-xs text-dark-400 py-6 text-center">No categories recorded</p>
                ) : (
                  categoryDistribution.map((c) => {
                    const percentage = metrics.totalProducts > 0
                      ? Math.round((c.count / metrics.totalProducts) * 100)
                      : 0;
                    return (
                      <div key={c.category} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-dark-200 font-medium">{c.category}</span>
                          <span className="text-dark-400">{c.count} items ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-dark-700 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(5, percentage))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Low Stock & Recent Sales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Low Stock Products */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-sm font-display">Low Stock Inventory Alerts</h3>
                  {lowStockProducts.length > 0 && (
                    <span className="badge bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px]">
                      {lowStockProducts.length} items critical
                    </span>
                  )}
                </div>
                <Link to="/products" className="text-xs text-navy-400 hover:text-navy-300">Restock →</Link>
              </div>
              {lowStockProducts.length === 0 ? (
                <div className="py-8 text-center text-xs text-emerald-400 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                  ✓ All products have adequate inventory above reorder threshold.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {lowStockProducts.map((p) => (
                    <div key={p._id} className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-white">{p.name}</p>
                        <p className="text-[10px] text-amber-300/80">SKU: {p.sku} • Reorder threshold: {p.lowStockThreshold}</p>
                      </div>
                      <span className="badge bg-amber-500/20 text-amber-300 font-bold text-xs">
                        {p.stock === 0 ? 'Out of Stock' : `${p.stock} units left`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Sales Transactions */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white text-sm font-display">Recent Sales Orders</h3>
                <Link to="/sales" className="text-xs text-navy-400 hover:text-navy-300">View All →</Link>
              </div>
              {recentSales.length === 0 ? (
                <p className="text-xs text-dark-400 py-8 text-center">No sales orders found</p>
              ) : (
                <div className="space-y-2.5">
                  {recentSales.map((sale) => (
                    <div key={sale._id} className="p-3 rounded-xl bg-dark-750/50 hover:bg-dark-750 flex items-center justify-between transition-colors">
                      <div>
                        <p className="text-xs font-semibold text-white">{sale.saleNumber}</p>
                        <p className="text-[10px] text-dark-400">{sale.customer?.name || 'Walk-in'} • {new Date(sale.date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-white">{formatCurrency(sale.totalAmount)}</p>
                        <span className={`badge text-[10px] ${sale.paymentStatus === 'Paid' ? 'bg-success-500/10 text-success-400' : 'bg-amber-500/10 text-amber-400'}`}>
                          {sale.paymentStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Staff & User Management */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Filters & Add User */}
          <div className="card p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search staff or user by name or email..."
                className="input-field text-xs flex-1"
              />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="select-field text-xs w-full sm:w-48"
              >
                <option value="All">All User Roles</option>
                <option value="admin">Administrators</option>
                <option value="user">Staff / Normal Users</option>
              </select>
            </div>

            <button
              onClick={() => {
                setSelectedUserForEdit(null);
                setShowUserModal(true);
              }}
              className="btn-primary text-xs flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <span>+</span>
              <span>Add Staff</span>
            </button>
          </div>

          {/* Users Table */}
          <div className="card overflow-hidden p-0">
            {loading ? (
              <div className="py-12 text-center text-dark-400 text-xs">Loading user accounts...</div>
            ) : users.length === 0 ? (
              <div className="py-12 text-center text-dark-400 text-xs">No users matching search criteria</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-dark-750 text-dark-400 uppercase text-[10px] border-b border-dark-700">
                    <tr>
                      <th className="p-3.5">User</th>
                      <th className="p-3.5">Role</th>
                      <th className="p-3.5">Account Status</th>
                      <th className="p-3.5">Joined Date</th>
                      <th className="p-3.5 text-right">Moderation Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700/50">
                    {users.map((u) => {
                      const isSelf = u._id === currentUser?._id;

                      return (
                        <tr key={u._id} className="hover:bg-dark-750 transition-colors">
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center font-bold text-white text-xs">
                                {u.name?.[0]?.toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-white">
                                  {u.name} {isSelf && <span className="text-[10px] text-purple-400 font-medium">(You)</span>}
                                </p>
                                <span className="text-dark-400 text-[11px]">{u.email}</span>
                              </div>
                            </div>
                          </td>

                          <td className="p-3.5">
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u, e.target.value)}
                              disabled={isSelf}
                              className="bg-dark-700 text-white rounded-lg px-2 py-1 text-xs border border-dark-600 focus:outline-none disabled:opacity-60"
                            >
                              <option value="user">Staff / User</option>
                              <option value="admin">Administrator</option>
                            </select>
                          </td>

                          <td className="p-3.5">
                            <span className={`badge ${
                              u.isActive ? 'bg-success-500/10 text-success-400 border border-success-500/20' : 'bg-danger-500/10 text-danger-400 border border-danger-500/20'
                            }`}>
                              {u.isActive ? 'Active' : 'Deactivated'}
                            </span>
                          </td>

                          <td className="p-3.5 text-dark-400">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>

                          <td className="p-3.5 text-right space-x-2">
                            {/* Message Staff User */}
                            {!isSelf && (
                              <Link
                                to={`/messages?user=${u._id}`}
                                className="px-2.5 py-1 text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors font-medium inline-flex items-center gap-1"
                              >
                                <span>💬</span>
                                <span>Chat</span>
                              </Link>
                            )}

                            {/* Edit Button */}
                            <button
                              onClick={() => {
                                setSelectedUserForEdit(u);
                                setShowUserModal(true);
                              }}
                              className="px-2.5 py-1 text-xs bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors font-medium"
                            >
                              Edit
                            </button>

                            {/* Activate / Deactivate */}
                            <button
                              onClick={() => handleToggleStatus(u)}
                              disabled={isSelf}
                              className={`px-2.5 py-1 text-xs rounded-lg transition-colors font-medium ${
                                u.isActive
                                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400'
                                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                              } disabled:opacity-40 disabled:cursor-not-allowed`}
                            >
                              {u.isActive ? 'Deactivate' : 'Activate'}
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteUser(u)}
                              disabled={isSelf}
                              className="px-2.5 py-1 text-xs bg-danger-500/10 hover:bg-danger-500/20 text-danger-400 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: System Audit Log */}
      {activeTab === 'activity' && (
        <div className="card divide-y divide-dark-700/50 p-0 overflow-hidden">
          {stats?.recentActivities?.length === 0 ? (
            <div className="py-12 text-center text-dark-400 text-xs">No recent administrative activities recorded</div>
          ) : (
            stats.recentActivities.map((act) => (
              <div key={act._id} className="p-4 flex items-start gap-3">
                <span className="text-xl">🔔</span>
                <div className="min-w-0 flex-1 text-xs">
                  <p className="font-semibold text-white">{act.title}</p>
                  <p className="text-dark-300 mt-0.5">{act.message}</p>
                  <span className="text-[10px] text-dark-500 mt-1 block">
                    {new Date(act.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Staff User Add/Edit Modal */}
      {showUserModal && (
        <StaffUserModal
          user={selectedUserForEdit}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUserForEdit(null);
          }}
          onSave={handleSaveStaffUser}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
