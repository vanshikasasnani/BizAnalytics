import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useSocket from '../hooks/useSocket';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/products', label: 'Products', icon: '📦' },
  { to: '/sales', label: 'Sales', icon: '💳' },
  { to: '/customers', label: 'Customers', icon: '👥' },
  { to: '/analytics', label: 'Analytics', icon: '📈' },
  { to: '/reports', label: 'Reports', icon: '📑' },
  { to: '/notifications', label: 'Notifications', icon: '🔔' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
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
    if (path.startsWith('/products')) return 'Product Management';
    if (path.startsWith('/sales')) return 'Sales & Transactions';
    if (path.startsWith('/customers')) return 'Customer Directory';
    if (path.startsWith('/analytics')) return 'Performance Analytics';
    if (path.startsWith('/reports')) return 'Reports & Data Export';
    if (path.startsWith('/notifications')) return 'Notifications Center';
    if (path.startsWith('/admin')) return 'Admin & User Management';
    if (path.startsWith('/settings')) return 'Account Settings';
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
              Performance Platform
            </span>
          </div>
        </div>

        {/* Navigation Links */}
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
              {label === 'Notifications' && unreadCount > 0 && (
                <span className="ml-auto bg-danger-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </NavLink>
          ))}

          {/* Admin link */}
          {user?.role === 'admin' && (
            <div className="pt-2 mt-2 border-t border-dark-700/60">
              <span className="px-3 text-[11px] font-semibold tracking-wider text-dark-500 uppercase">
                Administration
              </span>
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 mt-1 rounded-xl font-medium text-sm transition-all duration-200 ${
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
            </div>
          )}
        </nav>

        {/* User Footer & Logout */}
        <div className="p-3 border-t border-dark-700 bg-dark-850">
          <div className="flex items-center gap-3 px-2 py-2 mb-2 rounded-xl bg-dark-800 border border-dark-700">
            <div className="w-8 h-8 rounded-lg bg-navy-600/30 border border-navy-500/30 flex items-center justify-center font-bold text-navy-300 text-xs flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-dark-400 capitalize truncate">{user?.role} Access</p>
            </div>
          </div>
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
            <span className="hidden sm:inline-block text-[11px] text-dark-400">
              Live Business Analytics • MongoDB Connected
            </span>
          </div>
        </div>

        {/* Top Right Controls */}
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
                    <div className="py-8 text-center text-dark-400 text-sm">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id || n.id}
                        onClick={() => {
                          if (!n.read) markAsRead(n._id || n.id);
                          if (n.link) navigate(n.link);
                          setNotifOpen(false);
                        }}
                        className={`p-3.5 hover:bg-dark-700/50 transition-colors cursor-pointer flex gap-3 ${
                          !n.read ? 'bg-navy-600/5' : ''
                        }`}
                      >
                        <span className="text-xl flex-shrink-0">{getTypeIcon(n.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{n.title}</p>
                          <p className="text-xs text-dark-300 mt-0.5 line-clamp-2">{n.message}</p>
                          <span className="text-[10px] text-dark-500 mt-1 block">
                            {new Date(n.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-navy-400 flex-shrink-0 self-center" />
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 border-t border-dark-700 bg-dark-850 text-center">
                  <button
                    onClick={() => {
                      setNotifOpen(false);
                      navigate('/notifications');
                    }}
                    className="text-xs text-navy-400 hover:text-navy-300 font-medium py-1"
                  >
                    View All Notifications →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Badge */}
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-dark-700">
            <div className="w-8 h-8 rounded-lg bg-navy-600/30 border border-navy-500/30 flex items-center justify-center font-bold text-navy-300 text-xs">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="text-left">
              <span className="text-xs font-semibold text-white block leading-tight">{user?.name}</span>
              <span className="text-[10px] text-navy-400 uppercase tracking-wider font-medium">{user?.role}</span>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Navbar;
