import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  'All',
  'Electronics',
  'Software & SaaS',
  'Office Supplies',
  'Furniture',
  'Hardware',
  'Accessories',
  'Services',
  'Other',
];

const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

const ProductModal = ({ product, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    category: product?.category || 'Electronics',
    price: product?.price ?? '',
    costPrice: product?.costPrice ?? '',
    stock: product?.stock ?? '',
    lowStockThreshold: product?.lowStockThreshold ?? 5,
    status: product?.status || 'Active',
    description: product?.description || '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.sku || form.price === '' || form.costPrice === '' || form.stock === '') {
      return setError('Please fill all required fields');
    }

    if (Number(form.price) < 0 || Number(form.costPrice) < 0 || Number(form.stock) < 0) {
      return setError('Price, cost price, and stock must be positive numbers');
    }

    setLoading(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700 bg-dark-850">
          <h2 className="text-white font-bold text-base font-display">
            {product ? 'Edit Product Details' : 'Add New Business Product'}
          </h2>
          <button onClick={onClose} className="text-dark-400 hover:text-white p-1 rounded-lg">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && <div className="p-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-400 text-xs">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Product Name *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g. Ergonomic Office Desk"
                required
              />
            </div>

            <div>
              <label className="label">SKU / Item Code *</label>
              <input
                name="sku"
                value={form.sku}
                onChange={handleChange}
                className="input-field uppercase"
                placeholder="e.g. PROD-101"
                required
              />
            </div>

            <div>
              <label className="label">Category *</label>
              <select name="category" value={form.category} onChange={handleChange} className="select-field">
                {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Selling Price (₹) *</label>
              <input
                name="price"
                type="number"
                value={form.price}
                onChange={handleChange}
                className="input-field"
                placeholder="0.00"
                min="0"
                step="any"
                required
              />
            </div>

            <div>
              <label className="label">Cost Price (₹) *</label>
              <input
                name="costPrice"
                type="number"
                value={form.costPrice}
                onChange={handleChange}
                className="input-field"
                placeholder="0.00"
                min="0"
                step="any"
                required
              />
            </div>

            <div>
              <label className="label">Available Stock *</label>
              <input
                name="stock"
                type="number"
                value={form.stock}
                onChange={handleChange}
                className="input-field"
                placeholder="0"
                min="0"
                required
              />
            </div>

            <div>
              <label className="label">Low Stock Alert Threshold</label>
              <input
                name="lowStockThreshold"
                type="number"
                value={form.lowStockThreshold}
                onChange={handleChange}
                className="input-field"
                placeholder="5"
                min="0"
              />
            </div>

            <div className="col-span-2">
              <label className="label">Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="select-field">
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
                <option value="Archived">Archived</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="label">Product Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="input-field resize-none text-xs"
                rows={3}
                placeholder="Specifications, features, warranty..."
              />
            </div>
          </div>

          <div className="flex gap-3 pt-3 border-t border-dark-700">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Products = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const notify = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
  };

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category !== 'All') params.set('category', category);
      if (status !== 'All') params.set('status', status);

      const res = await api.get(`/products?${params.toString()}`);
      setProducts(res.data.products || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      notify('error', err.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [search, category, status]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSaveProduct = async (form) => {
    if (editProduct) {
      await api.put(`/products/${editProduct._id}`, form);
      notify('success', `Product "${form.name}" updated successfully`);
    } else {
      await api.post('/products', form);
      notify('success', `Product "${form.name}" created successfully`);
    }
    fetchProducts();
  };

  const handleDeleteProduct = async (id, name) => {
    if (user?.role !== 'admin') {
      return notify('error', 'Only administrators can delete products');
    }
    if (!confirm(`Are you sure you want to permanently delete "${name}"?`)) return;

    try {
      await api.delete(`/products/${id}`);
      notify('success', `Product "${name}" deleted`);
      fetchProducts();
    } catch (err) {
      notify('error', err.response?.data?.message || 'Failed to delete product');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Product Inventory Management</h1>
          <p className="text-xs text-dark-400 mt-1">Manage catalog, track live stock quantities, sales velocity and margins</p>
        </div>
        <button
          onClick={() => {
            setEditProduct(null);
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2 self-start sm:self-auto"
        >
          <span>+</span>
          <span>Add New Product</span>
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
            placeholder="Search by product name, SKU, or specs..."
            className="input-field text-sm"
          />
        </div>
        <div className="w-full md:w-48">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="select-field text-sm">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
            ))}
          </select>
        </div>
        <div className="w-full md:w-36">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="select-field text-sm">
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Draft">Draft</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="card overflow-hidden p-0">
        <div className="p-4 border-b border-dark-700 flex items-center justify-between">
          <span className="text-xs text-dark-400 font-medium">
            Showing <strong className="text-white">{products.length}</strong> of <strong className="text-white">{total}</strong> products
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-dark-400 text-sm">Loading catalog...</div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center text-dark-400 text-sm">No products found matching filters</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-dark-750 text-dark-300 uppercase text-[10px] tracking-wider border-b border-dark-700">
                <tr>
                  <th className="py-3 px-4">Product Info</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Selling Price</th>
                  <th className="py-3 px-4">Unit Cost</th>
                  <th className="py-3 px-4">Margin</th>
                  <th className="py-3 px-4">Stock Status</th>
                  <th className="py-3 px-4">Units Sold</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/50">
                {products.map((p) => {
                  const isLowStock = p.stock <= p.lowStockThreshold && p.stock > 0;
                  const isOutOfStock = p.stock === 0;

                  return (
                    <tr key={p._id} className="hover:bg-dark-750 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-white text-sm">{p.name}</p>
                        <span className="font-mono text-[11px] text-navy-400 font-medium">{p.sku}</span>
                      </td>
                      <td className="py-3.5 px-4 text-dark-300">{p.category}</td>
                      <td className="py-3.5 px-4 font-semibold text-white">{formatCurrency(p.price)}</td>
                      <td className="py-3.5 px-4 text-dark-400">{formatCurrency(p.costPrice)}</td>
                      <td className="py-3.5 px-4">
                        <span className="text-emerald-400 font-medium font-mono">
                          {p.profitMargin || 0}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {isOutOfStock ? (
                          <span className="badge bg-danger-500/10 text-danger-400 border border-danger-500/20">
                            Out of Stock (0)
                          </span>
                        ) : isLowStock ? (
                          <span className="badge bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Low Stock ({p.stock})
                          </span>
                        ) : (
                          <span className="badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            In Stock ({p.stock})
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-dark-300 font-semibold">{p.soldCount || 0}</td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditProduct(p);
                            setShowModal(true);
                          }}
                          className="px-2.5 py-1 text-xs bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors"
                        >
                          Edit
                        </button>
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => handleDeleteProduct(p._id, p.name)}
                            className="px-2.5 py-1 text-xs bg-danger-500/10 hover:bg-danger-500/20 text-danger-400 rounded-lg transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <ProductModal
          product={editProduct}
          onClose={() => setShowModal(false)}
          onSave={handleSaveProduct}
        />
      )}
    </div>
  );
};

export default Products;

