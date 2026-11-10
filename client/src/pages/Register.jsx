import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      return setError('Please fill in all fields');
    }
    if (form.name.length < 2) return setError('Name must be at least 2 characters');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');

    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* Decorative left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-dark-900 via-navy-950 to-dark-900 items-center justify-center p-12">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-navy-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-600/15 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-center">
          <div className="text-6xl mb-6">🚀</div>
          <h2 className="text-3xl font-display font-bold text-white mb-4">Start your journey</h2>
          <p className="text-dark-300 max-w-xs mx-auto">
            Create your free PortfolioPro account and start managing your investments like a professional.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-navy-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-display font-bold text-white text-xl">PortfolioPro</span>
          </div>

          <div className="card">
            <h2 className="text-2xl font-display font-bold text-white mb-2">Create account</h2>
            <p className="text-dark-400 text-sm mb-6">Join PortfolioPro and take control of your investments</p>

            {error && <div className="alert-error mb-4">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label" htmlFor="name">Full Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="John Doe"
                  autoComplete="name"
                />
              </div>
              <div>
                <label className="label" htmlFor="reg-email">Email Address</label>
                <input
                  id="reg-email"
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
                <label className="label" htmlFor="reg-password">Password</label>
                <input
                  id="reg-password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="label" htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </>
                ) : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-dark-400 text-sm mt-5">
              Already have an account?{' '}
              <Link to="/login" className="text-navy-400 hover:text-navy-300 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
