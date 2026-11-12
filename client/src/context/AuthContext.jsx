import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored =
      sessionStorage.getItem('portfoliopro_user') ||
      localStorage.getItem('portfoliopro_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      const token =
        sessionStorage.getItem('portfoliopro_token') ||
        localStorage.getItem('portfoliopro_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/auth/me');
        setUser(data.user);
        sessionStorage.setItem('portfoliopro_user', JSON.stringify(data.user));
      } catch {
        sessionStorage.removeItem('portfoliopro_token');
        sessionStorage.removeItem('portfoliopro_user');
        localStorage.removeItem('portfoliopro_token');
        localStorage.removeItem('portfoliopro_user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    // Use sessionStorage so tabs can be independently logged in (e.g. Admin in Tab 1, User in Tab 2)
    sessionStorage.setItem('portfoliopro_token', data.token);
    sessionStorage.setItem('portfoliopro_user', JSON.stringify(data.user));
    // Also update localStorage as a backup
    localStorage.setItem('portfoliopro_token', data.token);
    localStorage.setItem('portfoliopro_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    sessionStorage.setItem('portfoliopro_token', data.token);
    sessionStorage.setItem('portfoliopro_user', JSON.stringify(data.user));
    localStorage.setItem('portfoliopro_token', data.token);
    localStorage.setItem('portfoliopro_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('portfoliopro_token');
    sessionStorage.removeItem('portfoliopro_user');
    localStorage.removeItem('portfoliopro_token');
    localStorage.removeItem('portfoliopro_user');
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    sessionStorage.setItem('portfoliopro_user', JSON.stringify(updatedUser));
    localStorage.setItem('portfoliopro_user', JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export default AuthContext;
