import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [pwMsg, setPwMsg] = useState({ type: '', text: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const showMsg = (setter, type, text) => {
    setter({ type, text });
    setTimeout(() => setter({ type: '', text: '' }), 5000);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.name || !profileForm.email) return showMsg(setProfileMsg, 'error', 'Name and email are required');
    setProfileLoading(true);
    try {
      const { data } = await api.put('/auth/profile', profileForm);
      updateUser(data.user);
      if (data.token) localStorage.setItem('portfoliopro_token', data.token);
      showMsg(setProfileMsg, 'success', 'Profile updated successfully!');
    } catch (err) {
      showMsg(setProfileMsg, 'error', err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!pwForm.currentPassword || !pwForm.newPassword) return showMsg(setPwMsg, 'error', 'All fields are required');
    if (pwForm.newPassword.length < 6) return showMsg(setPwMsg, 'error', 'New password must be at least 6 characters');
    if (pwForm.newPassword !== pwForm.confirmPassword) return showMsg(setPwMsg, 'error', 'Passwords do not match');
    setPwLoading(true);
    try {
      await api.put('/auth/password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showMsg(setPwMsg, 'success', 'Password changed successfully!');
    } catch (err) {
      showMsg(setPwMsg, 'error', err.response?.data?.message || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">Profile Settings</h1>
        <p className="page-subtitle">Manage your account information</p>
      </div>

      {/* Profile card */}
      <div className="card mb-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-dark-700">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-navy-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-2xl">{user?.name?.[0]?.toUpperCase()}</span>
          </div>
          <div>
            <h2 className="text-white font-bold text-xl">{user?.name}</h2>
            <p className="text-dark-400">{user?.email}</p>
            <span className={`badge mt-1 ${user?.role === 'admin' ? 'badge-navy' : 'badge-success'}`}>
              {user?.role === 'admin' ? '🛡️ Admin' : '👤 User'}
            </span>
          </div>
        </div>

        <h3 className="text-white font-semibold mb-4">Personal Information</h3>
        {profileMsg.text && (
          <div className={profileMsg.type === 'success' ? 'alert-success mb-4' : 'alert-error mb-4'}>
            {profileMsg.text}
          </div>
        )}
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input
              name="name"
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              className="input-field"
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="label">Email Address</label>
            <input
              name="email"
              type="email"
              value={profileForm.email}
              onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
              className="input-field"
              placeholder="your@email.com"
            />
          </div>
          <button type="submit" disabled={profileLoading} className="btn-primary">
            {profileLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="card mb-6">
        <h3 className="text-white font-semibold mb-4">Change Password</h3>
        {pwMsg.text && (
          <div className={pwMsg.type === 'success' ? 'alert-success mb-4' : 'alert-error mb-4'}>
            {pwMsg.text}
          </div>
        )}
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input
              type="password"
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
              className="input-field"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="label">New Password</label>
            <input
              type="password"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              className="input-field"
              placeholder="Min. 6 characters"
            />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input
              type="password"
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
              className="input-field"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" disabled={pwLoading} className="btn-primary">
            {pwLoading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Danger zone */}
      <div className="card border-danger-500/20 bg-danger-500/5">
        <h3 className="text-danger-400 font-semibold mb-2">Danger Zone</h3>
        <p className="text-dark-400 text-sm mb-4">Sign out from your PortfolioPro account.</p>
        <button onClick={logout} className="btn-danger btn-sm">
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Profile;
