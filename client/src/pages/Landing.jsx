import { Link } from 'react-router-dom';

const features = [
  {
    icon: '📊',
    title: 'Executive Sales Dashboard',
    desc: 'Live key performance indicators: gross revenue, net profits, sales volume, order counts, and category breakdowns.',
  },
  {
    icon: '📦',
    title: 'Inventory & Product Catalog',
    desc: 'Track available stock, unit costs, pricing margins, automated low-stock warnings, and SKU sales velocity.',
  },
  {
    icon: '💳',
    title: 'Sales & Invoicing Pipeline',
    desc: 'Process customer sales with real-time stock deduction, negative inventory guards, and order receipts.',
  },
  {
    icon: '👥',
    title: 'Customer Intelligence',
    desc: 'Directory of enterprise accounts, lifetime spend tracking, order frequencies, and full purchase histories.',
  },
  {
    icon: '📈',
    title: 'Deep-Dive Analytics',
    desc: 'Time-series revenue velocity charts, category distributions, payment method breakdowns, and date range filters.',
  },
  {
    icon: '📑',
    title: 'Data & Report Exports',
    desc: 'Instant one-click exports of sales invoices, inventory levels, and customer lifetime value directly to CSV.',
  },
];

const stats = [
  { label: 'Active Modules', value: '7+' },
  { label: 'Real-Time Sync', value: '⚡ Socket.IO' },
  { label: 'Database Engine', value: '🍃 MongoDB' },
  { label: 'Security & Auth', value: '🔒 JWT & Roles' },
];

const CURRENT_YEAR = new Date().getFullYear();

const Landing = () => {
  return (
    <div className="min-h-screen bg-dark-900 text-white">
      {/* Top Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/80 backdrop-blur-md border-b border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-navy-500 to-indigo-600 flex items-center justify-center font-bold text-sm shadow-md shadow-navy-600/30">
              BA
            </div>
            <span className="font-display font-bold text-white text-lg">BizAnalytics</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-secondary btn-sm">
              Sign In
            </Link>
            <Link to="/register" className="btn-primary btn-sm">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-navy-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-navy-500/10 border border-navy-500/20 rounded-full px-4 py-1.5 text-navy-400 text-xs font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Business Performance & Sales Analytics Platform
          </div>

          <h1 className="text-4xl sm:text-6xl font-display font-extrabold mb-6 leading-tight tracking-tight">
            Data-Driven Intelligence for <br />
            <span className="bg-gradient-to-r from-navy-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
              Revenue & Sales Growth
            </span>
          </h1>

          <p className="text-base sm:text-lg text-dark-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Monitor real-time business health, track product inventory, record sales with automatic stock deduction, analyze customer lifetime spend, and export audit reports.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login" className="btn-primary btn-lg inline-flex items-center justify-center gap-2">
              Launch Live Platform →
            </Link>
            <Link to="/register" className="btn-secondary btn-lg inline-flex items-center justify-center">
              Create New Account
            </Link>
          </div>

          {/* Seed demo quick links */}
          <div className="mt-8 p-3 rounded-2xl bg-dark-800/80 border border-dark-700/80 max-w-md mx-auto text-xs text-dark-300 flex items-center justify-around">
            <div>
              <span className="text-dark-500 block text-[10px] uppercase font-bold">Admin Demo</span>
              <span className="text-white font-mono">admin@example.com</span>
            </div>
            <div className="w-px h-6 bg-dark-700"></div>
            <div>
              <span className="text-dark-500 block text-[10px] uppercase font-bold">Password</span>
              <span className="text-emerald-400 font-mono">admin123</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Counter */}
      <section className="py-10 border-y border-dark-800 bg-dark-850/50">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((s, i) => (
            <div key={i}>
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-display mb-1">{s.value}</div>
              <div className="text-xs text-dark-400 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">Full-Stack Business Architecture</h2>
          <p className="text-dark-400 text-sm mt-2">Engineered with React, Node.js, Express, MongoDB, and Socket.IO</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="card p-6 hover:border-dark-600 transition-all">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
              <p className="text-xs text-dark-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-800 py-8 px-4 text-center text-xs text-dark-500">
        © {CURRENT_YEAR} Business Performance & Sales Analytics Platform. All rights reserved.
      </footer>
    </div>
  );
};

export default Landing;
