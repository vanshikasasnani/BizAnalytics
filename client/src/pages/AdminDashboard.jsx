import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

const AdminDashboard = () => {
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users'); // 'overview' | 'users' | 'activity'
  const [feedback, setFeedback] = useState({ type: '', message: '' });

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
    if (!confirm(`Delete user "${user.name}" (${user.email}) permanently?`)) return;

    try {
      const res = await api.delete(`/admin/users/${user._id}`);
      notify('success', res.data.message);
      fetchUsers();
      fetchStats();
    } catch (err) {
      notify('error', err.response?.data?.message || 'Failed to delete user');
    }
  };

  const metrics = stats?.metrics || {
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    totalProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white font-display">System Administration & Users</h1>
        <p className="text-xs text-dark-400 mt-1">Platform governance, user accounts moderation, and administrative audit log</p>
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

      {/* Admin KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="card p-4">
          <p className="text-[11px] font-medium text-dark-400 uppercase">Registered Users</p>
          <p className="text-2xl font-bold text-white mt-1 font-display">{metrics.totalUsers}</p>
          <span className="text-[10px] text-dark-500">{metrics.activeUsers} Active</span>
        </div>
        <div className="card p-4">
          <p className="text-[11px] font-medium text-dark-400 uppercase">Admins</p>
          <p className="text-2xl font-bold text-purple-400 mt-1 font-display">{metrics.adminUsers}</p>
          <span className="text-[10px] text-dark-500">Elevated access</span>
        </div>
        <div className="card p-4">
          <p className="text-[11px] font-medium text-dark-400 uppercase">Catalog Items</p>
          <p className="text-2xl font-bold text-white mt-1 font-display">{metrics.totalProducts}</p>
          <span className="text-[10px] text-dark-500">SKUs tracked</span>
        </div>
        <div className="card p-4">
          <p className="text-[11px] font-medium text-dark-400 uppercase">Total Sales</p>
          <p className="text-2xl font-bold text-cyan-400 mt-1 font-display">{metrics.totalSales}</p>
          <span className="text-[10px] text-dark-500">Orders placed</span>
        </div>
        <div className="card p-4 col-span-2">
          <p className="text-[11px] font-medium text-dark-400 uppercase">Platform Revenue</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1 font-display">{formatCurrency(metrics.totalRevenue)}</p>
          <span className="text-[10px] text-dark-500">Cumulative system billing</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-dark-700">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'users'
              ? 'border-navy-500 text-white'
              : 'border-transparent text-dark-400 hover:text-white'
          }`}
        >
          User Accounts Management ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'activity'
              ? 'border-navy-500 text-white'
              : 'border-transparent text-dark-400 hover:text-white'
          }`}
        >
          Recent Audit Activity
        </button>
      </div>

      {activeTab === 'users' ? (
        <div className="space-y-4">
          {/* Filters */}
          <div className="card p-3 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user by name or email address..."
              className="input-field text-xs flex-1"
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="select-field text-xs w-full sm:w-44"
            >
              <option value="All">All User Roles</option>
              <option value="admin">Administrators</option>
              <option value="user">Standard Users / Staff</option>
            </select>
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
                      <th className="p-3.5">Role Permission</th>
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
                                  {u.name} {isSelf && <span className="text-[10px] text-navy-400">(You)</span>}
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
                              <option value="user">User / Staff</option>
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
      ) : (
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
    </div>
  );
};

export default AdminDashboard;
