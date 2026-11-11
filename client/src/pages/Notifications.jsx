import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import useSocket from '../hooks/useSocket';

const Notifications = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, clearAll, refresh } = useSocket();
  const [filter, setFilter] = useState('All');
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    refresh();
  }, [refresh]);

  const notify = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      refresh();
      notify('success', 'Notification deleted');
    } catch {
      notify('error', 'Failed to delete notification');
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'All') return true;
    if (filter === 'Unread') return !n.read;
    return n.type === filter.toLowerCase();
  });

  const getTypeIcon = (type) => {
    if (type === 'sale') return '💰';
    if (type === 'product') return '📦';
    if (type === 'low_stock') return '⚠️';
    if (type === 'customer') return '👤';
    return '🔔';
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Notifications Center</h1>
          <p className="text-xs text-dark-400 mt-1">Live alerts on sales transactions, catalog changes, and stock depletion</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={clearAll} className="btn-secondary text-xs self-start sm:self-auto">
            Mark All as Read
          </button>
        )}
      </div>

      {feedback.message && (
        <div className={`p-4 rounded-xl text-sm font-medium ${
          feedback.type === 'success'
            ? 'bg-success-500/10 border border-success-500/20 text-success-400'
            : 'bg-danger-500/10 border border-danger-500/20 text-danger-400'
        }`}>
          {feedback.message}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-dark-800 border border-dark-700">
        {['All', 'Unread', 'Sale', 'Low_Stock', 'Product', 'Customer', 'System'].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl capitalize transition-all ${
              filter === t
                ? 'bg-navy-600 text-white shadow-md shadow-navy-600/30'
                : 'text-dark-400 hover:text-white hover:bg-dark-700/60'
            }`}
          >
            {t.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="card divide-y divide-dark-700/50 p-0 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-dark-400 text-sm">
            No notifications matching selected filter
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n._id || n.id}
              className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors hover:bg-dark-750/50 ${
                !n.read ? 'bg-navy-600/5' : ''
              }`}
            >
              <div
                onClick={() => {
                  if (!n.read) markAsRead(n._id || n.id);
                  if (n.link) navigate(n.link);
                }}
                className="flex items-start gap-3.5 cursor-pointer flex-1 min-w-0"
              >
                <div className="w-10 h-10 rounded-xl bg-dark-700 flex items-center justify-center text-xl flex-shrink-0">
                  {getTypeIcon(n.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white truncate">{n.title}</h3>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-navy-400 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-dark-300 mt-1 leading-relaxed">{n.message}</p>
                  <span className="text-[11px] text-dark-500 mt-1.5 block">
                    {new Date(n.createdAt || Date.now()).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {!n.read && (
                  <button
                    onClick={() => markAsRead(n._id || n.id)}
                    className="p-1.5 text-xs text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg"
                    title="Mark read"
                  >
                    ✓
                  </button>
                )}
                <button
                  onClick={() => handleDelete(n._id || n.id)}
                  className="p-1.5 text-xs text-danger-400 hover:text-danger-300 hover:bg-danger-500/10 rounded-lg"
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;

