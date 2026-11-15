import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim() || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email.trim(), password);
      const userRole = res?.user?.role;
      setSuccess(`Authenticated successfully as ${userRole === 'admin' ? 'Administrator' : 'Staff'}. Redirecting...`);

      setTimeout(() => {
        if (userRole === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }, 400);
    } catch (err) {
      if (!err.response) {
        // Network error — backend is unreachable
        setError('Cannot connect to the server. Please ensure the backend is running and try again.');
      } else if (err.response.status === 401) {
        setError(err.response.data?.message || 'Invalid email or password.');
      } else if (err.response.status === 422) {
        // Validation error
        const msgs = err.response.data?.errors;
        setError(Array.isArray(msgs) ? msgs.map(e => e.msg).join(' ') : (err.response.data?.message || 'Validation error. Please check your input.'));
      } else if (err.response.status === 403) {
        setError(err.response.data?.message || 'Access denied. Your account may be deactivated.');
      } else {
        setError(err.response.data?.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper for quick demonstration during college presentation
  const fillCredentials = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0c0908] via-[#16100d] to-[#080605] text-stone-100 flex flex-col justify-between items-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Ambient background glow matching warm brown/black gradient */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] h-[540px] bg-[#c25e2e]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-12 right-1/4 w-[420px] h-[420px] bg-[#3b82f6]/5 rounded-full blur-[130px] pointer-events-none" />

      {/* Top Branding Header */}
      <header className="w-full max-w-5xl flex items-center justify-between py-2 px-1 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center font-extrabold text-white text-base shadow-lg shadow-blue-600/30">
            BA
          </div>
          <div>
            <span className="font-display font-bold text-white text-lg tracking-tight block leading-tight">
              BizAnalytics
            </span>
            <span className="text-[11px] text-stone-400 font-medium tracking-wide uppercase">
              Business Platform
            </span>
          </div>
        </div>

        <Link
          to="/register"
          className="text-xs sm:text-sm text-stone-300 hover:text-white px-3.5 py-1.5 rounded-xl border border-stone-800 hover:border-stone-700 bg-stone-900/60 transition-colors"
        >
          Create Account
        </Link>
      </header>

      {/* Centered Login Card */}
      <main className="w-full max-w-[430px] my-auto relative z-10">
        <div className="bg-[#1c1411]/90 backdrop-blur-2xl border border-[#3d2c24]/70 rounded-3xl p-7 sm:p-9 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)]">
          {/* Heading */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
              Sign In
            </h1>
            <p className="text-stone-400 text-xs sm:text-sm mt-1.5 leading-relaxed">
              Enter your details to access your dashboard.
            </p>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-medium flex items-start gap-2.5 animate-fade-in">
              <span className="text-sm leading-none mt-0.5">⚠️</span>
              <span className="flex-1">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium flex items-start gap-2.5 animate-fade-in">
              <span className="text-sm leading-none mt-0.5">✓</span>
              <span className="flex-1">{success}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5" htmlFor="email-input">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
                  {/* Email SVG Icon */}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206"
                    />
                  </svg>
                </span>
                <input
                  id="email-input"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  required
                  autoComplete="email"
                  placeholder="name@example.com"
                  className="w-full bg-[#110d0b]/80 border border-[#3b2b23] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 text-white placeholder-stone-500 text-sm rounded-xl pl-10 pr-4 py-3 outline-none transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5" htmlFor="password-input">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
                  {/* Lock SVG Icon */}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </span>
                <input
                  id="password-input"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full bg-[#110d0b]/80 border border-[#3b2b23] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 text-white placeholder-stone-500 text-sm rounded-xl pl-10 pr-11 py-3 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200 transition-colors p-1"
                  aria-label={showPassword ? 'Hide value' : 'Show value'}
                  title={showPassword ? 'Hide value' : 'Show value'}
                >
                  {showPassword ? (
                    /* Eye-slash Icon */
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                      />
                    </svg>
                  ) : (
                    /* Eye Icon */
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Blue Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40 transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <span className="text-base leading-none">→</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill for College Submission Presentation */}
          <div className="mt-6 pt-5 border-t border-[#36261f]/60 text-center">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-stone-500 mb-2">
              Presentation Demo Credentials
            </p>
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={() => fillCredentials('admin@example.com', 'admin123')}
                className="px-2.5 py-1 text-[11px] rounded-lg bg-[#271b16] hover:bg-[#34241d] text-stone-300 border border-[#3e2b22] transition-colors"
                title="Fill Admin demo credentials"
              >
                🛡️ Admin Account
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('staff@example.com', 'staff123')}
                className="px-2.5 py-1 text-[11px] rounded-lg bg-[#271b16] hover:bg-[#34241d] text-stone-300 border border-[#3e2b22] transition-colors"
                title="Fill Staff demo credentials"
              >
                👤 Staff Account
              </button>
            </div>
          </div>

          {/* Footer inside card */}
          <div className="mt-5 text-center">
            <p className="text-xs text-stone-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Page Footer */}
      <footer className="w-full max-w-5xl text-center py-3 text-xs text-stone-500 relative z-10">
        © {new Date().getFullYear()} BizAnalyticsBusiness Platform • All rights reserved
      </footer>
    </div>
  );
};

export default Landing;
