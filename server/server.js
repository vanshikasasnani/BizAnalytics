const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Route imports
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const customerRoutes = require('./routes/customerRoutes');
const saleRoutes = require('./routes/saleRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const messageRoutes = require('./routes/messageRoutes');
const jwt = require('jsonwebtoken');

// Connect to database
connectDB();

const app = express();
const httpServer = http.createServer(app);

const allowedOrigins = [
  process.env.CLIENT_ORIGIN,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
};

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => callback(null, true),
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Store io instance for use in controllers
app.set('io', io);

// Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      socket.userId = decoded.id;
    } catch (err) {
      console.warn('Socket token verification failed:', err.message);
    }
  }
  next();
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Auto-join verified user room
  if (socket.userId) {
    socket.join(socket.userId.toString());
    console.log(`👤 Socket automatically joined authenticated room: ${socket.userId}`);
  }

  // Backwards-compatible room join
  socket.on('join', (userId) => {
    if (userId) {
      socket.join(userId.toString());
      console.log(`👤 User ${userId} joined their room`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/messages', messageRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Business Performance & Sales Analytics API is running 🚀' });
});

// Error Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Socket.IO ready`);
    console.log(`🌐 API: http://localhost:${PORT}/api`);
  });
}

module.exports = { app, httpServer };
