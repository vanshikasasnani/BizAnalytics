import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Strictly isolate sessions by using sessionStorage
    const stored = sessionStorage.getItem('bizanalytics_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  // Verify token on mount from sessionStorage
  useEffect(() => {
    const verifyToken = async () => {
      const token = sessionStorage.getItem('bizanalytics_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/auth/me');
        setUser(data.user);
        sessionStorage.setItem('bizanalytics_user', JSON.stringify(data.user));
      } catch {
        sessionStorage.removeItem('bizanalytics_token');
        sessionStorage.removeItem('bizanalytics_user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    sessionStorage.setItem('bizanalytics_token', data.token);
    sessionStorage.setItem('bizanalytics_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  }, []);

  // Separate admin login
  const adminLogin = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/admin/login', { email, password });
    sessionStorage.setItem('bizanalytics_token', data.token);
    sessionStorage.setItem('bizanalytics_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  }, []);

  // Separate user (staff) login
  const userLogin = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/user/login', { email, password });
    sessionStorage.setItem('bizanalytics_token', data.token);
    sessionStorage.setItem('bizanalytics_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    sessionStorage.setItem('bizanalytics_token', data.token);
    sessionStorage.setItem('bizanalytics_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('bizanalytics_token');
    sessionStorage.removeItem('bizanalytics_user');
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    sessionStorage.setItem('bizanalytics_user', JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, adminLogin, userLogin, register, logout, updateUser }}>
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
