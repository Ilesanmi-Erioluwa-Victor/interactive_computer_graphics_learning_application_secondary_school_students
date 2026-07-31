import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://interactive-computer-graphics-learning.onrender.com/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('icgla_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRedirecting = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401 && !isRedirecting) {
      isRedirecting = true;
      localStorage.removeItem('icgla_token');
      localStorage.removeItem('icgla_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      setTimeout(() => {
        isRedirecting = false;
      }, 2000);
    }
    return Promise.reject(error);
  }
);

export default api;
