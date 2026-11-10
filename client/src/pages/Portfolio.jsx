import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';

const CATEGORIES = ['All', 'Stocks', 'Mutual Funds', 'ETFs', 'Bonds', 'Other'];
const formatCurrency = (val) => `₹${Number(val).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const getTodayDate = () => new Date().toISOString().split('T')[0];

const AssetModal = ({ asset, onClose, onSave }) => {
  const [form, setForm] = useState(() => ({
    name: asset?.name || '',
    symbol: asset?.symbol || '',
    category: asset?.category || 'Stocks',
    quantity: asset?.quantity || '',
    purchasePrice: asset?.purchasePrice || '',
    currentPrice: asset?.currentPrice || '',
    purchaseDate: asset?.purchaseDate ? new Date(asset.purchaseDate).toISOString().split('T')[0] : getTodayDate(),
    notes: asset?.notes || '',
  }));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [fetchingQuote, setFetchingQuote] = useState(false);
  const [quoteMsg, setQuoteMsg] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFetchQuote = async () => {
    if (!form.symbol) {
      setQuoteMsg('Enter a symbol first');
      return;
    }
    setFetchingQuote(true);
    setQuoteMsg('');
    try {
      const { data } = await api.get(`/portfolio/quote/${form.symbol.trim()}`);
      if (data?.quote) {
        setForm((prev) => ({
          ...prev,
          currentPrice: data.quote.price,
          name: prev.name || data.quote.name || prev.symbol,
        }));
        setQuoteMsg(`Live: ₹${data.quote.price} (${data.quote.changePercent >= 0 ? '+' : ''}${data.quote.changePercent}%)`);
      }
    } catch {
      setQuoteMsg('Symbol not found on market');
    } finally {
      setFetchingQuote(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.category || !form.quantity || !form.purchasePrice || !form.currentPrice) {
      return setError('Please fill all required fields');
    }
    if (form.quantity <= 0 || form.purchasePrice <= 0 || form.currentPrice <= 0) {
      return setError('Quantity and prices must be greater than 0');
    }
    setLoading(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save asset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <h2 className="text-white font-semibold text-lg">{asset ? 'Edit Asset' : 'Add New Asset'}</h2>
          <button onClick={onClose} className="text-dark-400 hover:text-white p-1 rounded-lg hover:bg-dark-700 transition-colors">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="alert-error">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Asset Name *</label>
              <input name="name" value={form.name} onChange={handleChange} className="input-field" placeholder="e.g. Reliance Industries" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="label">Symbol</label>
                {quoteMsg && <span className="text-xs text-navy-400 font-medium">{quoteMsg}</span>}
              </div>
              <div className="flex gap-2">
                <input name="symbol" value={form.symbol} onChange={handleChange} className="input-field uppercase" placeholder="e.g. AAPL" />
                <button
                  type="button"
                  onClick={handleFetchQuote}
                  disabled={fetchingQuote}
                  className="px-3 py-2 text-xs bg-dark-700 hover:bg-dark-600 text-white rounded-lg font-medium whitespace-nowrap transition-colors"
                >
                  {fetchingQuote ? '...' : 'Fetch'}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Category *</label>
              <select name="category" value={form.category} onChange={handleChange} className="select-field">
                {['Stocks', 'Mutual Funds', 'ETFs', 'Bonds', 'Other'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Quantity *</label>
              <input name="quantity" type="number" value={form.quantity} onChange={handleChange} className="input-field" placeholder="0" min="0" step="any" />
            </div>
            <div>
              <label className="label">Purchase Price (₹) *</label>
              <input name="purchasePrice" type="number" value={form.purchasePrice} onChange={handleChange} className="input-field" placeholder="0.00" min="0" step="any" />
            </div>
            <div>
              <label className="label">Current Price (₹) *</label>
              <input name="currentPrice" type="number" value={form.currentPrice} onChange={handleChange} className="input-field" placeholder="0.00" min="0" step="any" />
            </div>
            <div>
              <label className="label">Purchase Date</label>
              <input name="purchaseDate" type="date" value={form.purchaseDate} onChange={handleChange} className="input-field" />
            </div>
            <div className="col-span-2">
              <label className="label">Notes</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} className="input-field resize-none" rows={2} placeholder="Optional notes..." />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving...' : asset ? 'Update Asset' : 'Add Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Portfolio = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editAsset, setEditAsset] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefreshPrices = async () => {
    setRefreshing(true);
    try {
      const { data } = await api.post('/portfolio/refresh-prices');
      setSuccess(data.message || 'Market prices updated!');
      fetchPortfolio();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to refresh prices');
      setTimeout(() => setError(''), 4000);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchPortfolio = async () => {
    try {
      const { data } = await api.get('/portfolio');
      setPortfolio(data.portfolio);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPortfolio(); }, []);

  const handleAddAsset = async (form) => {
    await api.post('/portfolio', form);
    setSuccess('Asset added successfully!');
    fetchPortfolio();
    setTimeout(() => setSuccess(''), 4000);
  };

  const handleUpdateAsset = async (form) => {
    await api.put(`/portfolio/${editAsset._id}`, form);
    setSuccess('Asset updated successfully!');
    fetchPortfolio();
    setTimeout(() => setSuccess(''), 4000);
  };

  const handleDeleteAsset = async (id, name) => {
    if (!confirm(`Delete "${name}"? This action cannot be undone.`)) return;
    try {
      await api.delete(`/portfolio/${id}`);
      setSuccess('Asset deleted successfully!');
      fetchPortfolio();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete asset');
      setTimeout(() => setError(''), 4000);
    }
  };

  const filteredAssets = useMemo(() => {
    let assets = portfolio?.assets || [];
    if (categoryFilter !== 'All') assets = assets.filter((a) => a.category === categoryFilter);
    if (search) assets = assets.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()) || a.symbol?.toLowerCase().includes(search.toLowerCase()));
    if (sortBy === 'name') assets = [...assets].sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'value') assets = [...assets].sort((a, b) => (b.quantity * b.currentPrice) - (a.quantity * a.currentPrice));
    if (sortBy === 'return') {
      assets = [...assets].sort((a, b) => {
        const rA = ((a.currentPrice - a.purchasePrice) / a.purchasePrice) * 100;
        const rB = ((b.currentPrice - b.purchasePrice) / b.purchasePrice) * 100;
        return rB - rA;
      });
    }
    return assets;
  }, [portfolio, search, categoryFilter, sortBy]);

  const totals = useMemo(() => {
    const assets = portfolio?.assets || [];
    return {
      invested: assets.reduce((s, a) => s + a.quantity * a.purchasePrice, 0),
      current: assets.reduce((s, a) => s + a.quantity * a.currentPrice, 0),
    };
  }, [portfolio]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">My Portfolio</h1>
          <p className="page-subtitle">Manage your investment assets</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefreshPrices}
            disabled={refreshing}
            className="btn-secondary flex items-center gap-2"
            title="Fetch real-time market prices from Yahoo Finance"
          >
            <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
            {refreshing ? 'Updating Prices...' : 'Live Market Update'}
          </button>
          <button onClick={() => { setEditAsset(null); setShowModal(true); }} className="btn-primary">
            + Add Asset
          </button>
        </div>
      </div>

      {error && <div className="alert-error mb-4">{error}</div>}
      {success && <div className="alert-success mb-4">{success}</div>}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
        <div className="card bg-gradient-to-br from-navy-600/20 to-navy-500/5 border border-navy-500/20">
          <p className="text-dark-400 text-sm mb-1">Total Invested</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(totals.invested)}</p>
        </div>
        <div className="card bg-gradient-to-br from-purple-600/20 to-purple-500/5 border border-purple-500/20">
          <p className="text-dark-400 text-sm mb-1">Current Value</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(totals.current)}</p>
        </div>
        <div className={`card bg-gradient-to-br border ${(totals.current - totals.invested) >= 0 ? 'from-success-600/20 to-success-500/5 border-success-500/20' : 'from-danger-600/20 to-danger-500/5 border-danger-500/20'}`}>
          <p className="text-dark-400 text-sm mb-1">P&amp;L</p>
          <p className={`text-2xl font-bold ${(totals.current - totals.invested) >= 0 ? 'text-success-400' : 'text-danger-400'}`}>
            {(totals.current - totals.invested) >= 0 ? '+' : ''}{formatCurrency(totals.current - totals.invested)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field flex-1"
          placeholder="Search assets..."
        />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="select-field sm:w-44">
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="select-field sm:w-44">
          <option value="name">Sort: Name</option>
          <option value="value">Sort: Value</option>
          <option value="return">Sort: Return</option>
        </select>
      </div>

      {/* Assets table */}
      {filteredAssets.length > 0 ? (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Category</th>
                <th>Qty</th>
                <th>Avg. Price</th>
                <th>Curr. Price</th>
                <th>Invested</th>
                <th>Curr. Value</th>
                <th>P&amp;L</th>
                <th>Return</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => {
                const invested = asset.quantity * asset.purchasePrice;
                const current = asset.quantity * asset.currentPrice;
                const pnl = current - invested;
                const returnPct = invested > 0 ? (pnl / invested) * 100 : 0;
                return (
                  <tr key={asset._id}>
                    <td>
                      <div>
                        <p className="text-white font-medium">{asset.name}</p>
                        {asset.symbol && <p className="text-dark-500 text-xs">{asset.symbol}</p>}
                      </div>
                    </td>
                    <td><span className="badge badge-navy">{asset.category}</span></td>
                    <td>{asset.quantity}</td>
                    <td>{formatCurrency(asset.purchasePrice)}</td>
                    <td>{formatCurrency(asset.currentPrice)}</td>
                    <td>{formatCurrency(invested)}</td>
                    <td>{formatCurrency(current)}</td>
                    <td className={pnl >= 0 ? 'text-success-400' : 'text-danger-400'}>
                      {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
                    </td>
                    <td className={returnPct >= 0 ? 'text-success-400' : 'text-danger-400'}>
                      {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(2)}%
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setEditAsset(asset); setShowModal(true); }}
                          className="text-navy-400 hover:text-navy-300 text-xs font-medium px-2 py-1 rounded-lg hover:bg-navy-500/10 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAsset(asset._id, asset.name)}
                          className="text-danger-400 hover:text-danger-300 text-xs font-medium px-2 py-1 rounded-lg hover:bg-danger-500/10 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">💼</div>
          <h3 className="text-white font-semibold text-lg mb-2">No assets found</h3>
          <p className="text-dark-400 mb-6">
            {search || categoryFilter !== 'All' ? 'Try adjusting your search or filter.' : 'Start building your portfolio by adding your first asset.'}
          </p>
          {!search && categoryFilter === 'All' && (
            <button onClick={() => { setEditAsset(null); setShowModal(true); }} className="btn-primary">
              Add Your First Asset
            </button>
          )}
        </div>
      )}

      {showModal && (
        <AssetModal
          asset={editAsset}
          onClose={() => { setShowModal(false); setEditAsset(null); }}
          onSave={editAsset ? handleUpdateAsset : handleAddAsset}
        />
      )}
    </div>
  );
};

export default Portfolio;
