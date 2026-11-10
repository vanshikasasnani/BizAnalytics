import { useState, useEffect, useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

const formatCurrency = (val) => `₹${Number(val).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const formatPct = (val) => `${Number(val) >= 0 ? '+' : ''}${Number(val).toFixed(2)}%`;

const StatCard = ({ title, value, subtitle, icon, trend, color = 'navy' }) => {
  const colorMap = {
    navy: 'from-navy-600/20 to-navy-500/5 border-navy-500/20',
    success: 'from-success-600/20 to-success-500/5 border-success-500/20',
    danger: 'from-danger-600/20 to-danger-500/5 border-danger-500/20',
    purple: 'from-purple-600/20 to-purple-500/5 border-purple-500/20',
  };

  return (
    <div className={`stat-card bg-gradient-to-br ${colorMap[color]} border`}>
      <div className="flex items-start justify-between mb-3">
        <div className="text-2xl">{icon}</div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            trend >= 0 ? 'bg-success-500/10 text-success-400' : 'bg-danger-500/10 text-danger-400'
          }`}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(2)}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-dark-400 text-sm">{title}</div>
      {subtitle && <div className="text-dark-500 text-xs mt-0.5">{subtitle}</div>}
    </div>
  );
};

// Sample performance data for chart
const generatePerformanceData = (assets) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  return months.map((month, i) => {
    const factor = 0.85 + i * 0.03;
    const invested = assets.reduce((s, a) => s + a.quantity * a.purchasePrice, 0);
    const current = assets.reduce((s, a) => s + a.quantity * a.currentPrice, 0);
    return {
      month,
      Invested: Math.round(invested * factor),
      'Current Value': Math.round(current * factor),
    };
  });
};

const Dashboard = () => {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [portRes, txRes] = await Promise.all([
          api.get('/portfolio'),
          api.get('/transactions?limit=5'),
        ]);
        setPortfolio(portRes.data.portfolio);
        setTransactions(txRes.data.transactions);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = useMemo(() => {
    if (!portfolio) return {};
    const assets = portfolio.assets || [];
    const totalInvested = assets.reduce((s, a) => s + a.quantity * a.purchasePrice, 0);
    const currentValue = assets.reduce((s, a) => s + a.quantity * a.currentPrice, 0);
    const profitLoss = currentValue - totalInvested;
    const returnPct = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;
    return { totalInvested, currentValue, profitLoss, returnPct, assetCount: assets.length };
  }, [portfolio]);

  const allocationData = useMemo(() => {
    if (!portfolio?.assets?.length) return [];
    const byCategory = {};
    portfolio.assets.forEach((a) => {
      const val = a.quantity * a.currentPrice;
      byCategory[a.category] = (byCategory[a.category] || 0) + val;
    });
    return Object.entries(byCategory).map(([name, value]) => ({ name, value: Math.round(value) }));
  }, [portfolio]);

  const performanceData = useMemo(() => {
    if (!portfolio?.assets?.length) return [];
    return generatePerformanceData(portfolio.assets);
  }, [portfolio]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="spinner mx-auto mb-3"></div>
          <p className="text-dark-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="alert-error">{error}</div>;
  }

  const hasAssets = portfolio?.assets?.length > 0;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">👋 Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="page-subtitle">Here's your portfolio overview for today</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          icon="💰"
          title="Total Portfolio Value"
          value={formatCurrency(stats.currentValue || 0)}
          color="navy"
        />
        <StatCard
          icon="💵"
          title="Total Invested"
          value={formatCurrency(stats.totalInvested || 0)}
          color="purple"
        />
        <StatCard
          icon={stats.profitLoss >= 0 ? '📈' : '📉'}
          title="Profit / Loss"
          value={formatCurrency(Math.abs(stats.profitLoss || 0))}
          subtitle={stats.profitLoss >= 0 ? 'Overall gain' : 'Overall loss'}
          trend={stats.returnPct}
          color={stats.profitLoss >= 0 ? 'success' : 'danger'}
        />
        <StatCard
          icon="🗂️"
          title="Total Assets"
          value={stats.assetCount || 0}
          subtitle={`Across ${allocationData.length} categories`}
          color="navy"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Performance chart */}
        <div className="card lg:col-span-2">
          <h2 className="text-white font-semibold mb-4">Investment Performance</h2>
          {hasAssets ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(v) => formatCurrency(v)}
                />
                <Legend wrapperStyle={{ paddingTop: '16px' }} />
                <Area type="monotone" dataKey="Invested" stroke="#6366f1" fill="url(#colorInvested)" strokeWidth={2} />
                <Area type="monotone" dataKey="Current Value" stroke="#22c55e" fill="url(#colorCurrent)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-3">📊</div>
                <p className="text-dark-400">Add assets to see your performance chart</p>
              </div>
            </div>
          )}
        </div>

        {/* Allocation pie */}
        <div className="card">
          <h2 className="text-white font-semibold mb-4">Portfolio Allocation</h2>
          {allocationData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {allocationData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                    formatter={(v) => formatCurrency(v)}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {allocationData.map((item, i) => {
                  const total = allocationData.reduce((s, a) => s + a.value, 0);
                  const pct = ((item.value / total) * 100).toFixed(1);
                  return (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-dark-300">{item.name}</span>
                      </div>
                      <span className="text-dark-400">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl mb-2">🥧</div>
                <p className="text-dark-400 text-sm">No assets yet</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Asset breakdown & Recent transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset breakdown */}
        <div className="card">
          <h2 className="text-white font-semibold mb-4">Asset Breakdown</h2>
          {hasAssets ? (
            <div className="space-y-3">
              {portfolio.assets.slice(0, 5).map((asset) => {
                const invested = asset.quantity * asset.purchasePrice;
                const current = asset.quantity * asset.currentPrice;
                const pnl = current - invested;
                const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
                return (
                  <div key={asset._id} className="flex items-center justify-between p-3 bg-dark-700/40 rounded-xl hover:bg-dark-700/70 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-navy-500/15 flex items-center justify-center text-sm flex-shrink-0">
                        {asset.category === 'Stocks' ? '📈' : asset.category === 'ETFs' ? '🏦' : asset.category === 'Bonds' ? '📄' : asset.category === 'Mutual Funds' ? '🏛️' : '💼'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{asset.name}</p>
                        <p className="text-dark-500 text-xs">{asset.category}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="text-white text-sm font-semibold">{formatCurrency(current)}</p>
                      <p className={`text-xs font-medium ${pnl >= 0 ? 'text-success-400' : 'text-danger-400'}`}>
                        {pnl >= 0 ? '+' : ''}{formatPct(pnlPct)}
                      </p>
                    </div>
                  </div>
                );
              })}
              {portfolio.assets.length > 5 && (
                <p className="text-dark-500 text-xs text-center pt-1">+{portfolio.assets.length - 5} more assets</p>
              )}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">💼</div>
              <p className="text-dark-400">No assets in your portfolio yet</p>
              <a href="/portfolio" className="text-navy-400 text-sm hover:text-navy-300 mt-2 inline-block">Add your first asset →</a>
            </div>
          )}
        </div>

        {/* Recent transactions */}
        <div className="card">
          <h2 className="text-white font-semibold mb-4">Recent Transactions</h2>
          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((tx) => {
                const typeColors = {
                  Buy: 'bg-success-500/10 text-success-400',
                  Sell: 'bg-danger-500/10 text-danger-400',
                  Deposit: 'bg-navy-500/10 text-navy-400',
                  Withdrawal: 'bg-yellow-500/10 text-yellow-400',
                };
                return (
                  <div key={tx._id} className="flex items-center justify-between p-3 bg-dark-700/40 rounded-xl">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`badge ${typeColors[tx.type]} flex-shrink-0`}>{tx.type}</span>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{tx.assetName || tx.type}</p>
                        <p className="text-dark-500 text-xs">{new Date(tx.date).toLocaleDateString('en-IN')}</p>
                      </div>
                    </div>
                    <p className="text-white text-sm font-semibold flex-shrink-0 ml-3">{formatCurrency(tx.amount)}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">↔️</div>
              <p className="text-dark-400">No transactions recorded yet</p>
              <a href="/transactions" className="text-navy-400 text-sm hover:text-navy-300 mt-2 inline-block">Record your first transaction →</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
