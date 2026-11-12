import { useState, useEffect } from 'react';
import api from '../services/api';

const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

const Reports = () => {
  const [activeTab, setActiveTab] = useState('sales'); // 'sales' | 'revenue' | 'products'
  const [downloading, setDownloading] = useState('');
  const [filter, setFilter] = useState('all');
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Preview data
  const [salesPreview, setSalesPreview] = useState([]);
  const [productsPreview, setProductsPreview] = useState([]);
  const [revenuePreview, setRevenuePreview] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(true);

  const notify = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
  };

  // Load preview data
  useEffect(() => {
    const loadPreviewData = async () => {
      try {
        setPreviewLoading(true);
        const [salesRes, prodRes, dashRes] = await Promise.all([
          api.get('/sales?limit=10'),
          api.get('/products?limit=10'),
          api.get('/analytics/dashboard'),
        ]);
        setSalesPreview(salesRes.data.sales || []);
        setProductsPreview(prodRes.data.products || []);
        setRevenuePreview(dashRes.data.charts?.monthlyRevenue || []);
      } catch (err) {
        // silent fail for preview
      } finally {
        setPreviewLoading(false);
      }
    };
    loadPreviewData();
  }, []);

  const handleDownloadCSV = async (reportType) => {
    try {
      setDownloading(reportType);
      const res = await api.get(`/analytics/export/${reportType}?filter=${filter}`, {
        responseType: 'blob',
      });

      // Create download anchor
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      const today = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `${reportType}_report_${today}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      notify('success', `Exported ${reportType} CSV report successfully`);
    } catch (err) {
      notify('error', 'Failed to generate CSV export');
    } finally {
      setDownloading('');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-display">Business Reports</h1>
          <p className="text-sm text-dark-300 mt-1">View business data and download reports in standard CSV format</p>
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

      {/* 3 CSV Export Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Sales Report Card */}
        <div className="card flex flex-col justify-between border-t-2 border-t-navy-500">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">💳</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-navy-400 bg-navy-500/10 px-2 py-0.5 rounded-full">
                Sales Data
              </span>
            </div>
            <h3 className="text-base font-bold text-white">Sales Report</h3>
            <p className="text-xs text-dark-300 mt-1.5 leading-relaxed">
              Invoices, customer details, ordered products, amounts, payment methods, and dates.
            </p>
          </div>
          <button
            onClick={() => handleDownloadCSV('sales')}
            disabled={downloading === 'sales'}
            className="btn-primary w-full text-xs mt-5 flex items-center justify-center gap-2"
          >
            <span>📥</span>
            <span>{downloading === 'sales' ? 'Downloading...' : 'Export Sales CSV'}</span>
          </button>
        </div>

        {/* Product Inventory Report Card */}
        <div className="card flex flex-col justify-between border-t-2 border-t-emerald-500">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">📦</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                Inventory
              </span>
            </div>
            <h3 className="text-base font-bold text-white">Product Report</h3>
            <p className="text-xs text-dark-300 mt-1.5 leading-relaxed">
              Stock levels, selling price, unit cost, profit margin, units sold, and low-stock alerts.
            </p>
          </div>
          <button
            onClick={() => handleDownloadCSV('products')}
            disabled={downloading === 'products'}
            className="btn-primary w-full text-xs mt-5 flex items-center justify-center gap-2"
          >
            <span>📥</span>
            <span>{downloading === 'products' ? 'Downloading...' : 'Export Product CSV'}</span>
          </button>
        </div>

        {/* Customer Accounts Report Card */}
        <div className="card flex flex-col justify-between border-t-2 border-t-purple-500">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">👥</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                Customers
              </span>
            </div>
            <h3 className="text-base font-bold text-white">Customer Report</h3>
            <p className="text-xs text-dark-300 mt-1.5 leading-relaxed">
              Customer accounts, phone numbers, emails, order counts, and total lifetime spend.
            </p>
          </div>
          <button
            onClick={() => handleDownloadCSV('customers')}
            disabled={downloading === 'customers'}
            className="btn-primary w-full text-xs mt-5 flex items-center justify-center gap-2"
          >
            <span>📥</span>
            <span>{downloading === 'customers' ? 'Downloading...' : 'Export Customer CSV'}</span>
          </button>
        </div>
      </div>

      {/* Date Filter selector for CSV download */}
      <div className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <span className="text-xs font-semibold text-white">Date Window for Exported Records:</span>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="select-field text-xs py-2 w-full sm:w-56"
        >
          <option value="all">All Available Records</option>
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="6months">Last 6 Months</option>
          <option value="thisYear">This Calendar Year</option>
        </select>
      </div>

      {/* Report On-Screen Viewer Section */}
      <div className="card p-0 overflow-hidden">
        {/* Viewer Tabs */}
        <div className="p-4 border-b border-dark-700 bg-dark-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white">View Report:</span>
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-dark-800 border border-dark-700">
              <button
                onClick={() => setActiveTab('sales')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'sales'
                    ? 'bg-navy-600 text-white shadow'
                    : 'text-dark-400 hover:text-white'
                }`}
              >
                Sales Report
              </button>
              <button
                onClick={() => setActiveTab('revenue')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'revenue'
                    ? 'bg-navy-600 text-white shadow'
                    : 'text-dark-400 hover:text-white'
                }`}
              >
                Revenue Report
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'products'
                    ? 'bg-navy-600 text-white shadow'
                    : 'text-dark-400 hover:text-white'
                }`}
              >
                Product Report
              </button>
            </div>
          </div>
        </div>

        {/* Tab 1: Sales Report View */}
        {activeTab === 'sales' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-dark-750 text-dark-300 uppercase text-[10px] tracking-wider border-b border-dark-700">
                <tr>
                  <th className="py-2.5 px-3">Invoice</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Payment</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/40">
                {previewLoading ? (
                  <tr><td colSpan={6} className="py-8 text-center text-dark-400">Loading sales report...</td></tr>
                ) : salesPreview.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-dark-500">No sales records available</td></tr>
                ) : (
                  salesPreview.map((s) => (
                    <tr key={s._id} className="hover:bg-dark-750">
                      <td className="py-2.5 px-3 font-mono text-navy-400 font-medium">{s.saleNumber}</td>
                      <td className="py-2.5 px-3 text-white font-medium">{s.customerName}</td>
                      <td className="py-2.5 px-3 text-dark-400">{new Date(s.date).toLocaleDateString()}</td>
                      <td className="py-2.5 px-3 font-bold text-white">{formatCurrency(s.totalAmount)}</td>
                      <td className="py-2.5 px-3 text-dark-300">{s.paymentMethod}</td>
                      <td className="py-2.5 px-3">
                        <span className="badge bg-success-500/10 text-success-400 border border-success-500/20">
                          {s.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Revenue Report View */}
        {activeTab === 'revenue' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-dark-750 text-dark-300 uppercase text-[10px] tracking-wider border-b border-dark-700">
                <tr>
                  <th className="py-2.5 px-3">Month</th>
                  <th className="py-2.5 px-3 text-right">Total Revenue</th>
                  <th className="py-2.5 px-3 text-right">Net Profit</th>
                  <th className="py-2.5 px-3 text-center">Orders Count</th>
                  <th className="py-2.5 px-3 text-right">Growth Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/40">
                {previewLoading ? (
                  <tr><td colSpan={5} className="py-8 text-center text-dark-400">Loading revenue report...</td></tr>
                ) : revenuePreview.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-dark-500">No revenue data available</td></tr>
                ) : (
                  revenuePreview.map((r, i) => (
                    <tr key={i} className="hover:bg-dark-750">
                      <td className="py-2.5 px-3 font-medium text-white">{r.month}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-white">{formatCurrency(r.revenue)}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-emerald-400">{formatCurrency(r.profit)}</td>
                      <td className="py-2.5 px-3 text-center text-dark-300 font-semibold">{r.orders}</td>
                      <td className={`py-2.5 px-3 text-right font-semibold ${r.growth >= 0 ? 'text-cyan-400' : 'text-danger-400'}`}>
                        {r.growth >= 0 ? `+${r.growth}%` : `${r.growth}%`}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Product Report View */}
        {activeTab === 'products' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-dark-750 text-dark-300 uppercase text-[10px] tracking-wider border-b border-dark-700">
                <tr>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Selling Price</th>
                  <th className="py-2.5 px-3">Cost Price</th>
                  <th className="py-2.5 px-3 text-center">In Stock</th>
                  <th className="py-2.5 px-3 text-center">Units Sold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/40">
                {previewLoading ? (
                  <tr><td colSpan={6} className="py-8 text-center text-dark-400">Loading product report...</td></tr>
                ) : productsPreview.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-dark-500">No products found</td></tr>
                ) : (
                  productsPreview.map((p) => (
                    <tr key={p._id} className="hover:bg-dark-750">
                      <td className="py-2.5 px-3 font-semibold text-white">{p.name}</td>
                      <td className="py-2.5 px-3 text-dark-300">{p.category}</td>
                      <td className="py-2.5 px-3 font-bold text-white">{formatCurrency(p.price)}</td>
                      <td className="py-2.5 px-3 text-dark-400">{formatCurrency(p.costPrice)}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-400">{p.stock}</td>
                      <td className="py-2.5 px-3 text-center text-dark-300 font-semibold">{p.soldCount || 0}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
