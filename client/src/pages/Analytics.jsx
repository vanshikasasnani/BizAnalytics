import { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import api from '../services/api';

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

const Analytics = () => {
  const [filter, setFilter] = useState('30days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState(null);
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

      const res = await api.get(`/analytics/detailed?${params.toString()}`);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [filter, startDate, endDate]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const summary = data?.summary || { revenue: 0, profit: 0, orders: 0, itemsSold: 0 };
  const profitMargin = summary.revenue > 0 ? ((summary.profit / summary.revenue) * 100).toFixed(2) : 0;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header and Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Deep-Dive Business Analytics</h1>
          <p className="text-xs text-dark-400 mt-1">Multi-dimensional analysis of revenue velocity, margin health, and product demand</p>
        </div>

        {/* Date Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-dark-800 border border-dark-700">
          {[
            { id: '7days', label: 'Last 7 Days' },
            { id: '30days', label: 'Last 30 Days' },
            { id: '6months', label: 'Last 6 Months' },
            { id: 'thisYear', label: 'This Year' },
            { id: 'custom', label: 'Custom Range' },
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
          <span className="text-xs text-dark-400">Custom Date Span:</span>
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

      {/* Period KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-navy-600/20 to-navy-500/5 border border-navy-500/20">
          <p className="text-dark-400 text-xs uppercase font-medium">Period Revenue</p>
          <p className="text-2xl sm:text-3xl font-bold text-white mt-1 font-display">{formatCurrency(summary.revenue)}</p>
          <p className="text-dark-400 text-[11px] mt-1">Total billing across selected dates</p>
        </div>
        <div className="card bg-gradient-to-br from-emerald-600/20 to-emerald-500/5 border border-emerald-500/20">
          <p className="text-dark-400 text-xs uppercase font-medium">Period Net Profit</p>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-400 mt-1 font-display">{formatCurrency(summary.profit)}</p>
          <p className="text-dark-400 text-[11px] mt-1">{profitMargin}% average net margin</p>
        </div>
        <div className="card bg-gradient-to-br from-purple-600/20 to-purple-500/5 border border-purple-500/20">
          <p className="text-dark-400 text-xs uppercase font-medium">Completed Orders</p>
          <p className="text-2xl sm:text-3xl font-bold text-white mt-1 font-display">{summary.orders}</p>
          <p className="text-dark-400 text-[11px] mt-1">
            Avg. {summary.orders > 0 ? formatCurrency(Math.round(summary.revenue / summary.orders)) : '₹0'} / order
          </p>
        </div>
        <div className="card bg-gradient-to-br from-amber-600/20 to-amber-500/5 border border-amber-500/20">
          <p className="text-dark-400 text-xs uppercase font-medium">Units Sold</p>
          <p className="text-2xl sm:text-3xl font-bold text-white mt-1 font-display">{summary.itemsSold}</p>
          <p className="text-dark-400 text-[11px] mt-1">Total physical/digital items dispatched</p>
        </div>
      </div>

      {loading ? (
        <div className="card py-20 text-center text-dark-400 text-sm">Processing time-series metrics...</div>
      ) : !data ? (
        <div className="card py-16 text-center text-dark-400 text-sm">No analytics available for this window</div>
      ) : (
        <>
          {/* Timeline Chart */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Daily Revenue & Profit Timeline</h3>
                <p className="text-xs text-dark-400">Day-by-day financial performance over selected timeframe</p>
              </div>
            </div>
            <div className="h-72 w-full">
              {data.timeline.length === 0 ? (
                <div className="h-full flex items-center justify-center text-dark-500 text-sm">No transaction points recorded in this date range</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.timeline}>
                    <defs>
                      <linearGradient id="tRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="tProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '0.75rem', color: '#f8fafc' }}
                      formatter={(val) => [formatCurrency(val)]}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#tRev)" />
                    <Area type="monotone" dataKey="profit" name="Profit" stroke="#10b981" strokeWidth={2.5} fill="url(#tProfit)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Product Sales & Category Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Product Performance Table */}
            <div className="card">
              <h3 className="text-base font-bold text-white mb-1">Product-Wise Sales Analysis</h3>
              <p className="text-xs text-dark-400 mb-4">Volume and profit generated per SKU</p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-dark-750 text-dark-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Product Name</th>
                      <th className="p-2.5 text-center">Units</th>
                      <th className="p-2.5 text-right">Revenue</th>
                      <th className="p-2.5 text-right">Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700/50">
                    {data.productSales.map((p, idx) => (
                      <tr key={idx} className="hover:bg-dark-750">
                        <td className="p-2.5 font-medium text-white max-w-[180px] truncate">{p.name}</td>
                        <td className="p-2.5 text-center text-dark-300 font-semibold">{p.quantity}</td>
                        <td className="p-2.5 text-right font-bold text-white">{formatCurrency(p.revenue)}</td>
                        <td className="p-2.5 text-right font-semibold text-emerald-400">{formatCurrency(p.profit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Category Performance & Payment Methods */}
            <div className="space-y-6">
              {/* Category Breakdown */}
              <div className="card">
                <h3 className="text-base font-bold text-white mb-1">Category-Wise Distribution</h3>
                <p className="text-xs text-dark-400 mb-4">Revenue breakdown across departments</p>

                <div className="space-y-3">
                  {data.categorySales.map((c, i) => {
                    const pct = summary.revenue > 0 ? ((c.revenue / summary.revenue) * 100).toFixed(1) : 0;
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-white">{c.name}</span>
                          <span className="text-dark-400">{formatCurrency(c.revenue)} ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-dark-700 overflow-hidden">
                          <div
                            className="h-full bg-navy-500 rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payment Methods */}
              <div className="card">
                <h3 className="text-base font-bold text-white mb-1">Payment Method Split</h3>
                <p className="text-xs text-dark-400 mb-3">Customer settlement channel breakdown</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {data.paymentMethods.map((pm, i) => (
                    <div key={i} className="p-3 rounded-xl bg-dark-750 border border-dark-700 text-center">
                      <p className="text-xs font-semibold text-white truncate">{pm.method || 'Other'}</p>
                      <p className="text-sm font-bold text-emerald-400 mt-1">{formatCurrency(pm.amount)}</p>
                      <span className="text-[10px] text-dark-500">{pm.count} orders</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;

