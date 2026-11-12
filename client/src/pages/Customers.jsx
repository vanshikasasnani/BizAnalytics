import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

const CustomerModal = ({ customer, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    company: customer?.company || '',
    address: customer?.address || '',
    city: customer?.city || '',
    country: customer?.country || 'India',
    status: customer?.status || 'Active',
    notes: customer?.notes || '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      return setError('Name and email are required');
    }

    setLoading(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700 bg-dark-850">
          <h2 className="text-white font-bold text-base font-display">
            {customer ? 'Edit Customer Details' : 'Register New Customer Account'}
          </h2>
          <button onClick={onClose} className="text-dark-400 hover:text-white p-1 rounded-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && <div className="p-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-400 text-xs">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="label">Customer / Contact Name *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="input-field text-xs"
                placeholder="Full name"
                required
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="label">Email Address *</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="input-field text-xs"
                placeholder="client@example.com"
                required
              />
            </div>

            <div>
              <label className="label">Phone Number</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="input-field text-xs"
                placeholder="+91 98000 00000"
              />
            </div>

            <div>
              <label className="label">Company / Organization</label>
              <input
                name="company"
                value={form.company}
                onChange={handleChange}
                className="input-field text-xs"
                placeholder="Company Ltd"
              />
            </div>

            <div className="col-span-2">
              <label className="label">Street Address</label>
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                className="input-field text-xs"
                placeholder="Office or shipping address"
              />
            </div>

            <div>
              <label className="label">City</label>
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                className="input-field text-xs"
                placeholder="e.g. Mumbai"
              />
            </div>

            <div>
              <label className="label">Relationship Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="select-field text-xs">
                <option value="Active">Active</option>
                <option value="Lead">Lead</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="label">Client Notes</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                className="input-field text-xs resize-none"
                rows={2}
                placeholder="Preferences, contract terms..."
              />
            </div>
          </div>

          <div className="flex gap-3 pt-3 border-t border-dark-700">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving...' : customer ? 'Update Customer' : 'Save Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CustomerHistoryModal = ({ customer, onClose }) => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get(`/customers/${customer._id}/sales`);
        setSales(res.data.sales || []);
      } catch {
        // handle error
      } finally {
        setLoading(false);
      }
    };
    if (customer?._id) fetchHistory();
  }, [customer]);

  if (!customer) return null;

  return (
    <div className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700 bg-dark-850">
          <div>
            <h2 className="text-white font-bold text-base font-display">{customer.name} — Order History</h2>
            <p className="text-[11px] text-dark-400">{customer.company || customer.email} • Lifetime Value: {formatCurrency(customer.totalSpent)}</p>
          </div>
          <button onClick={onClose} className="text-dark-400 hover:text-white p-1 rounded-lg">✕</button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-dark-400 text-xs">Loading order history...</div>
          ) : sales.length === 0 ? (
            <div className="py-12 text-center text-dark-400 text-xs">No orders recorded yet for this customer</div>
          ) : (
            <div className="border border-dark-700 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-dark-750 text-dark-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Invoice</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Items</th>
                    <th className="p-3">Total Amount</th>
                    <th className="p-3">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700/50">
                  {sales.map((s) => (
                    <tr key={s._id} className="hover:bg-dark-750">
                      <td className="p-3 font-mono text-navy-400 font-medium">{s.saleNumber}</td>
                      <td className="p-3 text-dark-300">{new Date(s.date).toLocaleDateString()}</td>
                      <td className="p-3 text-dark-300 max-w-[200px] truncate">
                        {s.items?.map((it) => `${it.quantity}x ${it.name}`).join(', ')}
                      </td>
                      <td className="p-3 font-bold text-white">{formatCurrency(s.totalAmount)}</td>
                      <td className="p-3">
                        <span className="badge bg-success-500/10 text-success-400">{s.paymentMethod}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Customers = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [historyCustomer, setHistoryCustomer] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const notify = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
  };

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status !== 'All') params.set('status', status);

      const res = await api.get(`/customers?${params.toString()}`);
      setCustomers(res.data.customers || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      notify('error', err.response?.data?.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSaveCustomer = async (form) => {
    if (editCustomer) {
      await api.put(`/customers/${editCustomer._id}`, form);
      notify('success', `Customer "${form.name}" updated successfully`);
    } else {
      await api.post('/customers', form);
      notify('success', `Customer "${form.name}" registered successfully`);
    }
    fetchCustomers();
  };

  const handleDeleteCustomer = async (id, name) => {
    if (user?.role !== 'admin') {
      return notify('error', 'Only administrators can delete customers');
    }
    if (!confirm(`Delete customer "${name}"? This will not delete their historical invoices.`)) return;

    try {
      await api.delete(`/customers/${id}`);
      notify('success', `Customer "${name}" deleted`);
      fetchCustomers();
    } catch (err) {
      notify('error', err.response?.data?.message || 'Failed to delete customer');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-display">Customers</h1>
          <p className="text-sm text-dark-300 mt-1">Manage customer contacts, order history, and account details</p>
        </div>
        <button
          onClick={() => {
            setEditCustomer(null);
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2 self-start sm:self-auto text-xs"
        >
          <span>+</span>
          <span>Add Customer</span>
        </button>
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

      {/* Filter and Search Bar */}
      <div className="card p-4 flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, email, company, or phone..."
            className="input-field text-sm"
          />
        </div>
        <div className="w-full md:w-44">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="select-field text-sm">
            <option value="All">All Customer Statuses</option>
            <option value="Active">Active Clients</option>
            <option value="Lead">Sales Leads</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="card overflow-hidden p-0">
        <div className="p-4 border-b border-dark-700 flex items-center justify-between bg-dark-850">
          <span className="text-xs text-dark-400">
            Showing <strong className="text-white">{customers.length}</strong> of <strong className="text-white">{total}</strong> accounts
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-dark-400 text-sm">Loading customer directory...</div>
        ) : customers.length === 0 ? (
          <div className="py-16 text-center text-dark-400 text-sm">No customers found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-dark-750 text-dark-300 uppercase text-[10px] tracking-wider border-b border-dark-700">
                <tr>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4 text-center">Orders</th>
                  <th className="py-3 px-4">Total Spent</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/50">
                {Array.from(new Map(customers.map((c) => [c.email || c._id, c])).values()).map((c) => (
                  <tr key={c._id} className="hover:bg-dark-750 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-white text-sm">{c.name}</p>
                      <span className="text-dark-400 text-[11px]">{c.email}</span>
                    </td>
                    <td className="py-3.5 px-4 text-white font-medium">{c.company || '—'}</td>
                    <td className="py-3.5 px-4 text-dark-300">{c.phone || '—'}</td>
                    <td className="py-3.5 px-4 text-dark-400">{c.city ? `${c.city}, ${c.country}` : c.country}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-white">{c.totalOrders || 0}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400 text-sm">
                      {formatCurrency(c.totalSpent)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`badge ${
                        c.status === 'Active' ? 'bg-success-500/10 text-success-400 border border-success-500/20' : 'bg-dark-700 text-dark-300'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => setHistoryCustomer(c)}
                        className="px-2.5 py-1 text-xs bg-navy-600/20 hover:bg-navy-600/30 text-navy-400 rounded-lg transition-colors"
                      >
                        History
                      </button>
                      <button
                        onClick={() => {
                          setEditCustomer(c);
                          setShowModal(true);
                        }}
                        className="px-2.5 py-1 text-xs bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                      {user?.role === 'admin' && (
                        <button
                          onClick={() => handleDeleteCustomer(c._id, c.name)}
                          className="px-2.5 py-1 text-xs bg-danger-500/10 hover:bg-danger-500/20 text-danger-400 rounded-lg transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <CustomerModal
          customer={editCustomer}
          onClose={() => setShowModal(false)}
          onSave={handleSaveCustomer}
        />
      )}

      {historyCustomer && (
        <CustomerHistoryModal
          customer={historyCustomer}
          onClose={() => setHistoryCustomer(null)}
        />
      )}
    </div>
  );
};

export default Customers;

