import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useSocket from '../hooks/useSocket';

// Navigation items in the exact requested order
const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/products', label: 'Products', icon: '📦' },
  { to: '/sales', label: 'Sales', icon: '💳' },
  { to: '/customers', label: 'Customers', icon: '👥' },
  { to: '/analytics', label: 'Analytics', icon: '📈' },
  { to: '/reports', label: 'Reports', icon: '📑' },
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { notifications, unreadCount, markAsRead, clearAll } = useSocket();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/products')) return 'Products';
    if (path.startsWith('/sales')) return 'Sales';
    if (path.startsWith('/customers')) return 'Customers';
    if (path.startsWith('/analytics')) return 'Analytics';
    if (path.startsWith('/reports')) return 'Reports';
    if (path.startsWith('/notifications')) return 'Notifications';
    if (path.startsWith('/admin')) return 'User Management';
    if (path.startsWith('/settings') || path.startsWith('/profile')) return 'Settings';
    return 'Business Overview';
  };

  const getTypeIcon = (type) => {
    if (type === 'sale') return '💰';
    if (type === 'product') return '📦';
    if (type === 'low_stock') return '⚠️';
    if (type === 'customer') return '👤';
    return '🔔';
  };

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full z-40 flex flex-col bg-dark-800 border-r border-dark-700 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-0 lg:w-64 -translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-dark-700 h-16">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-navy-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-navy-600/30">
            <span className="text-white font-extrabold text-base">BA</span>
          </div>
          <div className="min-w-0">
            <span className="font-display font-bold text-white text-base block truncate">
              BizAnalytics
            </span>
            <span className="text-[11px] text-navy-400 font-medium block truncate">
              Business Platform
            </span>
          </div>
        </div>

        {/* Navigation Links in Required Order */}
        <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-navy-600/20 text-navy-400 border border-navy-500/30'
                    : 'text-dark-300 hover:text-white hover:bg-dark-700/60'
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <span className="text-lg flex-shrink-0">{icon}</span>
              <span className="truncate">{label}</span>
            </NavLink>
          ))}

          {/* User Management (Admin only) - 7th item in the list */}
          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                    : 'text-dark-300 hover:text-white hover:bg-dark-700/60'
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <span className="text-lg flex-shrink-0">🛡️</span>
              <span className="truncate">User Management</span>
            </NavLink>
          )}
        </nav>

        {/* User Footer & Logout */}
        <div className="p-3 border-t border-dark-700 bg-dark-850">
          <Link
            to="/settings"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-2.5 py-2 mb-2 rounded-xl bg-dark-800 hover:bg-dark-750 border border-dark-700 transition-colors"
            title="Edit Profile & Settings"
          >
            <div className="w-8 h-8 rounded-lg bg-navy-600/30 border border-navy-500/30 flex items-center justify-center font-bold text-navy-300 text-xs flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-dark-400 capitalize truncate">{user?.role} Access</p>
            </div>
            <span className="text-xs text-dark-500">⚙️</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-dark-400 hover:text-danger-400 hover:bg-danger-500/10 rounded-xl transition-all"
          >
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Top Navbar */}
      <header className="fixed top-0 right-0 left-0 lg:left-64 h-16 bg-dark-850/95 backdrop-blur-md border-b border-dark-700 z-20 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 text-dark-300 hover:text-white hover:bg-dark-700 rounded-lg"
          >
            ☰
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white truncate font-display">
              {getPageTitle()}
            </h1>
          </div>
        </div>

        {/* Top Right Controls: Notification Icon & User Profile */}
        <div className="flex items-center gap-3">
          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 text-dark-300 hover:text-white hover:bg-dark-700 rounded-xl transition-colors"
              title="Notifications"
            >
              <span className="text-lg">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-danger-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-dark-800 border border-dark-700 rounded-2xl shadow-2xl overflow-hidden z-50 animate-slide-up">
                <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700 bg-dark-850">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="bg-navy-500/20 text-navy-400 text-xs px-2 py-0.5 rounded-full font-medium">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={clearAll}
                      className="text-xs text-navy-400 hover:text-navy-300"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-dark-700/50">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-dark-500 text-xs">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <div
                        key={n._id || n.id}
                        className={`p-3.5 flex items-start gap-3 hover:bg-dark-750 transition-colors ${
                          !n.read ? 'bg-navy-950/30' : ''
                        }`}
                      >
                        <span className="text-lg flex-shrink-0 mt-0.5">{getTypeIcon(n.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{n.title}</p>
                          <p className="text-[11px] text-dark-300 mt-0.5 leading-snug">{n.message}</p>
                          <span className="text-[10px] text-dark-500 mt-1 block">
                            {new Date(n.createdAt || Date.now()).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {!n.read && (
                          <button
                            onClick={() => markAsRead(n._id || n.id)}
                            className="text-dark-500 hover:text-dark-300 text-xs"
                            title="Mark as read"
                          >
                            ✓
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 border-t border-dark-700 bg-dark-850 text-center">
                  <Link
                    to="/notifications"
                    onClick={() => setNotifOpen(false)}
                    className="text-xs text-navy-400 hover:text-navy-300 font-medium"
                  >
                    View All Notifications →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill in Header */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-dark-800 border border-dark-700">
            <div className="w-6 h-6 rounded-lg bg-navy-600/40 flex items-center justify-center font-bold text-navy-300 text-xs">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="text-xs text-white font-medium truncate max-w-[120px]">{user?.name}</span>
          </div>
        </div>
      </header>
    </>
  );
};

export default Navbar;
