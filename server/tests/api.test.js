const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');

describe('Business Performance & Sales Analytics API Test Suite', () => {
  let authToken = '';
  let testProductId = '';
  let testCustomerId = '';
  const testEmail = `biz_test_${Date.now()}@example.com`;

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('1. Health Check', () => {
    it('GET /api/health should return 200 OK', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('OK');
    });
  });

  describe('2. Authentication Flow', () => {
    it('POST /api/auth/register should register a user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Analytics Test Manager',
          email: testEmail,
          password: 'pass1234',
          role: 'admin',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      authToken = res.body.token;
    });

    it('POST /api/auth/login should authenticate user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'pass1234',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      authToken = res.body.token;
    });

    it('GET /api/auth/me should return current user profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(testEmail.toLowerCase());
    });
  });

  describe('3. Product Management APIs', () => {
    it('POST /api/products should create a new product', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Gaming Mouse 16000DPI',
          sku: `TEST-MSE-${Date.now()}`,
          category: 'Accessories',
          price: 2499,
          costPrice: 1200,
          stock: 50,
          lowStockThreshold: 5,
        });

      expect(res.status).toBe(201);
      expect(res.body.product).toHaveProperty('_id');
      testProductId = res.body.product._id;
    });

    it('GET /api/products should list products', async () => {
      const res = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.total).toBeGreaterThan(0);
    });
  });

  describe('4. Customer Management APIs', () => {
    it('POST /api/customers should create a customer', async () => {
      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Global Enterprises Inc',
          email: `client_${Date.now()}@global.com`,
          phone: '+91 99999 88888',
          city: 'Mumbai',
        });

      expect(res.status).toBe(201);
      expect(res.body.customer).toHaveProperty('_id');
      testCustomerId = res.body.customer._id;
    });

    it('GET /api/customers should list customers', async () => {
      const res = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.customers)).toBe(true);
      expect(res.body.total).toBeGreaterThan(0);
    });
  });

  describe('5. Sales Management APIs & Automatic Stock Update', () => {
    it('POST /api/sales should create sale and deduct product stock', async () => {
      const res = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerId: testCustomerId,
          items: [
            {
              productId: testProductId,
              quantity: 2,
              unitPrice: 2499,
            },
          ],
          paymentMethod: 'UPI',
        });

      expect(res.status).toBe(201);
      expect(res.body.sale).toHaveProperty('saleNumber');
      expect(res.body.sale.totalAmount).toBe(4998);

      // Verify stock was decremented from 50 to 48
      const prodRes = await request(app)
        .get(`/api/products/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(prodRes.body.product.stock).toBe(48);
      expect(prodRes.body.product.soldCount).toBe(2);
    });

    it('POST /api/sales should fail if requested quantity exceeds stock', async () => {
      const res = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerId: testCustomerId,
          items: [
            {
              productId: testProductId,
              quantity: 999999, // Exceeds available stock
              unitPrice: 2499,
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Insufficient stock/i);
    });

    it('GET /api/sales should retrieve sales records', async () => {
      const res = await request(app)
        .get('/api/sales')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.sales)).toBe(true);
      expect(res.body.total).toBeGreaterThan(0);
    });
  });

  describe('6. Analytics & Dashboard Metrics', () => {
    it('GET /api/analytics/dashboard should return all 6 summary cards and charts', async () => {
      const res = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.cards).toHaveProperty('totalRevenue');
      expect(res.body.cards).toHaveProperty('totalSales');
      expect(res.body.cards).toHaveProperty('totalOrders');
      expect(res.body.cards).toHaveProperty('totalCustomers');
      expect(res.body.cards).toHaveProperty('totalProducts');
      expect(res.body.cards).toHaveProperty('totalProfit');
      expect(res.body.charts).toHaveProperty('monthlyRevenue');
      expect(res.body.charts).toHaveProperty('salesByCategory');
      expect(res.body.charts).toHaveProperty('topProducts');
    });

    it('GET /api/analytics/export/sales should return downloadable CSV', async () => {
      const res = await request(app)
        .get('/api/analytics/export/sales')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/csv/);
      expect(res.text).toContain('Invoice Number');
    });
  });

  describe('7. Notifications API', () => {
    it('GET /api/notifications should return notification list', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.notifications)).toBe(true);
    });
  });

  describe('8. Role-Based Access Control & Admin Operations', () => {
    let staffToken = '';
    const staffEmail = `staff_${Date.now()}@example.com`;

    it('POST /api/auth/register should create a staff/user role', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Staff Member Test',
          email: staffEmail,
          password: 'pass1234',
          role: 'user',
        });

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('user');
      staffToken = res.body.token;
    });

    it('GET /api/admin/stats should reject non-admin users with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Not authorized as an admin/i);
    });

    it('GET /api/admin/stats should reject unauthenticated requests with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/admin/stats');
      expect(res.status).toBe(401);
    });

    it('GET /api/admin/stats should allow Admin and return complete overview metrics & charts', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.metrics).toHaveProperty('totalRevenue');
      expect(res.body.metrics).toHaveProperty('totalSales');
      expect(res.body.metrics).toHaveProperty('totalCustomers');
      expect(res.body.metrics).toHaveProperty('totalProducts');
      expect(res.body.metrics).toHaveProperty('staffUsers');
      expect(res.body.metrics).toHaveProperty('totalProfit');
      expect(res.body).toHaveProperty('monthlyRevenue');
      expect(res.body).toHaveProperty('bestSellingProducts');
      expect(res.body).toHaveProperty('categoryDistribution');
    });

    it('POST /api/admin/users should allow Admin to add a new staff user', async () => {
      const newStaffEmail = `admin_created_staff_${Date.now()}@example.com`;
      const res = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Admin Created Staff',
          email: newStaffEmail,
          password: 'pass1234',
          role: 'user',
        });

      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe(newStaffEmail);
    });

    it('DELETE /api/products/:id should reject Staff with 403 Forbidden', async () => {
      const res = await request(app)
        .delete(`/api/products/${testProductId}`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Not authorized as an admin/i);
    });
  });
});
