import { useState } from 'react';
import api from '../services/api';

const Reports = () => {
  const [downloading, setDownloading] = useState('');
  const [filter, setFilter] = useState('all');
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const notify = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
  };

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
    <div className="space-y-6 animate-fade-in pb-12 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white font-display">Data Exports & Reports</h1>
        <p className="text-xs text-dark-400 mt-1">Export raw transactional and database records directly to standard CSV format</p>
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

      {/* Filter Selector */}
      <div className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <span className="text-xs font-semibold text-white">Date Window for Sales Report:</span>
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

      {/* 3 Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sales Report */}
        <div className="card flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-navy-600/20 text-navy-400 border border-navy-500/30 flex items-center justify-center text-2xl mb-4">
              💳
            </div>
            <h3 className="text-base font-bold text-white">Sales & Revenue Report</h3>
            <p className="text-xs text-dark-400 mt-2 leading-relaxed">
              Complete invoice records including customer details, line items, gross subtotal, applied taxes, discounts, net profit, and payment methods.
            </p>
          </div>
          <button
            onClick={() => handleDownloadCSV('sales')}
            disabled={downloading === 'sales'}
            className="btn-primary w-full text-xs mt-6 flex items-center justify-center gap-2"
          >
            <span>📥</span>
            <span>{downloading === 'sales' ? 'Generating...' : 'Download Sales CSV'}</span>
          </button>
        </div>

        {/* Product Inventory Report */}
        <div className="card flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-2xl mb-4">
              📦
            </div>
            <h3 className="text-base font-bold text-white">Product & Inventory Report</h3>
            <p className="text-xs text-dark-400 mt-2 leading-relaxed">
              Full product master file containing SKU codes, categories, selling prices, unit cost, calculated gross profit margins (%), and live stock levels.
            </p>
          </div>
          <button
            onClick={() => handleDownloadCSV('products')}
            disabled={downloading === 'products'}
            className="btn-primary w-full text-xs mt-6 flex items-center justify-center gap-2"
          >
            <span>📥</span>
            <span>{downloading === 'products' ? 'Generating...' : 'Download Inventory CSV'}</span>
          </button>
        </div>

        {/* Customer Intelligence Report */}
        <div className="card flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center text-2xl mb-4">
              👥
            </div>
            <h3 className="text-base font-bold text-white">Customer Lifetime Value Report</h3>
            <p className="text-xs text-dark-400 mt-2 leading-relaxed">
              Customer accounts directory containing full contact records, geographic location, total historical order frequencies, and lifetime expenditures.
            </p>
          </div>
          <button
            onClick={() => handleDownloadCSV('customers')}
            disabled={downloading === 'customers'}
            className="btn-primary w-full text-xs mt-6 flex items-center justify-center gap-2"
          >
            <span>📥</span>
            <span>{downloading === 'customers' ? 'Generating...' : 'Download Customers CSV'}</span>
          </button>
        </div>
      </div>

      {/* CSV Information Notice */}
      <div className="card bg-dark-850 p-4 border border-dark-700 text-xs text-dark-400 flex items-start gap-3">
        <span className="text-lg">ℹ️</span>
        <div>
          <strong className="text-white block mb-0.5">Automated Database Exports</strong>
          All generated CSV files are extracted directly from live MongoDB records and can be opened in Microsoft Excel, Google Sheets, or business intelligence tools.
        </div>
      </div>
    </div>
  );
};

export default Reports;

