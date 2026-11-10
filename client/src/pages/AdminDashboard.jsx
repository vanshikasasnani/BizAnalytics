import { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const fetchData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data.users);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await api.get(`/admin/users?search=${userSearch}`);
      setUsers(data.users);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to search users');
    }
  }, [userSearch]);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
  }, [fetchUsers, activeTab]);

  const handleToggleUser = async (userId, name, currentStatus) => {
    if (!confirm(`${currentStatus ? 'Deactivate' : 'Activate'} user "${name}"?`)) return;
    try {
      await api.put(`/admin/users/${userId}/toggle`);
      setSuccess(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      fetchData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user');
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleDeleteUser = async (userId, name) => {
    if (!confirm(`Permanently delete user "${name}" and all their data?`)) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setSuccess('User deleted successfully');
      fetchData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
      setTimeout(() => setError(''), 4000);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;
  if (error && !stats) return <div className="alert-error">{error}</div>;

  const userGrowthData = stats?.userGrowth?.map((item) => ({
    month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
    Users: item.count,
  })) || [];

  const txBreakdown = stats?.transactionBreakdown || [];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">🛡️ Admin Dashboard</h1>
        <p className="page-subtitle">Platform overview and user management</p>
      </div>

      {error && <div className="alert-error mb-4">{error}</div>}
      {success && <div className="alert-success mb-4">{success}</div>}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-dark-700 pb-0">
        {['overview', 'users', 'activity'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
              activeTab === tab
                ? 'border-navy-500 text-white'
                : 'border-transparent text-dark-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {[
              { label: 'Total Users', value: stats?.stats?.totalUsers, icon: '👥', color: 'from-navy-600/20 to-navy-500/5 border-navy-500/20' },
              { label: 'Active Users', value: stats?.stats?.activeUsers, icon: '✅', color: 'from-success-600/20 to-success-500/5 border-success-500/20' },
              { label: 'Total Transactions', value: stats?.stats?.totalTransactions, icon: '↔️', color: 'from-purple-600/20 to-purple-500/5 border-purple-500/20' },
              { label: 'New This Week', value: stats?.stats?.newUsersThisWeek, icon: '🆕', color: 'from-yellow-600/20 to-yellow-500/5 border-yellow-500/20' },
            ].map((s) => (
              <div key={s.label} className={`stat-card bg-gradient-to-br ${s.color} border`}>
                <div className="text-2xl mb-2">{s.icon}</div>
                <div className="text-3xl font-bold text-white">{s.value ?? '—'}</div>
                <div className="text-dark-400 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-white font-semibold mb-4">User Growth (Last 6 Months)</h3>
              {userGrowthData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }} />
                    <Bar dataKey="Users" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-dark-400">Not enough data</div>
              )}
            </div>

            <div className="card">
              <h3 className="text-white font-semibold mb-4">Transaction Breakdown</h3>
              {txBreakdown.length > 0 ? (
                <div className="space-y-3">
                  {txBreakdown.map((item) => {
                    const typeColors = { Buy: 'bg-success-500', Sell: 'bg-danger-500', Deposit: 'bg-navy-500', Withdrawal: 'bg-yellow-500' };
                    const maxCount = Math.max(...txBreakdown.map((t) => t.count));
                    return (
                      <div key={item._id} className="flex items-center gap-3">
                        <div className="w-16 text-dark-300 text-sm">{item._id}</div>
                        <div className="flex-1 bg-dark-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${typeColors[item._id] || 'bg-dark-500'}`}
                            style={{ width: `${(item.count / maxCount) * 100}%` }}
                          />
                        </div>
                        <div className="text-dark-400 text-sm w-6 text-right">{item.count}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-dark-400">No transactions yet</div>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'users' && (
        <>
          <div className="mb-5">
            <input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="input-field max-w-sm"
              placeholder="Search users by name or email..."
            />
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td className="text-white font-medium">{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-navy' : 'badge-success'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                    <td>
                      {u.role !== 'admin' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleUser(u._id, u.name, u.isActive)}
                            className={`text-xs font-medium px-2 py-1 rounded-lg transition-colors ${u.isActive ? 'text-yellow-400 hover:bg-yellow-500/10' : 'text-success-400 hover:bg-success-500/10'}`}
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u._id, u.name)}
                            className="text-danger-400 hover:text-danger-300 text-xs font-medium px-2 py-1 rounded-lg hover:bg-danger-500/10 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="text-center py-10 text-dark-400">No users found</div>
            )}
          </div>
        </>
      )}

      {activeTab === 'activity' && (
        <div className="card">
          <h3 className="text-white font-semibold mb-4">Recent Platform Activity</h3>
          {stats?.recentTransactions?.length > 0 ? (
            <div className="space-y-3">
              {stats.recentTransactions.map((tx) => (
                <div key={tx._id} className="flex items-center justify-between p-3 bg-dark-700/40 rounded-xl">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`badge flex-shrink-0 ${
                      tx.type === 'Buy' ? 'badge-success' : tx.type === 'Sell' ? 'badge-danger' : 'badge-navy'
                    }`}>
                      {tx.type}
                    </span>
                    <div className="min-w-0">
                      <p className="text-white text-sm truncate">{tx.assetName || tx.type}</p>
                      <p className="text-dark-500 text-xs">{tx.user?.name} · {tx.user?.email}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-white text-sm font-semibold">₹{Number(tx.amount).toLocaleString('en-IN')}</p>
                    <p className="text-dark-500 text-xs">{new Date(tx.date).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-dark-400">No recent activity</div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
