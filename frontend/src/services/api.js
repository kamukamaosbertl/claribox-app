import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ============ STUDENT API ============ */
export const studentAPI = {

  submitFeedback: (data) => {
    const isFormData = data instanceof FormData;
    return api.post('/feedback/submit', data, {
      headers: {
        'Content-Type': isFormData ? 'multipart/form-data' : 'application/json',
      },
    });
  },

  getStats: async () => {
    const res = await api.get('/feedback/stats/public');
    return res.data;
  },

};

/* ============ ADMIN API ============ */
export const adminAPI = {

  /* --- Auth --- */
  login:    (credentials) => api.post('/auth/login',    credentials),
  register: (data)        => api.post('/auth/register', data),
  logout: () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
  },

  /* --- Feedback Management --- */
  getAllFeedback: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.status)   params.append('status',   filters.status);
    if (filters.sort)     params.append('sort',      filters.sort);
    if (filters.limit)    params.append('limit',     filters.limit);
    if (filters.page)     params.append('page',      filters.page);
    return api.get(`/admin/feedback?${params.toString()}`);
  },

  updateFeedbackStatus: (id, data) => api.put(`/admin/feedback/${id}`, data),

  /* --- Analytics & Insights --- */
  getAnalytics:     (params = {}) => api.get('/admin/analytics',  { params }),
  getTrends:        (params = {}) => api.get('/admin/trends',     { params }),
  getTimeStats:     (params = {}) => api.get('/admin/stats/time', { params }),
  getCategoryStats: (params = {}) => api.get('/admin/analytics',  { params }),

  /* --- AI Chat & Summaries ---
       These live in aiRoutes.js registered under /api/ai in server.js
  ----------------------------------------- */
  // Send admin question → RAG pipeline → Ollama answer
  chatWithAI: (message, history) => api.post('/ai/chat', { message, history }),

  // Generate or retrieve summary for a specific feedback (on demand, admin only)
  getSummary: (id) => api.get(`/ai/summary/${id}`),

  /* --- Resolution Management --- */
  getResolutions:   ()     => api.get('/admin/resolutions'),
  createResolution: (data) => api.post('/admin/resolutions', data),
  deleteResolution: (id)   => api.delete(`/admin/resolutions/${id}`),

};

export default api;