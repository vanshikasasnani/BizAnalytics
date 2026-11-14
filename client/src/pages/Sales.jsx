import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const PAYMENT_METHODS = ['All', 'Credit Card', 'Bank Transfer', 'UPI', 'PayPal', 'Cash', 'Other'];
const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

const NewSaleModal = ({ onClose, onSave }) => {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [selectedItems, setSelectedItems] = useState([
    { productId: '', quantity: 1, unitPrice: 0, availableStock: 0 },
  ]);
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadPrerequisites = async () => {
      try {
        const [cRes, pRes] = await Promise.all([
          api.get('/customers?limit=100'),
          api.get('/products?limit=100&status=Active'),
        ]);
        setCustomers(cRes.data.customers || []);
        setProducts(pRes.data.products || []);
        if (cRes.data.customers?.length > 0) {
          setCustomerId(cRes.data.customers[0]._id);
        }
      } catch (err) {
        setError('Failed to load customers or products list');
      }
    };
    loadPrerequisites();
  }, []);

  const handleProductSelect = (index, prodId) => {
    const prod = products.find((p) => p._id === prodId);
    setSelectedItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        productId: prodId,
        quantity: 1,
        unitPrice: prod ? prod.price : 0,
        availableStock: prod ? prod.stock : 0,
      };
      return copy;
    });
  };

  const handleQtyChange = (index, qty) => {
    const num = Number(qty);
    setSelectedItems((prev) => {
      const copy = [...prev];
      copy[index].quantity = num;
      return copy;
    });
  };

  const addItemRow = () => {
    setSelectedItems((prev) => [
      ...prev,
      { productId: '', quantity: 1, unitPrice: 0, availableStock: 0 },
    ]);
  };

  const removeItemRow = (index) => {
    if (selectedItems.length <= 1) return;
    setSelectedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const subtotal = selectedItems.reduce((s, it) => s + (it.quantity || 0) * (it.unitPrice || 0), 0);
  const numTax = Number(tax) || 0;
  const numDiscount = Number(discount) || 0;
  const totalAmount = Math.max(0, subtotal + numTax - numDiscount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!customerId) return setError('Please select a customer');

    const validItems = selectedItems.filter((it) => it.productId);
    if (validItems.length === 0) return setError('Please select at least one product');

    for (const item of validItems) {
      const prod = products.find((p) => p._id === item.productId);
      if (!item.quantity || item.quantity <= 0) {
        return setError(`Please enter a valid quantity for ${prod?.name || 'item'}`);
      }
      if (prod && item.quantity > prod.stock) {
        return setError(`Requested quantity (${item.quantity}) exceeds available stock (${prod.stock}) for "${prod.name}". Stock cannot become negative.`);
      }
    }

    setLoading(true);
    try {
      await onSave({
        customerId,
        items: validItems,
        paymentMethod,
        tax: numTax,
        discount: numDiscount,
        notes,
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create sale');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700 bg-dark-850">
          <h2 className="text-white font-bold text-base font-display">Record New Sales Transaction</h2>
          <button onClick={onClose} className="text-dark-400 hover:text-white p-1 rounded-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-400 text-xs">{error}</div>
          )}

          {/* Customer & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Customer *</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="select-field text-xs"
                required
              >
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>{c.name} ({c.email})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Payment Method *</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="select-field text-xs"
              >
                {PAYMENT_METHODS.filter((m) => m !== 'All').map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Product Items Builder */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Order Line Items *</label>
              <button
                type="button"
                onClick={addItemRow}
                className="text-xs text-navy-400 hover:text-navy-300 font-semibold"
              >
                + Add Another Product
              </button>
            </div>

            <div className="space-y-2.5">
              {selectedItems.map((item, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 rounded-xl bg-dark-750 border border-dark-700">
                  <div className="flex-1 w-full sm:w-auto">
                    <select
                      value={item.productId}
                      onChange={(e) => handleProductSelect(idx, e.target.value)}
                      className="select-field text-xs py-2"
                      required
                    >
                      <option value="">Select a product...</option>
                      {products.map((p) => (
                        <option key={p._id} value={p._id} disabled={p.stock <= 0}>
                          {p.name} — {formatCurrency(p.price)} (In Stock: {p.stock})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="w-20">
                      <input
                        type="number"
                        min="1"
                        max={item.availableStock || 99999}
                        value={item.quantity}
                        onChange={(e) => handleQtyChange(idx, e.target.value)}
                        placeholder="Qty"
                        className="input-field text-xs py-2 text-center"
                        required
                      />
                    </div>
                    <div className="w-28 text-right font-semibold text-white text-xs">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </div>
                    {selectedItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        className="text-danger-400 hover:text-danger-300 p-1 text-sm"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tax, Discount, Notes */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="label">Tax (₹)</label>
              <input
                type="number"
                min="0"
                value={tax}
                onChange={(e) => setTax(e.target.value)}
                className="input-field text-xs"
                placeholder="0"
              />
            </div>
            <div>
              <label className="label">Discount (₹)</label>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="input-field text-xs"
                placeholder="0"
              />
            </div>
            <div className="col-span-2">
              <label className="label">Order Notes</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field text-xs"
                placeholder="e.g. PO reference, shipping instructions..."
              />
            </div>
          </div>

          {/* Total Summary */}
          <div className="p-4 rounded-xl bg-dark-850 border border-dark-700 flex items-center justify-between">
            <span className="text-dark-300 text-xs font-medium">Calculated Total Amount:</span>
            <span className="text-2xl font-bold text-emerald-400 font-display">{formatCurrency(totalAmount)}</span>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Processing...' : 'Complete & Record Sale'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SaleDetailsModal = ({ sale, onClose }) => {
  if (!sale) return null;

  return (
    <div className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700 bg-dark-850">
          <div>
            <h2 className="text-white font-bold text-base font-display">Invoice #{sale.saleNumber}</h2>
            <p className="text-[11px] text-dark-400">{new Date(sale.date).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="text-dark-400 hover:text-white p-1 rounded-lg">✕</button>
        </div>

        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          {/* Customer info */}
          <div className="p-3.5 rounded-xl bg-dark-750 border border-dark-700 flex justify-between">
            <div>
              <p className="text-dark-400 text-[10px] uppercase font-bold">Billed To</p>
              <p className="text-white font-semibold text-sm mt-0.5">{sale.customerName}</p>
              <p className="text-dark-400">{sale.customerEmail}</p>
            </div>
            <div className="text-right">
              <p className="text-dark-400 text-[10px] uppercase font-bold">Payment Method</p>
              <p className="text-white font-semibold mt-0.5">{sale.paymentMethod}</p>
              <span className="badge bg-success-500/10 text-success-400 mt-1">{sale.paymentStatus}</span>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <p className="font-semibold text-white mb-2">Purchased Items</p>
            <div className="border border-dark-700 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-dark-700/60 text-dark-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Item</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Price</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700/50">
                    {sale.items?.map((it, i) => (
                      <tr key={i}>
                        <td className="p-2.5 text-white font-medium">{it.name}</td>
                        <td className="p-2.5 text-center text-dark-300">{it.quantity}</td>
                        <td className="p-2.5 text-right text-dark-400">{formatCurrency(it.unitPrice)}</td>
                        <td className="p-2.5 text-right text-white font-semibold">{formatCurrency(it.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Financial Totals */}
          <div className="space-y-1.5 pt-2 border-t border-dark-700 text-dark-300">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="text-white font-medium">{formatCurrency(sale.subtotal)}</span>
            </div>
            {sale.tax > 0 && (
              <div className="flex justify-between">
                <span>Tax:</span>
                <span className="text-white font-medium">+{formatCurrency(sale.tax)}</span>
              </div>
            )}
            {sale.discount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Discount:</span>
                <span>-{formatCurrency(sale.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-dark-700">
              <span>Grand Total:</span>
              <span className="text-emerald-400">{formatCurrency(sale.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-dark-400">
              <span>Estimated Net Profit:</span>
              <span className="text-indigo-400 font-medium">{formatCurrency(sale.totalProfit)}</span>
            </div>
          </div>

          {sale.notes && (
            <div className="p-2.5 rounded-lg bg-dark-750 text-dark-400 text-[11px]">
              <strong>Notes:</strong> {sale.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Sales = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const notify = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
  };

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (paymentMethod !== 'All') params.set('paymentMethod', paymentMethod);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await api.get(`/sales?${params.toString()}`);
      setSales(res.data.sales || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      notify('error', err.response?.data?.message || 'Failed to load sales');
    } finally {
      setLoading(false);
    }
  }, [search, paymentMethod, startDate, endDate]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const handleCreateSale = async (form) => {
    await api.post('/sales', form);
    notify('success', 'Sale created and product stock automatically updated');
    fetchSales();
  };

  const handleDeleteSale = async (id, saleNumber) => {
    if (user?.role !== 'admin') {
      return notify('error', 'Only administrators can delete sale records');
    }
    if (!confirm(`Delete sale "${saleNumber}"? Stock will be restored to inventory.`)) return;

    try {
      await api.delete(`/sales/${id}`);
      notify('success', `Sale ${saleNumber} deleted and stock restored`);
      fetchSales();
    } catch (err) {
      notify('error', err.response?.data?.message || 'Failed to delete sale');
    }
  };

  const totalRevenueInView = sales.reduce((s, x) => s + (x.totalAmount || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-display">Sales</h1>
          <p className="text-sm text-dark-300 mt-1">Record customer orders, manage sales invoices, and track payments</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="btn-primary flex items-center gap-2 self-start sm:self-auto text-xs"
        >
          <span>+</span>
          <span>New Sale</span>
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

      {/* Filter and Date Bar */}
      <div className="card p-4 flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice #, customer name, email, or item..."
            className="input-field text-sm"
          />
        </div>
        <div className="w-full md:w-44">
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="select-field text-sm">
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>{m === 'All' ? 'All Payment Methods' : m}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input-field text-xs py-2"
            title="Start Date"
          />
          <span className="text-dark-500 text-xs">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="input-field text-xs py-2"
            title="End Date"
          />
        </div>
      </div>

      {/* Sales Table */}
      <div className="card overflow-hidden p-0">
        <div className="p-4 border-b border-dark-700 flex items-center justify-between bg-dark-850">
          <span className="text-xs text-dark-400">
            Showing <strong className="text-white">{sales.length}</strong> of <strong className="text-white">{total}</strong> transactions
          </span>
          <span className="text-xs text-dark-300">
            Filtered Total: <strong className="text-emerald-400 font-semibold">{formatCurrency(totalRevenueInView)}</strong>
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-dark-400 text-sm">Loading transactions...</div>
        ) : sales.length === 0 ? (
          <div className="py-16 text-center text-dark-400 text-sm">No sales records found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-dark-750 text-dark-300 uppercase text-[10px] tracking-wider border-b border-dark-700">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items Summary</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Profit</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/50">
                {sales.map((s) => (
                  <tr key={s._id} className="hover:bg-dark-750 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-navy-400">{s.saleNumber}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-white">{s.customerName}</p>
                      <span className="text-dark-400 text-[11px]">{s.customerEmail}</span>
                    </td>
                    <td className="py-3.5 px-4 text-dark-300 max-w-xs truncate">
                      {s.items?.map((it) => `${it.quantity}x ${it.name}`).join(', ') || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-dark-400 whitespace-nowrap">{new Date(s.date).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 font-bold text-white text-sm">{formatCurrency(s.totalAmount)}</td>
                    <td className="py-3.5 px-4 font-medium text-emerald-400 font-mono">+{formatCurrency(s.totalProfit)}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-dark-700 text-dark-300 text-[11px]">{s.paymentMethod}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedSale(s)}
                        className="px-2.5 py-1 text-xs bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors"
                      >
                        Details
                      </button>
                      {user?.role === 'admin' && (
                        <button
                          onClick={() => handleDeleteSale(s._id, s.saleNumber)}
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

      {showNewModal && (
        <NewSaleModal
          onClose={() => setShowNewModal(false)}
          onSave={handleCreateSale}
        />
      )}

      {selectedSale && (
        <SaleDetailsModal
          sale={selectedSale}
          onClose={() => setSelectedSale(null)}
        />
      )}
    </div>
  );
};

export default Sales;
