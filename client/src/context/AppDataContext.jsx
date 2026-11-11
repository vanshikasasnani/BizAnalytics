import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const AppDataContext = createContext(null);

/**
 * Global application data context.
 * Caches products, customers and sale summary stats so components
 * don't each issue their own full-list requests.
 */
export const AppDataProvider = ({ children }) => {
  const { user } = useAuth();

  // ── Products ─────────────────────────────────────────────────────────────
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsMeta, setProductsMeta] = useState({ total: 0, page: 1 });

  const fetchProducts = useCallback(async (params = {}) => {
    setProductsLoading(true);
    try {
      const { data } = await api.get('/products', { params });
      setProducts(data.products);
      setProductsMeta({ total: data.total, page: data.page });
    } catch (_) {
      // errors handled per-component
    } finally {
      setProductsLoading(false);
    }
  }, []);

  const updateProductInCache = useCallback((updated) => {
    setProducts((prev) =>
      prev.map((p) => (p._id === updated._id ? { ...p, ...updated } : p))
    );
  }, []);

  const removeProductFromCache = useCallback((id) => {
    setProducts((prev) => prev.filter((p) => p._id !== id));
  }, []);

  const addProductToCache = useCallback((product) => {
    setProducts((prev) => [product, ...prev]);
  }, []);

  // ── Customers ─────────────────────────────────────────────────────────────
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersMeta, setCustomersMeta] = useState({ total: 0 });

  const fetchCustomers = useCallback(async (params = {}) => {
    setCustomersLoading(true);
    try {
      const { data } = await api.get('/customers', { params });
      setCustomers(data.customers);
      setCustomersMeta({ total: data.total });
    } catch (_) {
      // errors handled per-component
    } finally {
      setCustomersLoading(false);
    }
  }, []);

  const updateCustomerInCache = useCallback((updated) => {
    setCustomers((prev) =>
      prev.map((c) => (c._id === updated._id ? { ...c, ...updated } : c))
    );
  }, []);

  const removeCustomerFromCache = useCallback((id) => {
    setCustomers((prev) => prev.filter((c) => c._id !== id));
  }, []);

  const addCustomerToCache = useCallback((customer) => {
    setCustomers((prev) => [customer, ...prev]);
  }, []);

  // ── Dashboard summary stats ───────────────────────────────────────────────
  const [dashboardCards, setDashboardCards] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const fetchDashboard = useCallback(async () => {
    setDashboardLoading(true);
    try {
      const { data } = await api.get('/analytics/dashboard');
      setDashboardCards(data.cards);
    } catch (_) {
      // ignore
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  // Auto-load on login
  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchCustomers();
      fetchDashboard();
    } else {
      // Clear cache on logout
      setProducts([]);
      setCustomers([]);
      setDashboardCards(null);
    }
  }, [user, fetchProducts, fetchCustomers, fetchDashboard]);

  const value = {
    // Products
    products,
    productsLoading,
    productsMeta,
    fetchProducts,
    updateProductInCache,
    removeProductFromCache,
    addProductToCache,
    // Customers
    customers,
    customersLoading,
    customersMeta,
    fetchCustomers,
    updateCustomerInCache,
    removeCustomerFromCache,
    addCustomerToCache,
    // Dashboard
    dashboardCards,
    dashboardLoading,
    fetchDashboard,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};

export const useAppData = () => {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
};

