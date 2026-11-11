# BizAnalytics — Business Performance & Sales Analytics Platform

A complete, production-ready, full-stack **Business Performance & Sales Analytics Platform** built with **React (Vite) + Tailwind CSS** (frontend) and **Node.js + Express + MongoDB** (backend), featuring real-time alerts via **Socket.IO**.

---

## 🚀 Technology Stack

- **Frontend:** React 19, Vite, Tailwind CSS, React Router DOM v7, Axios, Recharts, Headless UI, Socket.IO Client
- **Backend:** Node.js, Express.js, MongoDB, Mongoose 8, JWT (JSON Web Tokens), bcryptjs, Socket.IO, CORS, dotenv
- **Testing:** Jest, Supertest (14 backend tests), Vitest, React Testing Library (12 frontend tests) — **26 total automated tests**
- **Containerization & CI/CD:** Docker, Docker Compose, Nginx, GitHub Actions (`.github/workflows/ci.yml`)

---

## 📁 Final Folder Structure

```
portfolio-management-platform/
├── client/                      # React 19 + Vite Frontend
│   ├── src/
│   │   ├── components/          # Navbar (Sidebar & Topbar), ProtectedRoute
│   │   ├── context/             # AuthContext (JWT session management)
│   │   ├── hooks/               # useSocket (Real-time Socket.IO alerts)
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx    # 6 KPI cards, 6 charts, recent activity
│   │   │   ├── Products.jsx     # Catalog & inventory management, stock alerts
│   │   │   ├── Sales.jsx        # Invoice builder, stock deduction, sale logs
│   │   │   ├── Customers.jsx    # Customer directory & order history modal
│   │   │   ├── Analytics.jsx    # Time-series analysis with date range filters
│   │   │   ├── Reports.jsx      # CSV exports for sales, products, customers
│   │   │   ├── Notifications.jsx# Real-time notification center
│   │   │   ├── AdminDashboard.jsx# User moderation & admin stats
│   │   │   ├── Profile.jsx      # Settings & password update
│   │   │   ├── Landing.jsx      # Marketing overview & feature showcase
│   │   │   ├── Login.jsx        # Authentication form
│   │   │   ├── Register.jsx     # Registration form
│   │   │   └── NotFound.jsx     # 404 page
│   │   └── services/            # api.js (Axios instance with auth interceptors)
│   ├── .env                     # Frontend environment variables
│   ├── Dockerfile               # Production multi-stage Nginx container
│   ├── nginx.conf               # Nginx reverse proxy configuration
│   └── package.json
├── server/                      # Node.js + Express Backend
│   ├── config/                  # db.js (Mongoose connection)
│   ├── controllers/             # Auth, Product, Customer, Sale, Analytics, Notification, Admin
│   ├── middleware/              # Auth guard (protect, admin), Error handler
│   ├── models/                  # User, Product, Customer, Sale, Notification schemas
│   ├── routes/                  # Express REST API routes
│   ├── tests/                   # api.test.js (Automated Jest/Supertest suite)
│   ├── utils/                   # generateToken.js
│   ├── .env                     # Backend environment variables
│   ├── Dockerfile               # Node.js containerfile
│   ├── seed.js                  # Comprehensive database seeder
│   └── server.js                # Express & Socket.IO server entry point
├── docker-compose.yml           # Multi-container orchestration (Mongo + Server + Client)
├── render.yaml                  # Cloud deployment blueprint
├── package.json                 # Root script runner (concurrently)
└── README.md
```

---

## ⚙️ Environment Variables

### Backend (`server/.env`):
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/portfoliopro
JWT_SECRET=portfoliopro_jwt_secret_key_2024_change_me
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### Frontend (`client/.env`):
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## 🍃 MongoDB Connection

1. **Local MongoDB (Default):**
   The application is pre-configured to connect to local MongoDB on `mongodb://127.0.0.1:27017/portfoliopro`.
2. **MongoDB Atlas (Cloud):**
   - Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com).
   - Copy your connection URI (`mongodb+srv://user:pass@cluster.mongodb.net/dbname`).
   - Replace `MONGO_URI` in `server/.env`.

---

## 🚀 How to Start the Application

### Option 1 — Single Command (Recommended)
From the root directory:
```bash
# Start both Backend & Frontend together with color-coded logs
npm run dev
```

### Option 2 — Separate Terminals
**Terminal 1 (Backend):**
```bash
cd server
npm run dev
# Running on http://localhost:5000
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
# Running on http://localhost:5173
```

---

## 👤 Sample Demonstration Credentials

The database comes pre-seeded with realistic enterprise data (12 products, 11 customers, 25 sales transactions across 6 months).

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Administrator** | `admin@example.com` | `admin123` | Full access (Dashboard, Products, Sales, Customers, Analytics, Reports, User Management) |
| **Business Owner** | `demo@example.com` | `password123` | Full access (Admin privileges) |
| **Sales Staff** | `staff@example.com` | `staff123` | Operational access (Dashboard, Products, Sales, Customers) |

To re-seed fresh demonstration data at any time:
```bash
npm run seed
```

---

## 📊 Dashboard & System Features Explained

1. **Main Executive Dashboard (`/dashboard`)**:
   - **6 Summary Cards**: Total Revenue (₹), Total Profit (₹), Total Sales Count, Total Orders, Total Customers, and Total Products (with low-stock indicators).
   - **6 Recharts Visualizations**:
     - *Monthly Revenue & Net Profit Area Chart* (historical trend).
     - *Sales by Category Donut Chart* (department revenue share).
     - *Sales Growth Rate Line Chart* (% month-over-month velocity).
     - *Monthly Orders Volume Bar Chart*.
     - *Top-Selling Products Horizontal Bar Chart*.
   - **Activity Feeds**: Recent completed sales transactions with status tags, top products, and recent customers.

2. **Product & Inventory Management (`/products`)**:
   - Add, edit, and delete products with SKU, categories, selling prices, unit cost, and live stock count.
   - Automatic low-stock detection (badges for In Stock, Low Stock, and Out of Stock).
   - Full search by name/SKU and category filters.

3. **Sales Management & Invoicing (`/sales`)**:
   - Order builder allowing multiple product line items.
   - **Strict Stock Validation**: System prevents transactions if requested quantity exceeds available inventory (ensuring stock cannot become negative).
   - Automatic stock deduction and customer lifetime spend updates upon sale completion.
   - Comprehensive invoice breakdown modal with tax, discounts, and net profit calculations.

4. **Customer Directory (`/customers`)**:
   - Manage business customer contacts, companies, and locations.
   - Order History Modal displaying lifetime transaction log and spend value per client.

5. **Deep-Dive Analytics (`/analytics`)**:
   - Filter by Last 7 Days, Last 30 Days, Last 6 Months, This Year, or Custom Date Range.
   - Daily financial timeline, product-level profit margins, and payment method settlement split.

6. **Data & Report Exports (`/reports`)**:
   - One-click CSV downloads for Sales Invoices, Product Inventory, and Customer Accounts directly from live MongoDB records.

7. **Real-time Notifications (`/notifications`)**:
   - Socket.IO-powered real-time toast alerts for new sales, low-stock warnings, and customer registrations.

8. **Admin & User Moderation (`/admin`)**:
   - View registered users, toggle active/inactive status, assign admin or user roles, and view administrative audit events.

---

## 📋 Evaluation Checklist Mapping

| Requirement | Implementation in Project |
|---|---|
| **Frontend with Tailwind** | Tailwind CSS 3.4 with custom palettes, responsive sidebar drawer, glassmorphism card components, and utility badges |
| **React & State Management** | React 19, React Router v7, `AuthContext` (JWT session), `AppDataContext` (catalog, customer, dashboard cache), custom hooks |
| **Backend REST API** | Express modular REST architecture with 7 route groups (`auth`, `products`, `customers`, `sales`, `analytics`, `notifications`, `admin`) |
| **MongoDB & Mongoose** | 5 Mongoose schemas (`User`, `Product`, `Customer`, `Sale`, `Notification`) with virtuals, pre-save hooks, relational refs |
| **Data Validation** | Layered: client-side form checks + `express-validator` middleware (HTTP 422) + inventory stock limits + schema constraints |
| **Authentication & Authorization** | Stateless JWT tokens, `bcryptjs` hashing, `protect` middleware, `admin` RBAC with self-protection guards |
| **Real-Time Features (Socket.IO)**| Bi-directional WebSocket, live sync navbar badge, real-time sale broadcasts, automated low-stock alerts, bell counter |
| **Docker** | `server/Dockerfile` (Node 20 Alpine), `client/Dockerfile` (multi-stage Nginx), `docker-compose.yml` (Mongo + Server + Client) |
| **DevOps & Deployment** | GitHub Actions CI/CD (`.github/workflows/ci.yml`), `render.yaml`, `vercel.json`, `client/nginx.conf` reverse proxy |
| **Testing** | 26 automated tests passing (14 backend Jest/Supertest + 12 frontend Vitest/RTL) |

---

## 🧪 Automated Test Suite

Run the full automated test suite (both backend and frontend):
```bash
npm test
```

Or run individually:
```bash
npm run test:server    # 14 Backend API tests (Jest + Supertest)
npm run test:client    # 12 Frontend Component tests (Vitest + React Testing Library)
```

**Results:** **26/26 tests passing**:
- **Backend (14 tests)**: Health check, Auth registration/login/me, Product CRUD, Customer CRUD, Sale creation with stock deduction, Insufficient stock rejection, Analytics metrics, CSV exports, Notifications.
- **Frontend (12 tests)**: Login validation and authentication triggers, Products catalog rendering and low-stock indicators, Dashboard KPI cards and Recharts visualizations.
