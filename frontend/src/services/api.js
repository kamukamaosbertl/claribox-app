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
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const token = localStorage.getItem('adminToken');
      if (token) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = '/admin/login?session=expired';
      }
    }
    return Promise.reject(error);
  }
);

// ── Stream helper — used by ChatWithAI.jsx ────────────────────────────────────
// Calls /ai/chat/stream and streams response chunks in real time
// onChunk — called with each text piece as it arrives
// onError — called if something goes wrong
export async function chatWithAIStream(message, sessionId, onChunk, onError) {
  try {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`${API_BASE_URL}/ai/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: JSON.stringify({ message, sessionId })
    });

    if (!response.ok) {
      onError('Something went wrong. Please try again.');
      return;
    }

    const reader  = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer    = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep incomplete line in buffer

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') return;
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) { onError(parsed.error); return; }
          if (parsed.text)  { onChunk(parsed.text); }
        } catch {
          // skip malformed chunks
        }
      }
    }
  } catch (err) {
    onError('Connection error. Please try again.');
  }
}

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
  login:          (credentials) => api.post('/auth/login',           credentials),
  register:       (data)        => api.post('/auth/register',        data),
  googleLogin:    (accessToken) => api.post('/auth/google',          { accessToken }),
  changePassword: (data)        => api.post('/auth/change-password', data),
  logout: () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
  },

  /* --- Notification Preferences --- */
  getNotificationPrefs:  ()     => api.get('/admin/notification-prefs'),
  saveNotificationPrefs: (data) => api.put('/admin/notification-prefs', data),

  /* --- Profile --- */
  getProfile:    ()     => api.get('/admin/profile'),
  updateProfile: (data) => {
    const isFormData = data instanceof FormData;
    return api.put('/admin/profile', data, {
      headers: { 'Content-Type': isFormData ? 'multipart/form-data' : 'application/json' }
    });
  },

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
  // chatWithAI — simple non-streaming version (fallback)
  chatWithAI: (message, history) => api.post('/ai/chat', { message, history }),
  // chatWithAIStream — streaming version used by ChatWithAI.jsx
  // imported separately as named export above
  chatWithAIStream,
  getSummary: (id) => api.get(`/ai/summary/${id}`),

  /* --- Notifications --- */
  getNotifications:         ()   => api.get('/notifications'),
  markNotificationRead:     (id) => api.patch(`/notifications/${id}/read`),
  markAllNotificationsRead: ()   => api.patch('/notifications/read-all'),
  deleteNotification:       (id) => api.delete(`/notifications/${id}`),

  /* --- Resolution Management --- */
  getResolutions:   ()     => api.get('/admin/resolutions'),
  createResolution: (data) => api.post('/admin/resolutions', data),
  deleteResolution: (id)   => api.delete(`/admin/resolutions/${id}`),

};

export default api;