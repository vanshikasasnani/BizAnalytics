import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const { mockProductList } = vi.hoisted(() => ({
  mockProductList: [
    {
      _id: 'p1',
      name: 'Gaming Laptop Pro',
      sku: 'LAP-001',
      category: 'Electronics',
      price: 85000,
      costPrice: 65000,
      stock: 15,
      lowStockThreshold: 5,
      status: 'Active',
      soldCount: 10,
    },
    {
      _id: 'p2',
      name: 'Mechanical Keyboard RGB',
      sku: 'KEY-001',
      category: 'Accessories',
      price: 4999,
      costPrice: 2500,
      stock: 2,
      lowStockThreshold: 5,
      status: 'Active',
      soldCount: 30,
    },
  ],
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { _id: 'u1', name: 'Admin', role: 'admin' },
    loading: false,
  }),
}));

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: {
        products: mockProductList,
        total: 2,
        page: 1,
        pages: 1,
      },
    }),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import Products from '../pages/Products';

const renderProducts = () =>
  render(
    <MemoryRouter>
      <Products />
    </MemoryRouter>
  );

describe('Products Page', () => {
  it('renders without crashing', () => {
    renderProducts();
    expect(document.body).toBeTruthy();
  });

  it('renders "Product Inventory Management" heading', async () => {
    renderProducts();
    await waitFor(() => {
      expect(screen.getByText(/product inventory management/i)).toBeInTheDocument();
    });
  });

  it('displays product names after loading', async () => {
    renderProducts();
    await waitFor(() => {
      expect(screen.getByText(/Gaming Laptop Pro/i)).toBeInTheDocument();
      expect(screen.getByText(/Mechanical Keyboard RGB/i)).toBeInTheDocument();
    });
  });

  it('shows low-stock badge for items below threshold', async () => {
    renderProducts();
    await waitFor(() => {
      expect(screen.getByText(/low stock/i)).toBeInTheDocument();
    });
  });

  it('renders "Add New Product" button', async () => {
    renderProducts();
    await waitFor(() => {
      expect(screen.getByText(/add new product/i)).toBeInTheDocument();
    });
  });
});
