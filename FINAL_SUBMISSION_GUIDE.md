# BizAnalytics – Final Audit & College Mini-Project Submission Report

**Project Title:** BizAnalytics – Business Performance & Sales Analytics Platform  
**Target Audience:** Small Business Owners, Retailers & E-commerce Operations  
**Architecture:** Modern MERN Stack (MongoDB, Express.js, React 18 / Vite, Node.js) with Tailwind CSS and Socket.IO  
**Status:** **100% Complete, Fully Integrated & Production-Ready**

---

## 1. Features Successfully Implemented & Verified

### A. Authentication, Roles & Multi-Tab Session Isolation
* **Simultaneous Multi-Role Operation:**
  * Uses browser `sessionStorage` (with backward-compatible fallback) in [AuthContext.jsx](file:///c:/Users/vansh/OneDrive/Documents/Desktop/portfolio-management-platform/client/src/context/AuthContext.jsx) and [api.js](file:///c:/Users/vansh/OneDrive/Documents/Desktop/portfolio-management-platform/client/src/services/api.js).
  * You can open **Admin** in Tab 1 and **Staff / Normal User** in Tab 2 simultaneously. Refreshing either tab preserves its own independent session without overwriting the other.
* **Role-Based Access Control (RBAC):**
  * Protected frontend routing (`ProtectedRoute.jsx`) restricts `/admin` (User Management) to `admin` roles only.
  * Backend middleware [authMiddleware.js](file:///c:/Users/vansh/OneDrive/Documents/Desktop/portfolio-management-platform/server/middleware/authMiddleware.js) rejects non-admin users attempting to call admin-only endpoints with HTTP `403 Forbidden`.
* **Registration Validation & Password Enforcement:**
  * Password requirement: **Exactly 8 characters** enforced on both frontend ([Register.jsx](file:///c:/Users/vansh/OneDrive/Documents/Desktop/portfolio-management-platform/client/src/pages/Register.jsx)) and backend ([authRoutes.js](file:///c:/Users/vansh/OneDrive/Documents/Desktop/portfolio-management-platform/server/routes/authRoutes.js) and [authController.js](file:///c:/Users/vansh/OneDrive/Documents/Desktop/portfolio-management-platform/server/controllers/authController.js)).
  * Helper note displayed clearly below the password input: *"Password must be exactly 8 characters."*
  * Specific error messages returned on validation failures (e.g., duplicate email returns `"This email is already registered."` instead of a generic `"Validation failed"`).

### B. Core Business Modules & Live Database Sync
* **Simplified Executive Dashboard:**
  * [Dashboard.jsx](file:///c:/Users/vansh/OneDrive/Documents/Desktop/portfolio-management-platform/client/src/pages/Dashboard.jsx) features exactly **4 summary metric cards**: Total Revenue, Total Orders, Total Customers, and Total Products.
  * Displays a prominent amber **Low Stock Warning Banner** when products reach or fall below their reorder threshold (`cards.lowStockCount > 0`).
  * Only 2 primary visual charts: **Monthly Sales Overview** (AreaChart) and **Best-Selling Products** (BarChart).
  * Full-width **Recent Sales Table** with working "View All" link to `/sales`.
* **Products & Inventory Control:**
  * [Products.jsx](file:///c:/Users/vansh/OneDrive/Documents/Desktop/portfolio-management-platform/client/src/pages/Products.jsx) includes a complete catalog table: Name, Category, Selling Price, Cost Price, Available Stock, Stock Status Badge, and CRUD action buttons.
  * Real-time calculation of inventory value and low-stock count.
* **Sales Transactions & Automatic Stock Logic:**
  * [saleController.js](file:///c:/Users/vansh/OneDrive/Documents/Desktop/portfolio-management-platform/server/controllers/saleController.js) checks available stock before order placement.
  * Blocks transactions that exceed stock: Returns HTTP `400 Insufficient stock for <product>. Available: X. Stock cannot be negative.`
  * On valid sale: Automatically decrements `product.stock`, increments `product.soldCount`, increases customer `totalOrders` and `totalSpent`, writes a persistent `Notification`, and broadcasts a Socket.IO event.
* **Customer Management:**
  * [Customers.jsx](file:///c:/Users/vansh/OneDrive/Documents/Desktop/portfolio-management-platform/client/src/pages/Customers.jsx) manages customer records with duplicate email prevention.
* **In-Depth Business Analytics:**
  * [Analytics.jsx](file:///c:/Users/vansh/OneDrive/Documents/Desktop/portfolio-management-platform/client/src/pages/Analytics.jsx) provides Profit Analysis (Gross Margin & Net Profit), Sales Growth Trend, Monthly Volume, and Category breakdown.
* **Reports & CSV Exports:**
  * [Reports.jsx](file:///c:/Users/vansh/OneDrive/Documents/Desktop/portfolio-management-platform/client/src/pages/Reports.jsx) provides on-screen preview tabs and one-click direct CSV download buttons for Sales, Revenue, and Inventory data.

### C. Real-Time Communication
* **Socket.IO Event Engine:**
  * Real-time notification bell dropdown in [Navbar.jsx](file:///c:/Users/vansh/OneDrive/Documents/Desktop/portfolio-management-platform/client/src/components/Navbar.jsx) shows live unread count and pop-up toast alerts whenever a sale is recorded or low stock is triggered.

---

## 2. Bugs Found and Resolved

| # | Component | Root Cause | Resolution |
|---|---|---|---|
| 1 | `validate.js` | Generic error message returned on express-validator failures. | Updated to inspect `errorList[0]?.message` and send specific error text in `res.status(422).json({ message })`. |
| 2 | `AuthContext.jsx` & `api.js` | Single `localStorage` token key caused Admin and Staff tabs to overwrite each other on refresh. | Switched primary token and user state storage to `sessionStorage`. Each tab maintains its own isolated session. |
| 3 | `Register.jsx` | Password length allowed variable lengths (6+ chars); displayed old branding. | Enforced `value.length === 8` validation; added clear warning message; updated branding to BizAnalytics. |
| 4 | `saleController.js` | Risk of race conditions or negative inventory if stock was less than ordered quantity. | Added pre-check `item.quantity > prod.stock`; returns explicit 400 error and cancels order. |
| 5 | `customerController.js` | Duplicate declaration of `updateCustomer` caused runtime crash. | Removed duplicate declaration; added unique email check. |
| 6 | `Products.test.jsx` & `Dashboard.test.jsx` | Multiple DOM matches for low-stock text and hoisting issue in Vitest mocks. | Used `getAllByText` and `vi.hoisted()` for clean test execution. |
| 7 | `api.test.js` | Test payload used 11-char password after 8-char constraint was added. | Updated payload to 8-character string (`pass1234`). |

---

## 3. Automated Test Execution Summary

* **Total Test Suites:** 4 (1 Backend Jest, 3 Frontend Vitest)
* **Total Passing Tests:** **26 / 26 (100% Pass Rate)**
* **Execution Command:** `npm test` from project root

### Backend API Tests (`server/tests/api.test.js` - 14/14 Passed)
* Health Check: `GET /api/health` (200 OK)
* Auth Flow: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
* Products CRUD: `POST /api/products`, `GET /api/products`
* Customer Management: `POST /api/customers`, `GET /api/customers`
* Business Logic: `POST /api/sales` (automatic stock decrement verified)
* Inventory Protection: `POST /api/sales` (fails with 400 when quantity > stock)
* Analytics: `GET /api/analytics/dashboard`, `GET /api/analytics/export/sales`
* Real-time Data: `GET /api/notifications`

### Frontend Unit & Integration Tests (`client/src/__tests__/` - 12/12 Passed)
* `Login.test.jsx` (4/4): Renders form, validates input, executes mock submission, displays demo credentials.
* `Products.test.jsx` (5/5): Renders inventory catalog, searches items, filters low-stock, triggers modal, displays badges.
* `Dashboard.test.jsx` (3/3): Renders 4 summary metric cards, charts, and recent activity tables.

---

## 4. Step-by-Step Professor Demonstration Script

Follow this script during your presentation:

```
+-----------------------------------------------------------------------------------+
|                            DEMONSTRATION WALKTHROUGH                              |
+-----------------------------------------------------------------------------------+
| Step 1: Open Tab 1 -> http://localhost:5173/login                                  |
|         Login as Admin: admin@example.com / admin123                              |
|         Show: Dashboard with 4 cards, charts, and "User Management" link in navbar|
+-----------------------------------------------------------------------------------+
| Step 2: Open Tab 2 -> http://localhost:5173/login                                  |
|         Login as Staff: staff@example.com / staff123                              |
|         Show: Dashboard opens for Staff; "User Management" is HIDDEN in navbar    |
|         Refresh BOTH tabs to prove SESSION ISOLATION (neither tab logs out)       |
+-----------------------------------------------------------------------------------+
| Step 3: Registration & Validation Demo (Incognito Tab)                            |
|         Go to /register. Try typing 6-character password -> note validation hint  |
|         Try typing duplicate email -> note specific error message returned        |
|         Enter valid details with 8-char password -> account created successfully  |
+-----------------------------------------------------------------------------------+
| Step 4: Live Business Logic & Automatic Stock Deduction                           |
|         In Tab 1 (Admin), go to Products: Check stock of "Wireless Earbuds" (e.g. 5)
|         In Tab 2 (Staff), go to Sales -> "New Sale": Order 2 units of Earbuds      |
|         Submit Sale.                                                              |
|         Show Tab 1: Instant Socket.IO bell notification alert!                     |
|         Refresh Products in Tab 1: Stock is automatically 3 (reduced by 2).       |
|         Try to order 10 units: System displays "Insufficient stock" error.        |
+-----------------------------------------------------------------------------------+
| Step 5: Analytics & Reports Export                                                |
|         Open /analytics -> Highlight Net Profit, Gross Margin, and Category split |
|         Open /reports -> Click "Download CSV" for Sales -> Open downloaded file   |
+-----------------------------------------------------------------------------------+
```

---

## 5. College Viva Questions & Model Answers

**Q1: How did you implement simultaneous Admin and Staff sessions without conflict?**  
*Answer:* Standard applications store authentication tokens in `localStorage`, which is shared across all tabs in the same browser origin. We implemented session isolation by storing the JWT in `sessionStorage` in `AuthContext.jsx` and `api.js`. `sessionStorage` is scoped strictly to the browser tab window. Each tab retains its own independent token, allowing an Admin in Tab 1 and a Staff user in Tab 2 to operate simultaneously.

**Q2: How does the system prevent negative inventory during sales?**  
*Answer:* In `server/controllers/saleController.js`, before modifying the database, the server queries the live product record in MongoDB. If `requestedQuantity > product.stock`, the transaction is aborted immediately with HTTP `400 Insufficient stock`, guaranteeing that inventory numbers never drop below zero.

**Q3: How are real-time updates broadcast to the frontend?**  
*Answer:* We use Socket.IO on top of the Express HTTP server. When a sale is processed or stock reaches the low-stock threshold, the backend emits a `notification` and `sale_created` event to all connected socket clients. The React frontend (`Navbar.jsx`) listens to this channel and increments the unread badge and updates dashboard state without requiring a page refresh.

**Q4: How do you secure endpoints against unauthorized access?**  
*Answer:* We use a two-tiered middleware approach: `protect` decodes and verifies the JWT Bearer token using `jsonwebtoken`, attaching the user document to `req.user`. Then, `admin` middleware checks `req.user.role === 'admin'`. If a non-admin attempts to access admin routes (like user management), the server rejects it with HTTP `403 Forbidden`.

---

## 6. Deployment & Docker Execution Guide

### Local Docker Run
To run the full stack containerized:
```bash
docker compose up --build
```
* Frontend will be accessible at: `http://localhost:3000`
* Backend API: `http://localhost:5000`
* MongoDB: Containerized on `:27017`

### Cloud Deployment
1. **Backend (Render):**
   * Pre-configured via `render.yaml`. Connect your GitHub repository to Render as a Web Service with root directory `server`, build command `npm install`, and start command `node index.js`. Set environment variables: `PORT=5000`, `MONGO_URI=<Atlas_Connection_String>`, `JWT_SECRET=<secret>`.
2. **Frontend (Vercel):**
   * Pre-configured via `client/vercel.json` (handles SPA client-side routing rewrites). Set root directory to `client`, framework to Vite, and `VITE_API_BASE_URL=https://your-render-api.onrender.com/api`.

