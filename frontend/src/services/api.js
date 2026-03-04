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

// ============ STUDENT API ============
export const studentAPI = {
  submitFeedback: (data) => api.post('/feedback/submit', data),
  getStats: async () => {
  const res = await api.get('/feedback/stats/public');
  return res.data;
},
};

// ============ ADMIN API ============
export const adminAPI = {

    // Auth - Both Login and Register
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  logout: () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
  },

  // Feedback Management
  getAllFeedback: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.status) params.append('status', filters.status);
    if (filters.sort) params.append('sort', filters.sort);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.page) params.append('page', filters.page);
    return api.get(`/admin/feedback?${params.toString()}`);
  },

  updateFeedbackStatus: (id, data) => api.put(`/admin/feedback/${id}`, data),

  
  

  // Analytics & Insights
getAnalytics: (params = {}) => api.get('/admin/analytics', { params }),

getTrends: (params = {}) => api.get('/admin/trends', { params }),

getTimeStats: (params = {}) => api.get('/admin/stats/time', { params }),

getCategoryStats: (params = {}) => api.get('/admin/analytics', { params }),

  // AI Chat
chatWithAI: (message, history) => api.post('/ai/chat', { message, history }),


  // 🔹 Resolution Management
getResolutions: () => api.get('/admin/resolutions'), // Fetch all resolutions
createResolution: (data) => api.post('/admin/resolutions', data), // Create new resolution
deleteResolution: (id) => api.delete(`/admin/resolutions/${id}`),  // Delete resolution by ID


  
};

export default api;