import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppDataProvider } from './context/AppDataContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import { useAuth } from './context/AuthContext';

// Pages
import Landing from './pages/Landing';
// Removed obsolete separate login page imports
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Customers from './pages/Customers';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import Messages from './pages/Messages';
import NotFound from './pages/NotFound';

const AppLayout = ({ children }) => {
  const { user } = useAuth();
  if (!user) return children;
  return (
        <div className="flex min-h-screen bg-dark-900 overflow-x-hidden">
      <Navbar />
      <main className="flex-1 lg:ml-64 ml-0 mt-16 p-4 md:p-6 lg:p-8 min-w-0">
        {children}
      </main>
    </div>
  );
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/admin/login" element={<Navigate to="/" replace />} />
      <Route path="/user/login" element={<Navigate to="/" replace />} />
      <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace /> : <Landing />} />
      <Route path="/" element={user ? <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace /> : <Landing />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout><Dashboard /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <AppLayout><Products /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales"
        element={
          <ProtectedRoute>
            <AppLayout><Sales /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <AppLayout><Customers /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <AppLayout><Analytics /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <AppLayout><Reports /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <AppLayout><Notifications /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <AppLayout><Messages /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/admin/messages" element={<Navigate to="/messages" replace />} />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AppLayout><Profile /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppLayout><Profile /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly={true}>
            <AppLayout><AdminDashboard /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute adminOnly={true}>
            <AppLayout><AdminDashboard /></AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Redirect old routes */}
      <Route path="/portfolio" element={<Navigate to="/products" replace />} />
      <Route path="/transactions" element={<Navigate to="/sales" replace />} />
      <Route path="/watchlist" element={<Navigate to="/customers" replace />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppDataProvider>
          <AppRoutes />
        </AppDataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
