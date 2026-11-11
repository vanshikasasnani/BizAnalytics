import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const { mockData } = vi.hoisted(() => ({
  mockData: {
    cards: {
      totalRevenue: 3541079,
      totalSales: 25,
      totalOrders: 25,
      totalCustomers: 11,
      totalProducts: 12,
      totalProfit: 1200000,
      revenueChange: 12,
      salesChange: 5,
      ordersChange: 8,
      customersChange: 3,
      productsChange: 0,
      profitChange: 15,
    },
    charts: {
      monthlyRevenue: [
        { month: 'Nov', revenue: 3541079, profit: 1200000, orders: 25 },
      ],
      salesByCategory: [{ name: 'Electronics', value: 100 }],
      topProducts: [{ name: 'Gaming Laptop Pro', revenue: 85000, quantity: 1 }],
      monthlyOrders: [{ month: 'Nov', orders: 25 }],
      customerGrowth: [{ month: 'Nov', customers: 11 }],
      profitTrend: [{ month: 'Nov', profit: 1200000 }],
    },
    recentSales: [],
    recentCustomers: [],
  },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { _id: 'u1', name: 'Admin', role: 'admin' },
    loading: false,
  }),
}));

vi.mock('../hooks/useSocket', () => ({
  default: () => ({
    notifications: [],
    unreadCount: 0,
    addNotification: vi.fn(),
    markAsRead: vi.fn(),
    clearAll: vi.fn(),
  }),
}));

vi.mock('../context/AppDataContext', () => ({
  useAppData: () => ({
    dashboardCards: mockData.cards,
    dashboardLoading: false,
    fetchDashboard: vi.fn(),
  }),
}));

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: mockData }),
  },
}));

import Dashboard from '../pages/Dashboard';

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );

describe('Dashboard Page', () => {
  it('renders without crashing', () => {
    renderDashboard();
    expect(document.body).toBeTruthy();
  });

  it('renders "Dashboard" or main heading', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/business performance & analytics/i)).toBeInTheDocument();
    });
  });

  it('shows metrics and KPI cards on mount', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/total revenue/i)).toBeInTheDocument();
      expect(screen.getByText(/net profit/i)).toBeInTheDocument();
    });
  });
});
