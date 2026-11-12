import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach token (checks sessionStorage first for tab-isolation, then localStorage)
api.interceptors.request.use(
  (config) => {
    const token =
      sessionStorage.getItem('portfoliopro_token') ||
      localStorage.getItem('portfoliopro_token');
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
      sessionStorage.removeItem('portfoliopro_token');
      sessionStorage.removeItem('portfoliopro_user');
      localStorage.removeItem('portfoliopro_token');
      localStorage.removeItem('portfoliopro_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
