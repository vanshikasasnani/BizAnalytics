import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

let socket = null;

export const getSocket = () => socket;

const useSocket = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [isConnected, setIsConnected] = useState(() => (socket ? socket.connected : false));

  const fetchStoredNotifications = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // ignore if unauthenticated or network error
    }
  }, []);

  const fetchUnreadMessagesCount = useCallback(async () => {
    try {
      const { data } = await api.get('/messages/unread/count');
      setUnreadMessagesCount(data.unreadCount || 0);
    } catch {
      // ignore
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
      setUnreadMessagesCount(0);
      setIsConnected(false);
      return;
    }

    fetchStoredNotifications();
    fetchUnreadMessagesCount();

    if (!socket) {
      const socketServerUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '/');
      const token = sessionStorage.getItem('bizanalytics_token');

      socket = io(socketServerUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        withCredentials: true,
      });
    }

    if (socket.connected) {
      setIsConnected(true);
      socket.emit('join', user._id);
    }

    const onConnect = () => {
      setIsConnected(true);
      socket.emit('join', user._id);
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onNotification = (data) => {
      addNotification(data);
    };

    const onNewMessage = (msg) => {
      // If we are not currently reading this conversation, increment badge
      fetchUnreadMessagesCount();
    };

    const onMessagesRead = () => {
      fetchUnreadMessagesCount();
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('notification', onNotification);
    socket.on('new_message', onNewMessage);
    socket.on('messages_read', onMessagesRead);

    return () => {
      if (socket) {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
        socket.off('notification', onNotification);
        socket.off('new_message', onNewMessage);
        socket.off('messages_read', onMessagesRead);
      }
    };
  }, [user, addNotification, fetchStoredNotifications, fetchUnreadMessagesCount]);

  const markAsRead = useCallback(async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => ((n._id === id || n.id === id) ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
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

  return {
    socket,
    isConnected,
    notifications,
    unreadCount,
    unreadMessagesCount,
    markAsRead,
    clearAll,
    refresh: fetchStoredNotifications,
    refreshUnreadMessages: fetchUnreadMessagesCount,
  };
};

export default useSocket;
