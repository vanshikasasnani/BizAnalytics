import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-dark-900 via-navy-950 to-dark-900 items-center justify-center p-12">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-navy-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-600/15 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-navy-500 to-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-navy-600/30">
            <span className="text-white font-extrabold text-2xl font-display">BA</span>
          </div>
          <h1 className="text-4xl font-display font-bold text-white mb-4">BizAnalytics</h1>
          <p className="text-dark-300 text-lg max-w-xs mx-auto">
            Business performance and sales analytics platform.
          </p>
          <div className="mt-10 space-y-4">
            {['Real-time sales tracking', 'Inventory & stock control', 'Instant reports & analytics'].map((f) => (
              <div key={f} className="flex items-center gap-3 text-dark-300">
                <span className="text-success-400">✓</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-navy-500 to-indigo-600 flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm">BA</span>
            </div>
            <span className="font-display font-bold text-white text-xl">BizAnalytics</span>
          </div>

          <div className="card">
            <h2 className="text-2xl font-display font-bold text-white mb-2">Welcome back</h2>
            <p className="text-dark-400 text-sm mb-6">Enter your credentials to access your business dashboard</p>

            {error && <div className="alert-error mb-4">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label" htmlFor="email">Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="label" htmlFor="password">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-dark-400 text-sm mt-5">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-navy-400 hover:text-navy-300 font-medium transition-colors">
                Create one
              </Link>
            </p>
          </div>

          {/* Demo credentials hint */}
          <div className="mt-4 p-4 bg-dark-800/50 border border-dark-700 rounded-xl text-xs text-dark-400">
            <p className="font-semibold text-white mb-2">🔑 Demo Credentials</p>
            <div className="space-y-1">
              <p>
                <strong className="text-dark-200">Admin:</strong> <span className="text-navy-300 font-mono">admin@example.com</span> / <span className="font-mono">admin123</span>
              </p>
              <p>
                <strong className="text-dark-200">Staff / User:</strong> <span className="text-emerald-300 font-mono">staff@example.com</span> / <span className="font-mono">staff123</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
