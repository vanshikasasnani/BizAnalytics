# PortfolioPro — Portfolio Management Platform

A complete, professional **Portfolio Management Platform** built with React + Vite (frontend) and Node.js + Express + MongoDB (backend), featuring real-time notifications via Socket.IO.

---

## 🚀 Tech Stack

**Frontend:** React, Vite, Tailwind CSS, React Router DOM, Axios, Recharts, Socket.IO Client  
**Backend:** Node.js, Express, MongoDB, Mongoose, JWT, bcryptjs, Socket.IO, Nodemon

---

## 📁 Folder Structure

```
portfolio-management-platform/
├── client/              # React frontend (Vite)
│   └── src/
│       ├── components/  # Navbar, ProtectedRoute
│       ├── context/     # AuthContext
│       ├── hooks/       # useSocket
│       ├── pages/       # All pages
│       └── services/    # Axios api.js
└── server/              # Node.js backend
    ├── config/          # db.js
    ├── controllers/     # Route handlers
    ├── middleware/       # Auth, Error middleware
    ├── models/          # Mongoose schemas
    ├── routes/          # Express routes
    └── utils/           # generateToken
```

---

## ⚙️ Setup Instructions

### Step 1 — MongoDB Setup

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) and create a free account
2. Create a new **cluster**
3. Create a **database user** (save username and password)
4. Click **Connect → Connect your application**
5. Copy the connection string (looks like `mongodb+srv://username:password@cluster.mongodb.net/portfoliopro`)
6. Open `server/.env` and replace `your_mongodb_connection_string_here` with your actual string

### Step 2 — Configure Environment Variables

Edit `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/portfoliopro?retryWrites=true&w=majority
JWT_SECRET=choose_a_long_random_secret_string_here
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### Step 3 — Install & Start Backend

```bash
cd server
npm install
npm run dev
```

The backend will start on `http://localhost:5000`

### Step 4 — Install & Start Frontend

Open a new terminal:

```bash
cd client
npm install
npm run dev
```

The frontend will start on `http://localhost:5173`

---

## 🌐 URLs

| Service   | URL                     |
|-----------|-------------------------|
| Frontend  | http://localhost:5173   |
| Backend   | http://localhost:5000   |
| API Root  | http://localhost:5000/api |
| Health    | http://localhost:5000/api/health |

---

## 👤 Registering & Logging In

1. Open `http://localhost:5173`
2. Click **Get Started** to create an account
3. Fill in your name, email, and password (min 6 chars)
4. You'll be redirected to the **Dashboard**

### Creating an Admin Account

You can register with `"role": "admin"` via Postman:

```json
POST http://localhost:5000/api/auth/register
{
  "name": "Admin User",
  "email": "admin@portfoliopro.com",
  "password": "admin123",
  "role": "admin"
}
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | /api/auth/register | Public |
| POST | /api/auth/login | Public |
| GET | /api/auth/me | Private |
| PUT | /api/auth/profile | Private |
| PUT | /api/auth/password | Private |

### Portfolio
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /api/portfolio | Private |
| POST | /api/portfolio | Private |
| GET | /api/portfolio/:id | Private |
| PUT | /api/portfolio/:id | Private |
| DELETE | /api/portfolio/:id | Private |

### Transactions
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /api/transactions | Private |
| POST | /api/transactions | Private |
| PUT | /api/transactions/:id | Private |
| DELETE | /api/transactions/:id | Private |

### Watchlist
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /api/watchlist | Private |
| POST | /api/watchlist | Private |
| PUT | /api/watchlist/:id | Private |
| DELETE | /api/watchlist/:id | Private |

### Admin (Admin only)
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /api/admin/users | Admin |
| GET | /api/admin/stats | Admin |
| PUT | /api/admin/users/:id/toggle | Admin |
| DELETE | /api/admin/users/:id | Admin |

---

## 🧪 Testing with Postman

1. Import the base URL: `http://localhost:5000`
2. Register a user via POST `/api/auth/register`
3. Login via POST `/api/auth/login` → copy the `token`
4. For protected routes, set **Header**: `Authorization: Bearer <token>`

### Example: Add Asset
```json
POST /api/portfolio
Authorization: Bearer <token>

{
  "name": "Reliance Industries",
  "symbol": "RELIANCE",
  "category": "Stocks",
  "quantity": 10,
  "purchasePrice": 2500,
  "currentPrice": 2800
}
```

### Example: Add Transaction
```json
POST /api/transactions
Authorization: Bearer <token>

{
  "type": "Buy",
  "assetName": "Reliance Industries",
  "assetCategory": "Stocks",
  "quantity": 10,
  "price": 2500,
  "amount": 25000
}
```

---

## 📦 Production Build

```bash
# Build frontend
cd client
npm run build

# Start backend in production
cd server
NODE_ENV=production npm start
```

---

## 🔒 Security Notes

- Passwords are hashed with bcryptjs (10 rounds)
- JWT tokens expire in 7 days
- All API routes (except auth) require a valid JWT
- Admin routes require role === 'admin'
- Never commit `.env` files to version control

---

## 📝 Notes

- This is an academic demonstration project
- Prices shown are manually entered / simulated — not live market data
- Do not use with real financial decisions
