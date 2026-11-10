const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');

describe('PortfolioPro Backend API Test Suite', () => {
  let authToken = '';
  const testEmail = `test_${Date.now()}@example.com`;

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('1. System Health API', () => {
    it('GET /api/health should return 200 OK', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('OK');
    });
  });

  describe('2. Authentication Flow', () => {
    it('POST /api/auth/register should register a new test user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Automated Test User',
          email: testEmail,
          password: 'password123',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe(testEmail.toLowerCase());
      authToken = res.body.token;
    });

    it('POST /api/auth/login should authenticate with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'password123',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      authToken = res.body.token;
    });

    it('POST /api/auth/login should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'wrongpassword',
        });

      expect(res.status).toBe(401);
    });

    it('GET /api/auth/me should return current user profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(testEmail.toLowerCase());
    });
  });

  describe('3. Portfolio & Market Quotes API', () => {
    it('GET /api/portfolio should return user portfolio', async () => {
      const res = await request(app)
        .get('/api/portfolio')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('portfolio');
      expect(Array.isArray(res.body.portfolio.assets)).toBe(true);
    });

    it('POST /api/portfolio should add an asset to portfolio', async () => {
      const res = await request(app)
        .post('/api/portfolio')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Microsoft Corporation',
          symbol: 'MSFT',
          category: 'Stocks',
          quantity: 10,
          purchasePrice: 400,
          currentPrice: 420,
        });

      expect(res.status).toBe(201);
      expect(res.body.asset.name).toBe('Microsoft Corporation');
    });

    it('GET /api/portfolio/quote/:symbol should fetch live market quote', async () => {
      const res = await request(app)
        .get('/api/portfolio/quote/AAPL')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.quote.symbol).toBe('AAPL');
      expect(res.body.quote.price).toBeGreaterThan(0);
    });
  });

  describe('4. Transactions API', () => {
    it('POST /api/transactions should record a new transaction', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'Buy',
          assetName: 'Microsoft Corporation',
          assetCategory: 'Stocks',
          quantity: 10,
          price: 400,
          amount: 4000,
        });

      expect(res.status).toBe(201);
      expect(res.body.transaction.type).toBe('Buy');
    });

    it('GET /api/transactions should retrieve transaction list', async () => {
      const res = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.transactions)).toBe(true);
      expect(res.body.transactions.length).toBeGreaterThan(0);
    });
  });

  describe('5. Watchlist API', () => {
    it('GET /api/watchlist should retrieve user watchlist', async () => {
      const res = await request(app)
        .get('/api/watchlist')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('watchlist');
    });
  });
});
