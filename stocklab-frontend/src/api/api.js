import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Tự động gắn JWT token vào mỗi request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor: Xử lý lỗi 401 (hết hạn token) → auto logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ===== Auth APIs =====
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

// ===== User APIs =====
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/change-password', data),
};

// ===== Stock APIs =====
export const stockAPI = {
  getAll: (page = 0, size = 20, sort = 'ticker', exchange = '') => {
    const params = { page, size, sort };
    if (exchange) params.exchange = exchange;
    return api.get('/stocks', { params });
  },
  getByTicker: (ticker) => api.get(`/stocks/${ticker}`),
  search: (keyword) => api.get('/stocks/search', { params: { keyword } }),
  getPriceHistory: (ticker, range = '1M') =>
    api.get(`/stocks/${ticker}/history`, { params: { range } }),
};

// ===== Trade APIs =====
export const tradeAPI = {
  buy: (data) => api.post('/trade/buy', data),
  sell: (data) => api.post('/trade/sell', data),
  getTransactions: (page = 0, size = 20, type = '') => {
    const params = { page, size };
    if (type) params.type = type;
    return api.get('/trade/transactions', { params });
  },
  getPortfolio: () => api.get('/trade/portfolio'),
  getPortfolioSummary: () => api.get('/trade/portfolio/summary'),
};

// ===== Watchlist APIs =====
export const watchlistAPI = {
  getAll: () => api.get('/watchlist'),
  add: (ticker) => api.post(`/watchlist/${ticker}`),
  remove: (ticker) => api.delete(`/watchlist/${ticker}`),
  isWatched: (ticker) => api.get(`/watchlist/check/${ticker}`),
};

// ===== Admin APIs =====
export const adminAPI = {
  getAllUsers: () => api.get('/admin/users'),
  toggleUserLock: (userId) => api.put(`/admin/users/${userId}/toggle-lock`),
};

export default api;
