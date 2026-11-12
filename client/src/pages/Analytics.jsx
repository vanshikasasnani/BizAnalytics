import { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import api from '../services/api';

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'];
const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

const Analytics = () => {
  const [filter, setFilter] = useState('30days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [detailedData, setDetailedData] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({ filter });
      if (filter === 'custom' && startDate && endDate) {
        params.set('startDate', startDate);
        params.set('endDate', endDate);
      }

      const [detailedRes, dashRes] = await Promise.all([
        api.get(`/analytics/detailed?${params.toString()}`),
        api.get('/analytics/dashboard'),
      ]);

      setDetailedData(detailedRes.data);
      setDashboardData(dashRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [filter, startDate, endDate]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const summary = detailedData?.summary || { revenue: 0, profit: 0, orders: 0, itemsSold: 0 };
  const profitMargin = summary.revenue > 0 ? ((summary.profit / summary.revenue) * 100).toFixed(1) : 0;
  const dashCharts = dashboardData?.charts || { monthlyRevenue: [], salesByCategory: [], topProducts: [] };

  // Calculate overall growth from latest monthly data
  const latestGrowth = dashCharts.monthlyRevenue?.length > 0
    ? dashCharts.monthlyRevenue[dashCharts.monthlyRevenue.length - 1].growth
    : 0;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header and Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-display">Business Analytics</h1>
          <p className="text-sm text-dark-300 mt-1">Detailed performance, profit margins, and sales trends</p>
        </div>

        {/* Date Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-dark-800 border border-dark-700">
          {[
            { id: '7days', label: 'Last 7 Days' },
            { id: '30days', label: 'Last 30 Days' },
            { id: '6months', label: 'Last 6 Months' },
            { id: 'thisYear', label: 'This Year' },
            { id: 'custom', label: 'Custom' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilter(btn.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                filter === btn.id
                  ? 'bg-navy-600 text-white shadow-md shadow-navy-600/30'
                  : 'text-dark-400 hover:text-white hover:bg-dark-700/60'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Pickers */}
      {filter === 'custom' && (
        <div className="card p-3 flex flex-wrap items-center gap-3">
          <span className="text-xs text-dark-400">Date Range:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input-field text-xs py-1.5 w-auto"
          />
          <span className="text-dark-500 text-xs">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="input-field text-xs py-1.5 w-auto"
          />
          <button onClick={fetchAnalytics} className="btn-primary text-xs py-1.5 px-3">
            Apply
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-400 text-sm">
          {error}
        </div>
      )}

      {/* 4 Summary Cards: Revenue, Profit, Net Profit Margin, Growth */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-navy-600/20 to-navy-500/5 border border-navy-500/20">
          <p className="text-dark-400 text-xs uppercase font-medium">Total Revenue</p>
          <p className="text-2xl sm:text-3xl font-bold text-white mt-1 font-display">
            {formatCurrency(summary.revenue)}
          </p>
          <p className="text-dark-400 text-[11px] mt-1">Across selected timeframe</p>
        </div>

        <div className="card bg-gradient-to-br from-emerald-600/20 to-emerald-500/5 border border-emerald-500/20">
          <p className="text-dark-400 text-xs uppercase font-medium">Total Profit</p>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-400 mt-1 font-display">
            {formatCurrency(summary.profit)}
          </p>
          <p className="text-dark-400 text-[11px] mt-1">Net profit after item costs</p>
        </div>

        <div className="card bg-gradient-to-br from-purple-600/20 to-purple-500/5 border border-purple-500/20">
          <p className="text-dark-400 text-xs uppercase font-medium">Net Profit Margin</p>
          <p className="text-2xl sm:text-3xl font-bold text-purple-400 mt-1 font-display">
            {profitMargin}%
          </p>
          <p className="text-dark-400 text-[11px] mt-1">Net earnings ratio</p>
        </div>

        <div className="card bg-gradient-to-br from-cyan-600/20 to-cyan-500/5 border border-cyan-500/20">
          <p className="text-dark-400 text-xs uppercase font-medium">Sales Growth</p>
          <p className={`text-2xl sm:text-3xl font-bold mt-1 font-display ${latestGrowth >= 0 ? 'text-cyan-400' : 'text-danger-400'}`}>
            {latestGrowth >= 0 ? `+${latestGrowth}%` : `${latestGrowth}%`}
          </p>
          <p className="text-dark-400 text-[11px] mt-1">{summary.orders} orders in period</p>
        </div>
      </div>

      {loading ? (
        <div className="card py-20 text-center text-dark-400 text-sm">
          <div className="w-8 h-8 border-3 border-navy-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          Loading analytics...
        </div>
      ) : !detailedData ? (
        <div className="card py-16 text-center text-dark-400 text-sm">No analytics available for this window</div>
      ) : (
        <>
          {/* Charts Row 1: Profit Analysis (Revenue vs Profit) + Sales by Category */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profit Analysis Chart */}
            <div className="card lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white">Profit Analysis</h3>
                  <p className="text-xs text-dark-400">Monthly Revenue vs Net Profit</p>
                </div>
                <span className="text-xs text-dark-400 bg-dark-700/60 px-2.5 py-1 rounded-lg">Last 12 Months</span>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dashCharts.monthlyRevenue}>
                    <defs>
                      <linearGradient id="anColorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="anColorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '0.75rem', color: '#f8fafc' }}
                      formatter={(val) => [formatCurrency(val)]}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Area type="monotone" dataKey="revenue" name="Total Revenue" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#anColorRev)" />
                    <Area type="monotone" dataKey="profit" name="Net Profit" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#anColorProfit)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sales by Category Donut */}
            <div className="card">
              <div className="mb-4">
                <h3 className="text-base font-bold text-white">Sales by Category</h3>
                <p className="text-xs text-dark-400">Revenue split across product categories</p>
              </div>
              <div className="h-72 w-full flex items-center justify-center">
                {dashCharts.salesByCategory.length === 0 ? (
                  <p className="text-dark-500 text-sm">No category data recorded</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashCharts.salesByCategory}
                        cx="50%"
                        cy="45%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="revenue"
                      >
                        {dashCharts.salesByCategory.map((entry, index) => (
                          <Cell key={`an-cell-${index}`} fill={COLORS[index % COLORS.length]} />
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

          {/* Charts Row 2: Sales Growth Trend + Monthly Orders Volume */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Growth Trend */}
            <div className="card">
              <div className="mb-4">
                <h3 className="text-base font-bold text-white">Sales Growth Trend</h3>
                <p className="text-xs text-dark-400">Month-over-month sales velocity (%)</p>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dashCharts.monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '0.75rem' }}
                      formatter={(val) => [`${val}%`, 'Growth Rate']}
                    />
                    <Line type="monotone" dataKey="growth" name="Growth" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Orders Volume */}
            <div className="card">
              <div className="mb-4">
                <h3 className="text-base font-bold text-white">Monthly Orders Volume</h3>
                <p className="text-xs text-dark-400">Number of completed orders per month</p>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashCharts.monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '0.75rem' }}
                    />
                    <Bar dataKey="orders" name="Orders Count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Tables Row: Best-Selling Products Performance + Payment Methods */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Best-Selling Products Table */}
            <div className="card lg:col-span-2">
              <div className="mb-4">
                <h3 className="text-base font-bold text-white">Best-Selling Products Performance</h3>
                <p className="text-xs text-dark-400">Revenue, units sold, and profit per product</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-dark-750 text-dark-300 uppercase text-[10px] tracking-wider border-b border-dark-700">
                    <tr>
                      <th className="py-2.5 px-3">Product</th>
                      <th className="py-2.5 px-3 text-center">Units Sold</th>
                      <th className="py-2.5 px-3 text-right">Revenue</th>
                      <th className="py-2.5 px-3 text-right">Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700/40">
                    {detailedData.productSales.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-dark-500">
                          No product sales recorded in this timeframe
                        </td>
                      </tr>
                    ) : (
                      detailedData.productSales.map((p, idx) => (
                        <tr key={idx} className="hover:bg-dark-750 transition-colors">
                          <td className="py-2.5 px-3 font-medium text-white max-w-[200px] truncate">
                            {p.name}
                          </td>
                          <td className="py-2.5 px-3 text-center text-dark-300 font-semibold">{p.quantity}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-white">{formatCurrency(p.revenue)}</td>
                          <td className="py-2.5 px-3 text-right font-semibold text-emerald-400">{formatCurrency(p.profit)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment Method Split */}
            <div className="card">
              <div className="mb-4">
                <h3 className="text-base font-bold text-white">Payment Methods</h3>
                <p className="text-xs text-dark-400">Customer payment channels</p>
              </div>
              <div className="space-y-3">
                {detailedData.paymentMethods.length === 0 ? (
                  <p className="text-dark-500 text-xs py-4 text-center">No payment data recorded</p>
                ) : (
                  detailedData.paymentMethods.map((pm, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-dark-750 border border-dark-700">
                      <div>
                        <p className="text-xs font-semibold text-white">{pm.method || 'Other'}</p>
                        <span className="text-[10px] text-dark-400">{pm.count} order(s)</span>
                      </div>
                      <p className="text-sm font-bold text-emerald-400">{formatCurrency(pm.amount)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
