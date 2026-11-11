import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import api from '../services/api';

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'];

const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

const StatCard = ({ title, value, subtitle, icon, color = 'navy', badge }) => {
  const colorStyles = {
    navy: 'from-navy-600/20 to-navy-500/5 border-navy-500/20 text-navy-400',
    success: 'from-success-600/20 to-success-500/5 border-success-500/20 text-success-400',
    emerald: 'from-emerald-600/20 to-emerald-500/5 border-emerald-500/20 text-emerald-400',
    cyan: 'from-cyan-600/20 to-cyan-500/5 border-cyan-500/20 text-cyan-400',
    amber: 'from-amber-600/20 to-amber-500/5 border-amber-500/20 text-amber-400',
    purple: 'from-purple-600/20 to-purple-500/5 border-purple-500/20 text-purple-400',
  };

  return (
    <div className={`card bg-gradient-to-br ${colorStyles[color]} border hover:scale-[1.01] transition-all duration-200`}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-dark-700/60 flex items-center justify-center text-xl">
          {icon}
        </div>
        {badge && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-dark-700 text-dark-300">
            {badge}
          </span>
        )}
      </div>
      <p className="text-dark-400 text-xs font-medium uppercase tracking-wider">{title}</p>
      <p className="text-2xl sm:text-3xl font-bold text-white mt-1 font-display tracking-tight">{value}</p>
      {subtitle && <p className="text-dark-400 text-xs mt-1.5">{subtitle}</p>}
    </div>
  );
};

const Dashboard = () => {
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
          <p className="text-dark-400 text-sm">Aggregating business performance metrics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card text-center py-12">
        <p className="text-danger-400 font-semibold mb-2">Error Loading Dashboard</p>
        <p className="text-dark-400 text-sm mb-4">{error || 'Could not retrieve database records'}</p>
        <button onClick={fetchDashboard} className="btn-primary">
          Retry
        </button>
      </div>
    );
  }

  const { cards, charts, recentSales, topProducts, recentCustomers } = data;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Notice Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-navy-900/60 to-dark-800 border border-navy-500/20">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-navy-500/20 text-navy-400 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Live System Data
          </span>
          <h2 className="text-xl font-bold text-white font-display">Business Performance & Analytics</h2>
          <p className="text-xs text-dark-400 mt-0.5">Real-time sales, revenue, products, and customer analytics from MongoDB</p>
        </div>
        <div className="flex gap-2">
          <Link to="/sales" className="btn-primary text-xs">
            + New Sale
          </Link>
          <Link to="/reports" className="btn-secondary text-xs">
            Export Reports
          </Link>
        </div>
      </div>

      {/* 6 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(cards.totalRevenue)}
          subtitle="Cumulative gross sales"
          icon="💰"
          color="navy"
        />
        <StatCard
          title="Total Profit"
          value={formatCurrency(cards.totalProfit)}
          subtitle={`${cards.profitMargin}% net margin`}
          icon="📈"
          color="success"
        />
        <StatCard
          title="Total Sales"
          value={cards.totalSales}
          subtitle="Completed transactions"
          icon="💳"
          color="cyan"
        />
        <StatCard
          title="Total Orders"
          value={cards.totalOrders}
          subtitle={`Avg. ₹${cards.averageOrderValue}/order`}
          icon="🛍️"
          color="purple"
        />
        <StatCard
          title="Total Customers"
          value={cards.totalCustomers}
          subtitle="Registered accounts"
          icon="👥"
          color="amber"
        />
        <StatCard
          title="Total Products"
          value={cards.totalProducts}
          subtitle={`${cards.lowStockCount} low in stock`}
          icon="📦"
          color="emerald"
          badge={cards.lowStockCount > 0 ? `${cards.lowStockCount} Low` : 'Healthy'}
        />
      </div>

      {/* Charts Grid 1: Revenue & Profit Comparison + Sales by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue & Profit Chart */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Monthly Revenue & Profit</h3>
              <p className="text-xs text-dark-400">Comparing top-line gross revenue vs bottom-line net profit</p>
            </div>
            <span className="text-xs text-dark-400 bg-dark-700/60 px-2.5 py-1 rounded-lg">Last 12 Months</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.monthlyRevenue}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '0.75rem', color: '#f8fafc' }}
                  formatter={(val) => [formatCurrency(val)]}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="revenue" name="Gross Revenue" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="profit" name="Net Profit" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Category Pie */}
        <div className="card">
          <div className="mb-4">
            <h3 className="text-base font-bold text-white">Sales by Category</h3>
            <p className="text-xs text-dark-400">Revenue contribution per product sector</p>
          </div>
          <div className="h-72 w-full flex items-center justify-center">
            {charts.salesByCategory.length === 0 ? (
              <p className="text-dark-500 text-sm">No sales category data available</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.salesByCategory}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="revenue"
                  >
                    {charts.salesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '0.75rem', color: '#f8fafc' }}
                    formatter={(val) => [formatCurrency(val), 'Revenue']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', bottom: '0px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Charts Grid 2: Sales Growth + Monthly Orders + Top Products Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Growth Chart */}
        <div className="card">
          <div className="mb-4">
            <h3 className="text-base font-bold text-white">Sales Growth Trend</h3>
            <p className="text-xs text-dark-400">Month-over-month revenue velocity (%)</p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '0.75rem' }}
                  formatter={(val) => [`${val}%`, 'Growth Rate']}
                />
                <Line type="monotone" dataKey="growth" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Orders Chart */}
        <div className="card">
          <div className="mb-4">
            <h3 className="text-base font-bold text-white">Monthly Orders Volume</h3>
            <p className="text-xs text-dark-400">Total transaction count per month</p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '0.75rem' }}
                />
                <Bar dataKey="orders" name="Order Count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top-Selling Products Bar Chart */}
        <div className="card">
          <div className="mb-4">
            <h3 className="text-base font-bold text-white">Top-Selling Products</h3>
            <p className="text-xs text-dark-400">Highest volume items sold</p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} width={90} tickFormatter={(v) => v.slice(0, 12) + '...'} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '0.75rem' }}
                  formatter={(val, name) => [val, name === 'sales' ? 'Units Sold' : name]}
                />
                <Bar dataKey="sales" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables Row: Recent Sales & Top Products & Recent Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sales Transactions */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Recent Sales Transactions</h3>
              <p className="text-xs text-dark-400">Latest completed customer orders</p>
            </div>
            <Link to="/sales" className="text-xs text-navy-400 hover:text-navy-300 font-medium">
              View All Sales →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-dark-700/50 text-dark-300 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">Invoice</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3 rounded-r-lg">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/40">
                {recentSales.map((s) => (
                  <tr key={s._id} className="hover:bg-dark-750 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-medium text-navy-300">{s.saleNumber}</td>
                    <td className="py-2.5 px-3 text-white font-medium">{s.customerName}</td>
                    <td className="py-2.5 px-3 text-dark-400">
                      {new Date(s.date).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-emerald-400">
                      {formatCurrency(s.totalAmount)}
                    </td>
                    <td className="py-2.5 px-3 text-dark-300">{s.paymentMethod}</td>
                    <td className="py-2.5 px-3">
                      <span className="badge bg-success-500/10 text-success-400 border border-success-500/20">
                        {s.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Customers List */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Recent Customers</h3>
              <p className="text-xs text-dark-400">Newly acquired accounts</p>
            </div>
            <Link to="/customers" className="text-xs text-navy-400 hover:text-navy-300 font-medium">
              View All →
            </Link>
          </div>

          <div className="space-y-3">
            {recentCustomers.map((c) => (
              <div key={c._id} className="flex items-center justify-between p-2.5 rounded-xl bg-dark-750/50 border border-dark-700/60">
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-semibold text-white truncate">{c.name}</p>
                  <p className="text-[11px] text-dark-400 truncate">{c.email}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-semibold text-white">{formatCurrency(c.totalSpent)}</p>
                  <span className="text-[10px] text-dark-500">{c.totalOrders} order(s)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
