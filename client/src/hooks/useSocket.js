import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

let socket = null;

const useSocket = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  const fetchStoredNotifications = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // ignore if unauthenticated or network error
    }
  }, []);

  const addNotification = useCallback((notif) => {
    const id = notif._id || Date.now();
    setNotifications((prev) => [{ ...notif, _id: id, read: false }, ...prev].slice(0, 30));
    setUnreadCount((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchStoredNotifications();

    if (!socket) {
      const socketServerUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '/');
      socket = io(socketServerUrl, {
        transports: ['websocket', 'polling'],
        withCredentials: true,
      });
    }

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join', user._id);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('notification', (data) => {
      addNotification(data);
    });

    return () => {
      if (socket) {
        socket.off('notification');
        socket.off('connect');
        socket.off('disconnect');
      }
    };
  }, [user, addNotification, fetchStoredNotifications]);

  const markAsRead = useCallback(async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => ((n._id === id || n.id === id) ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // optimistic update
      setNotifications((prev) =>
        prev.map((n) => ((n._id === id || n.id === id) ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  }, []);

  const clearAll = useCallback(async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  }, []);

  return { isConnected, notifications, unreadCount, markAsRead, clearAll, refresh: fetchStoredNotifications };
};

export default useSocket;
