import { Link } from 'react-router-dom';

const features = [
  {
    icon: '📊',
    title: 'Real-Time Dashboard',
    desc: 'Get a live overview of your entire portfolio with interactive charts and performance metrics.',
  },
  {
    icon: '💼',
    title: 'Portfolio Management',
    desc: 'Track stocks, mutual funds, ETFs, bonds and other assets all in one place.',
  },
  {
    icon: '↔️',
    title: 'Transaction History',
    desc: 'Log every buy, sell, deposit and withdrawal with detailed records and filters.',
  },
  {
    icon: '👁️',
    title: 'Watchlist',
    desc: 'Monitor assets you are interested in before making investment decisions.',
  },
  {
    icon: '🔔',
    title: 'Real-Time Notifications',
    desc: 'Instant Socket.IO-powered alerts when portfolio events occur.',
  },
  {
    icon: '🛡️',
    title: 'Secure & Private',
    desc: 'JWT authentication, bcrypt hashing, and role-based access control.',
  },
];

const stats = [
  { label: 'Asset Types', value: '5+' },
  { label: 'Transaction Types', value: '4' },
  { label: 'Real-time Updates', value: '⚡' },
  { label: 'Secure APIs', value: '🔒' },
];

const CURRENT_YEAR = new Date().getFullYear();

const Landing = () => {
  return (
    <div className="min-h-screen bg-dark-900 text-white">
      {/* Top Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/80 backdrop-blur-md border-b border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-navy-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-display font-bold text-white text-xl">PortfolioPro</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-secondary btn-sm">
              Log In
            </Link>
            <Link to="/register" className="btn-primary btn-sm">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-navy-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-navy-500/10 border border-navy-500/20 rounded-full px-4 py-2 text-navy-400 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-success-400 animate-pulse-slow"></span>
            Professional Portfolio Management
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-extrabold mb-6 leading-tight">
            Manage Your <br />
            <span className="bg-gradient-to-r from-navy-400 via-purple-400 to-navy-300 bg-clip-text text-transparent">
              Investments
            </span>
            <br /> Like a Pro
          </h1>

          <p className="text-xl text-dark-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            PortfolioPro gives you a comprehensive view of your investment portfolio with real-time
            dashboards, transaction tracking, watchlists and smart analytics — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-primary btn-lg inline-flex items-center gap-2">
              Start for Free
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link to="/login" className="btn-secondary btn-lg">
              Sign In
            </Link>
          </div>

          {/* Stats strip */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="glass-card p-4">
                <div className="text-3xl font-bold text-white mb-1">{s.value}</div>
                <div className="text-dark-400 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-display font-bold text-white mb-4">
              Everything You Need
            </h2>
            <p className="text-dark-400 text-lg max-w-2xl mx-auto">
              A complete toolkit for tracking and managing your investment portfolio.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="card-hover group">
                <div className="w-12 h-12 rounded-xl bg-navy-500/10 flex items-center justify-center text-2xl mb-4 group-hover:bg-navy-500/20 transition-colors">
                  {f.icon}
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-dark-400 leading-relaxed text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="card relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-navy-600/20 to-purple-600/10 pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-3xl font-display font-bold text-white mb-4">
                Ready to take control of your portfolio?
              </h2>
              <p className="text-dark-400 mb-8">
                Join PortfolioPro and start tracking your investments smarter today.
              </p>
              <Link to="/register" className="btn-primary btn-lg inline-flex items-center gap-2">
                Create Free Account
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-700 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-navy-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">P</span>
            </div>
            <span className="font-display font-bold text-white">PortfolioPro</span>
          </div>
          <p className="text-dark-500 text-sm">
            © {CURRENT_YEAR} PortfolioPro. Built for academic demonstration purposes.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
