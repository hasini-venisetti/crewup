import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Attach token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('crewup_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('crewup_token');
      localStorage.removeItem('crewup_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

/* ── Auth ── */
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  me:       ()     => api.get('/auth/me'),
};

/* ── Profile ── */
export const profileAPI = {
  getById:  (id)   => api.get(`/profile/${id}`),
  getMe:    ()     => api.get('/profile/me'),
  update:   (data) => api.put('/profile/update', data),
};

/* ── Projects ── */
export const projectAPI = {
  getAll:         (params)   => api.get('/projects', { params }),
  getById:        (id)       => api.get(`/projects/${id}`),
  getMine:        ()         => api.get('/projects/my'),
  getRecommended: ()         => api.get('/projects/recommended'),
  create:         (data)     => api.post('/projects', data),
  update:         (id, data) => api.put(`/projects/${id}`, data),
  delete:         (id)       => api.delete(`/projects/${id}`),
};

/* ── Applications ── */
export const applicationAPI = {
  apply:          (data)   => api.post('/apply', data),
  getForProject:  (id)     => api.get(`/applications/${id}`),
  getMine:        ()       => api.get('/applications/my'),
  updateStatus:   (data)   => api.put('/application/status', data),
};

/* ── Conversations ── */
export const conversationAPI = {
  getAll:          ()      => api.get('/conversations'),
  start:           (data)  => api.post('/conversations', data),
  getMessages:     (convId) => api.get(`/messages/${convId}`),
  sendMessage:     (data)  => api.post('/messages', data),
  getProjectChat:  (projectId) => api.get(`/project-chat/${projectId}`),
  getProjectMsgs:  (projectId) => api.get(`/project-chat/${projectId}/messages`),
};

// ── Notification API ──────────────────────────────────────────────────────
export const notificationAPI = {
  getAll:         ()   => api.get('/notifications'),
  getUnreadCount: ()   => api.get('/notifications/unread-count'),
  markRead:       (id) => api.patch(`/notifications/${id}/read`),
  markAllRead:    ()   => api.patch('/notifications/read-all'),
  delete:         (id) => api.delete(`/notifications/${id}`),
};

// ── Search API ────────────────────────────────────────────────────────────
export const searchAPI = {
  search: (params) => api.get('/search', { params }), // { q, type, role, location, page }
};

// ── Explore API ───────────────────────────────────────────────────────────
export const exploreAPI = {
  getCreators: (params) => api.get('/explore', { params }), // { role, skill, location, availability, page }
};

// ── Leaderboard API ───────────────────────────────────────────────────────
export const leaderboardAPI = {
  get: (params) => api.get('/leaderboard', { params }), // { period, role }
};

// ── Tags API (project type filtering) ────────────────────────────────────
export const tagsAPI = {
  getByType: (tag, params) => api.get('/projects', { params: { projectType: tag, ...params } }),
};

// ── Fill Role API ─────────────────────────────────────────────────────────
export const fillRoleAPI = {
  fill: (projectId, role, note) => api.patch(`/projects/${projectId}/roles/fill`, { role, note }),
};

/* ── Portfolio API ── */
export const portfolioAPI = {
  add:    (data) => api.post('/profile/portfolio', data),
  delete: (id)   => api.delete(`/profile/portfolio/${id}`),
};

/* ── Timeline API ── */
export const timelineAPI = {
  update: (projectId, stage) => api.patch(`/projects/${projectId}/timeline`, { stage }),
};

/* ── Map API ── */
export const mapAPI = {
  getCreators: () => api.get('/map'),
};

/* ── Task API ── */
export const taskAPI = {
  getAll:  (projectId)           => api.get(`/projects/${projectId}/tasks`),
  create:  (projectId, data)     => api.post(`/projects/${projectId}/tasks`, data),
  update:  (projectId, taskId, data) => api.patch(`/projects/${projectId}/tasks/${taskId}`, data),
  delete:  (projectId, taskId)   => api.delete(`/projects/${projectId}/tasks/${taskId}`),
};

/* ── Team File API ── */
export const teamFileAPI = {
  getAll:  (projectId)         => api.get(`/projects/${projectId}/files`),
  add:     (projectId, data)   => api.post(`/projects/${projectId}/files`, data),
  delete:  (projectId, fileId) => api.delete(`/projects/${projectId}/files/${fileId}`),
};

/* ── Reviews API ── */
export const reviewAPI = {
  create:             (data)      => api.post('/reviews', data),
  getForUser:         (userId)    => api.get(`/reviews/${userId}`),
  getMyProjectReviews:(projectId) => api.get(`/reviews/project/${projectId}/mine`),
};

/* ── Schedule API ── */
export const scheduleAPI = {
  getAll:  (projectId)             => api.get(`/projects/${projectId}/schedule`),
  create:  (projectId, data)       => api.post(`/projects/${projectId}/schedule`, data),
  update:  (projectId, eid, data)  => api.patch(`/projects/${projectId}/schedule/${eid}`, data),
  delete:  (projectId, eid)        => api.delete(`/projects/${projectId}/schedule/${eid}`),
};

/* ── Follow API (simple one-click, no approval needed) ── */
export const followAPI = {
  follow:    (userId)       => api.post(`/follow/${userId}`),
  unfollow:  (userId)       => api.delete(`/follow/${userId}`),
  getStatus: (userId)       => api.get(`/follow/status/${userId}`),
  getCounts: (userId)       => api.get(`/follow/counts/${userId}`),
  getFeed:   (page = 1)     => api.get('/follow/feed', { params: { page } }),
};

/* ── Waitlist API ── */
export const waitlistAPI = {
  join:    (projectId, role) => api.post(`/projects/${projectId}/waitlist`, { role }),
  leave:   (projectId, role) => api.delete(`/projects/${projectId}/waitlist`, { data: { role } }),
  getAll:  (projectId)       => api.get(`/projects/${projectId}/waitlist`),
};

/* ── Mentor API ── */
export const mentorAPI = {
  getAll:       (params) => api.get('/mentors', { params }),
  updateSettings: (data) => api.patch('/mentors/settings', data),
};

export default api;
