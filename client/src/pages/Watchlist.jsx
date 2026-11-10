import { useState, useEffect } from 'react';
import api from '../services/api';

const formatCurrency = (val) => `₹${Number(val).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const WatchlistModal = ({ item, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: item?.name || '',
    symbol: item?.symbol || '',
    category: item?.category || 'Stocks',
    currentPrice: item?.currentPrice || '',
    targetPrice: item?.targetPrice || '',
    notes: item?.notes || '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.category) return setError('Name and category are required');
    setLoading(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <h2 className="text-white font-semibold text-lg">{item ? 'Edit Watchlist Item' : 'Add to Watchlist'}</h2>
          <button onClick={onClose} className="text-dark-400 hover:text-white p-1 rounded-lg hover:bg-dark-700">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="alert-error">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Asset Name *</label>
              <input name="name" value={form.name} onChange={handleChange} className="input-field" placeholder="e.g. TCS" />
            </div>
            <div>
              <label className="label">Symbol</label>
              <input name="symbol" value={form.symbol} onChange={handleChange} className="input-field" placeholder="e.g. TCS" />
            </div>
            <div>
              <label className="label">Category *</label>
              <select name="category" value={form.category} onChange={handleChange} className="select-field">
                {['Stocks', 'Mutual Funds', 'ETFs', 'Bonds', 'Other'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Current Price (₹)</label>
              <input name="currentPrice" type="number" value={form.currentPrice} onChange={handleChange} className="input-field" placeholder="0.00" min="0" step="any" />
            </div>
            <div>
              <label className="label">Target Price (₹)</label>
              <input name="targetPrice" type="number" value={form.targetPrice} onChange={handleChange} className="input-field" placeholder="0.00" min="0" step="any" />
            </div>
            <div className="col-span-2">
              <label className="label">Notes</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} className="input-field resize-none" rows={2} placeholder="Why are you watching this asset?" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving...' : item ? 'Update' : 'Add to Watchlist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Watchlist = () => {
  const [watchlist, setWatchlist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');

  const fetchWatchlist = async () => {
    try {
      const { data } = await api.get('/watchlist');
      setWatchlist(data.watchlist);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWatchlist(); }, []);

  const handleAdd = async (form) => {
    await api.post('/watchlist', form);
    setSuccess('Added to watchlist!');
    fetchWatchlist();
    setTimeout(() => setSuccess(''), 4000);
  };

  const handleUpdate = async (form) => {
    await api.put(`/watchlist/${editItem._id}`, form);
    setSuccess('Watchlist item updated!');
    fetchWatchlist();
    setTimeout(() => setSuccess(''), 4000);
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Remove "${name}" from watchlist?`)) return;
    try {
      await api.delete(`/watchlist/${id}`);
      setSuccess('Removed from watchlist!');
      fetchWatchlist();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove');
      setTimeout(() => setError(''), 4000);
    }
  };

  const filteredItems = (watchlist?.items || []).filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.symbol?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Watchlist</h1>
          <p className="page-subtitle">Assets you&apos;re keeping an eye on</p>
        </div>
        <button onClick={() => { setEditItem(null); setShowModal(true); }} className="btn-primary">
          + Add to Watchlist
        </button>
      </div>

      {error && <div className="alert-error mb-4">{error}</div>}
      {success && <div className="alert-success mb-4">{success}</div>}

      <div className="mb-5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field max-w-sm"
          placeholder="Search watchlist..."
        />
      </div>

      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => {
            const upside = item.targetPrice > 0 && item.currentPrice > 0
              ? ((item.targetPrice - item.currentPrice) / item.currentPrice) * 100
              : null;
            return (
              <div key={item._id} className="card-hover group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-white font-semibold">{item.name}</h3>
                    {item.symbol && <p className="text-dark-500 text-xs">{item.symbol}</p>}
                  </div>
                  <span className="badge badge-navy">{item.category}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {item.currentPrice > 0 && (
                    <div>
                      <p className="text-dark-400 text-xs mb-0.5">Current Price</p>
                      <p className="text-white font-semibold">{formatCurrency(item.currentPrice)}</p>
                    </div>
                  )}
                  {item.targetPrice > 0 && (
                    <div>
                      <p className="text-dark-400 text-xs mb-0.5">Target Price</p>
                      <p className="text-white font-semibold">{formatCurrency(item.targetPrice)}</p>
                    </div>
                  )}
                </div>

                {upside !== null && (
                  <div className={`text-sm font-medium mb-3 ${upside >= 0 ? 'text-success-400' : 'text-danger-400'}`}>
                    {upside >= 0 ? '▲' : '▼'} {Math.abs(upside).toFixed(2)}% potential {upside >= 0 ? 'upside' : 'downside'}
                  </div>
                )}

                {item.notes && (
                  <p className="text-dark-400 text-xs mb-3 leading-relaxed">{item.notes}</p>
                )}

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setEditItem(item); setShowModal(true); }}
                    className="btn-secondary btn-sm flex-1 text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item._id, item.name)}
                    className="btn-danger btn-sm flex-1 text-xs"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">👁️</div>
          <h3 className="text-white font-semibold text-lg mb-2">Your watchlist is empty</h3>
          <p className="text-dark-400 mb-6">
            {search ? 'No items match your search.' : 'Add assets you are watching to track them here.'}
          </p>
          {!search && (
            <button onClick={() => { setEditItem(null); setShowModal(true); }} className="btn-primary">
              Add First Item
            </button>
          )}
        </div>
      )}

      {showModal && (
        <WatchlistModal
          item={editItem}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSave={editItem ? handleUpdate : handleAdd}
        />
      )}
    </div>
  );
};

export default Watchlist;
