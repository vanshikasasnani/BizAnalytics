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

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('bizanalytics_token');
      sessionStorage.removeItem('bizanalytics_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
