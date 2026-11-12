import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Full name check
    if (!form.name || !form.name.trim()) {
      return setError('Please enter your full name.');
    }

    // Email format check
    if (!form.email || !form.email.trim()) {
      return setError('Please enter a valid email address.');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      return setError('Please enter a valid email address.');
    }

    // Password exactly 8 characters
    if (form.password.length !== 8) {
      return setError('Password must be exactly 8 characters.');
    }

    // Confirm password exactly 8 characters
    if (form.confirmPassword.length !== 8) {
      return setError('Password must be exactly 8 characters.');
    }

    // Passwords match
    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match.');
    }

    setLoading(true);
    try {
      const data = await register(form.name.trim(), form.email.trim(), form.password);
      setSuccess('Account created successfully.');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (err) {
      // Extract specific error message from server response
      const serverMessage =
        err.response?.data?.errors?.[0]?.message ||
        err.response?.data?.message ||
        'Registration failed. Please try again.';
      setError(serverMessage);
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
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-navy-500 to-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-navy-600/30">
            <span className="text-white font-extrabold text-2xl font-display">BA</span>
          </div>
          <h2 className="text-3xl font-display font-bold text-white mb-4">Grow Your Business</h2>
          <p className="text-dark-300 max-w-sm mx-auto leading-relaxed">
            Join BizAnalytics and manage your business with confidence. Track real-time sales, inventory, and analytics in one place.
          </p>
        </div>
      </div>

      {/* Form container */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile brand header */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-navy-500 to-indigo-600 flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm">BA</span>
            </div>
            <span className="font-display font-bold text-white text-xl">BizAnalytics</span>
          </div>

          <div className="card">
            <h2 className="text-2xl font-display font-bold text-white mb-2">Create account</h2>
            <p className="text-dark-400 text-sm mb-6">
              Join BizAnalytics and manage your business with confidence.
            </p>

            {error && (
              <div className="mb-4 p-3.5 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-400 text-xs flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3.5 rounded-xl bg-success-500/10 border border-success-500/20 text-success-400 text-xs flex items-center gap-2">
                <span>✅</span>
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="label" htmlFor="name">Full Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g. John Doe"
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
                  placeholder="name@example.com"
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
                  maxLength={8}
                  className="input-field"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <p className="text-[11px] text-dark-400 mt-1">
                  Password must be exactly 8 characters.
                </p>
              </div>

              <div>
                <label className="label" htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  maxLength={8}
                  className="input-field"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <p className="text-[11px] text-dark-400 mt-1">
                  Password must be exactly 8 characters.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2 py-2.5"
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
