import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — attach token to every request ──────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor — handle session expiry ──────────────────────────────
// If backend returns 401 (unauthorized / token expired):
// 1. Clear stored credentials
// 2. Redirect to login with a message
api.interceptors.response.use(
  (response) => response, // pass through successful responses
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect if we were actually logged in
      const token = localStorage.getItem('adminToken');
      if (token) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        // Redirect to login with session expired message
        window.location.href = '/admin/login?session=expired';
      }
    }
    return Promise.reject(error);
  }
);

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
  login:       (credentials) => api.post('/auth/login',    credentials),
  register:    (data)        => api.post('/auth/register', data),
  googleLogin:     (accessToken)  => api.post('/auth/google',           { accessToken }),
  changePassword:  (data)         => api.post('/auth/change-password',  data),
  logout: () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
  },

  /* --- Notification Preferences --- */
  getNotificationPrefs:  ()     => api.get('/admin/notification-prefs'),
  saveNotificationPrefs: (data) => api.put('/admin/notification-prefs', data),

  /* --- Profile --- */
  getProfile:    ()     => api.get('/admin/profile'),
  updateProfile: (data) => api.put('/admin/profile', data),

  /* --- Feedback Management --- */
  getAllFeedback: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.category)  params.append('category',  filters.category);
    if (filters.status)    params.append('status',    filters.status);
    if (filters.sentiment) params.append('sentiment', filters.sentiment);
    if (filters.sort)      params.append('sort',      filters.sort);
    if (filters.limit)     params.append('limit',     filters.limit);
    if (filters.page)      params.append('page',      filters.page);
    if (filters.filter)    params.append('filter',    filters.filter);
    return api.get(`/admin/feedback?${params.toString()}`);
  },

  updateFeedbackStatus: (id, data) => api.put(`/admin/feedback/${id}`, data),

  /* --- Analytics & Insights --- */
  getAnalytics:     (params = {}) => api.get('/admin/analytics',  { params }),
  getTrends:        (params = {}) => api.get('/admin/trends',     { params }),
  getTimeStats:     (params = {}) => api.get('/admin/stats/time', { params }),
  getCategoryStats: (params = {}) => api.get('/admin/analytics',  { params }),

  /* --- AI Chat & Summaries --- */
  chatWithAI: (message, history) => api.post('/ai/chat',        { message, history }),
  getSummary: (id)               => api.get(`/ai/summary/${id}`),

  /* --- Notification Preferences --- */
  getNotificationPrefs:    ()     => api.get('/admin/notification-prefs'),
  saveNotificationPrefs:   (data) => api.put('/admin/notification-prefs', data),

  /* --- Notifications --- */
  getNotifications:           ()   => api.get('/notifications'),
  markNotificationRead:       (id) => api.patch(`/notifications/${id}/read`),
  markAllNotificationsRead:   ()   => api.patch('/notifications/read-all'),
  deleteNotification:         (id) => api.delete(`/notifications/${id}`),

  /* --- Resolution Management --- */
  getResolutions:   ()     => api.get('/admin/resolutions'),
  createResolution: (data) => api.post('/admin/resolutions', data),
  deleteResolution: (id)   => api.delete(`/admin/resolutions/${id}`),

};

export default api;