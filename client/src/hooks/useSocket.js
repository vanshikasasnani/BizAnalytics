import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

let socket = null;

const useSocket = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notif) => {
    const id = Date.now();
    setNotifications((prev) => [{ ...notif, id }, ...prev].slice(0, 20));
    // Auto-remove after 6 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 6000);
  }, []);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
      return;
    }

    if (!socket) {
      const socketServerUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '/');
      socket = io(socketServerUrl, {
        transports: ['websocket', 'polling'],
        withCredentials: true,
      });
    }

    socket.on('connect', () => {
      socket.emit('join', user._id);
    });

    socket.on('notification', (data) => {
      addNotification(data);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return () => {
      socket.off('notification');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [user, addNotification]);

  const dismissNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  return { notifications, dismissNotification, clearAll };
};

export default useSocket;
