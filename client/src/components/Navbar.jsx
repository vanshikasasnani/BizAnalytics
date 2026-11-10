import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useSocket from '../hooks/useSocket';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/portfolio', label: 'Portfolio', icon: '💼' },
  { to: '/transactions', label: 'Transactions', icon: '↔️' },
  { to: '/watchlist', label: 'Watchlist', icon: '👁️' },
  { to: '/profile', label: 'Profile', icon: '👤' },
];

const NotificationIcon = ({ count }) => (
  <span className="relative">
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
    {count > 0 && (
      <span className="absolute -top-1.5 -right-1.5 bg-danger-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
        {count > 9 ? '9+' : count}
      </span>
    )}
  </span>
);

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { notifications, dismissNotification, clearAll } = useSocket();
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
    navigate('/');
  };

  const getTypeIcon = (type) => {
    if (type === 'asset_added') return '📈';
    if (type === 'transaction_created') return '💸';
    if (type === 'portfolio_updated') return '🔄';
    return '🔔';
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full z-40 flex flex-col bg-dark-800 border-r border-dark-700 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-16 lg:w-64'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-dark-700 h-16">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-navy-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className={`font-display font-bold text-white text-lg transition-all duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 lg:opacity-100'}`}>
            PortfolioPro
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <span className="text-lg flex-shrink-0">{icon}</span>
              <span className={`transition-all duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 lg:opacity-100'}`}>
                {label}
              </span>
            </NavLink>
          ))}
          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="text-lg flex-shrink-0">🛡️</span>
              <span className={`transition-all duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 lg:opacity-100'}`}>
                Admin
              </span>
            </NavLink>
          )}
        </nav>

        {/* User info */}
        <div className="border-t border-dark-700 p-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-xs">{user?.name?.[0]?.toUpperCase()}</span>
            </div>
            <div className={`flex-1 min-w-0 transition-all duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 lg:opacity-100'}`}>
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <p className="text-dark-400 text-xs truncate">{user?.role === 'admin' ? '🛡️ Admin' : 'User'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className={`w-full mt-1 flex items-center gap-3 px-4 py-2.5 rounded-xl text-dark-400 hover:text-danger-400 hover:bg-danger-500/10 transition-all duration-200 text-sm font-medium`}
          >
            <span className="text-lg flex-shrink-0">🚪</span>
            <span className={`transition-all duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 lg:opacity-100'}`}>
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* Top bar */}
      <header className="fixed top-0 right-0 z-30 h-16 flex items-center justify-between px-4 bg-dark-800/80 backdrop-blur-md border-b border-dark-700 transition-all duration-300 lg:left-64 left-16">
        {/* Mobile burger */}
        <button
          className="lg:hidden p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700 transition-colors"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Page title */}
        <div className="hidden sm:block">
          <p className="text-white font-semibold capitalize">
            {location.pathname.replace('/', '').replace('-', ' ') || 'Dashboard'}
          </p>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="p-2 rounded-xl text-dark-400 hover:text-white hover:bg-dark-700 transition-all duration-200"
            >
              <NotificationIcon count={notifications.length} />
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-dark-800 border border-dark-600 rounded-2xl shadow-2xl z-50 animate-fade-in">
                <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700">
                  <h3 className="text-white font-semibold text-sm">Notifications</h3>
                  {notifications.length > 0 && (
                    <button onClick={clearAll} className="text-dark-400 hover:text-white text-xs transition-colors">
                      Clear all
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-dark-400 text-sm text-center py-6">No notifications</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-dark-700/50 border-b border-dark-700/50 last:border-0 cursor-pointer"
                        onClick={() => dismissNotification(n.id)}
                      >
                        <span className="text-lg mt-0.5">{getTypeIcon(n.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-dark-200 text-xs leading-relaxed">{n.message}</p>
                          <p className="text-dark-500 text-[11px] mt-0.5">
                            {new Date(n.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy-500 to-purple-600 flex items-center justify-center cursor-pointer">
            <span className="text-white font-semibold text-xs">{user?.name?.[0]?.toUpperCase()}</span>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default Navbar;
