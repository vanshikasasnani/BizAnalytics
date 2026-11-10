import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const TRANSACTION_TYPES = ['All', 'Buy', 'Sell', 'Deposit', 'Withdrawal'];
const formatCurrency = (val) => `₹${Number(val).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const getTodayDate = () => new Date().toISOString().split('T')[0];

const typeBadgeClass = {
  Buy: 'badge-success',
  Sell: 'badge-danger',
  Deposit: 'badge-navy',
  Withdrawal: 'badge-yellow',
};

const TransactionModal = ({ tx, onClose, onSave }) => {
  const [form, setForm] = useState(() => ({
    type: tx?.type || 'Buy',
    assetName: tx?.assetName || '',
    assetCategory: tx?.assetCategory || '',
    quantity: tx?.quantity || '',
    price: tx?.price || '',
    amount: tx?.amount || '',
    date: tx?.date ? new Date(tx.date).toISOString().split('T')[0] : getTodayDate(),
    notes: tx?.notes || '',
  }));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.type || !form.amount) return setError('Type and amount are required');
    if (Number(form.amount) <= 0) return setError('Amount must be greater than 0');
    if ((form.type === 'Buy' || form.type === 'Sell') && !form.assetName) {
      return setError('Asset name is required for Buy/Sell');
    }
    setLoading(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  const isTrade = form.type === 'Buy' || form.type === 'Sell';

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <h2 className="text-white font-semibold text-lg">{tx ? 'Edit Transaction' : 'New Transaction'}</h2>
          <button onClick={onClose} className="text-dark-400 hover:text-white p-1 rounded-lg hover:bg-dark-700">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="alert-error">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Transaction Type *</label>
              <select name="type" value={form.type} onChange={handleChange} className="select-field">
                {['Buy', 'Sell', 'Deposit', 'Withdrawal'].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            {isTrade && (
              <>
                <div className="col-span-2">
                  <label className="label">Asset Name *</label>
                  <input name="assetName" value={form.assetName} onChange={handleChange} className="input-field" placeholder="e.g. Infosys" />
                </div>
                <div>
                  <label className="label">Category</label>
                  <select name="assetCategory" value={form.assetCategory} onChange={handleChange} className="select-field">
                    <option value="">Select...</option>
                    {['Stocks', 'Mutual Funds', 'ETFs', 'Bonds', 'Other'].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Quantity</label>
                  <input name="quantity" type="number" value={form.quantity} onChange={handleChange} className="input-field" placeholder="0" min="0" step="any" />
                </div>
                <div>
                  <label className="label">Price per Unit (₹)</label>
                  <input name="price" type="number" value={form.price} onChange={handleChange} className="input-field" placeholder="0.00" min="0" step="any" />
                </div>
              </>
            )}
            <div className={isTrade ? '' : 'col-span-2'}>
              <label className="label">Total Amount (₹) *</label>
              <input name="amount" type="number" value={form.amount} onChange={handleChange} className="input-field" placeholder="0.00" min="0" step="any" />
            </div>
            <div>
              <label className="label">Date</label>
              <input name="date" type="date" value={form.date} onChange={handleChange} className="input-field" />
            </div>
            <div className="col-span-2">
              <label className="label">Notes</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} className="input-field resize-none" rows={2} placeholder="Optional notes..." />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving...' : tx ? 'Update' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [typeFilter, setTypeFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [total, setTotal] = useState(0);

  const fetchTransactions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'All') params.set('type', typeFilter);
      if (search) params.set('search', search);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      params.set('limit', '50');
      const { data } = await api.get(`/transactions?${params}`);
      setTransactions(data.transactions);
      setTotal(data.total);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, search, startDate, endDate]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleCreate = async (form) => {
    await api.post('/transactions', form);
    setSuccess('Transaction added!');
    fetchTransactions();
    setTimeout(() => setSuccess(''), 4000);
  };

  const handleUpdate = async (form) => {
    await api.put(`/transactions/${editTx._id}`, form);
    setSuccess('Transaction updated!');
    fetchTransactions();
    setTimeout(() => setSuccess(''), 4000);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      setSuccess('Transaction deleted!');
      fetchTransactions();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
      setTimeout(() => setError(''), 4000);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">{total} total transactions recorded</p>
        </div>
        <button onClick={() => { setEditTx(null); setShowModal(true); }} className="btn-primary">
          + New Transaction
        </button>
      </div>

      {error && <div className="alert-error mb-4">{error}</div>}
      {success && <div className="alert-success mb-4">{success}</div>}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input value={search} onChange={(e) => setSearch(e.target.value)} className="input-field flex-1 min-w-48" placeholder="Search by asset name..." />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="select-field w-36">
          {TRANSACTION_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-field w-40" />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input-field w-40" />
        {(search || typeFilter !== 'All' || startDate || endDate) && (
          <button onClick={() => { setSearch(''); setTypeFilter('All'); setStartDate(''); setEndDate(''); }} className="btn-secondary btn-sm">
            Clear
          </button>
        )}
      </div>

      {transactions.length > 0 ? (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Asset</th>
                <th>Category</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx._id}>
                  <td><span className={`badge ${typeBadgeClass[tx.type]}`}>{tx.type}</span></td>
                  <td className="font-medium text-white">{tx.assetName || '—'}</td>
                  <td>{tx.assetCategory || '—'}</td>
                  <td>{tx.quantity || '—'}</td>
                  <td>{tx.price ? formatCurrency(tx.price) : '—'}</td>
                  <td className="font-semibold text-white">{formatCurrency(tx.amount)}</td>
                  <td>{new Date(tx.date).toLocaleDateString('en-IN')}</td>
                  <td><span className={`badge ${tx.status === 'Completed' ? 'badge-success' : tx.status === 'Pending' ? 'badge-yellow' : 'badge-danger'}`}>{tx.status}</span></td>
                  <td>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditTx(tx); setShowModal(true); }} className="text-navy-400 hover:text-navy-300 text-xs font-medium px-2 py-1 rounded-lg hover:bg-navy-500/10 transition-colors">Edit</button>
                      <button onClick={() => handleDelete(tx._id)} className="text-danger-400 hover:text-danger-300 text-xs font-medium px-2 py-1 rounded-lg hover:bg-danger-500/10 transition-colors">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">↔️</div>
          <h3 className="text-white font-semibold text-lg mb-2">No transactions found</h3>
          <p className="text-dark-400 mb-6">
            {search || typeFilter !== 'All' ? 'Try adjusting your filters.' : 'Start recording your investment transactions.'}
          </p>
          {!search && typeFilter === 'All' && (
            <button onClick={() => { setEditTx(null); setShowModal(true); }} className="btn-primary">
              Record First Transaction
            </button>
          )}
        </div>
      )}

      {showModal && (
        <TransactionModal
          tx={editTx}
          onClose={() => { setShowModal(false); setEditTx(null); }}
          onSave={editTx ? handleUpdate : handleCreate}
        />
      )}
    </div>
  );
};

export default Transactions;
