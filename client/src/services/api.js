import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach token from sessionStorage for strict tab isolation
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('bizanalytics_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 (only redirect when already authenticated and session expires, NOT during login/auth attempts)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
    if (error.response?.status === 401 && !isAuthRoute) {
      sessionStorage.removeItem('bizanalytics_token');
      sessionStorage.removeItem('bizanalytics_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
