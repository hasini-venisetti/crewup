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
    const user = localStorage.getItem('crewup_user');
    
    // Debug authentication state
    if (config.url?.includes('/follow/')) {
      console.log('Auth Debug:', {
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
        hasUser: !!user,
        userPreview: user ? JSON.parse(user)?.name : 'none'
      });
    }
    
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  // Debug follow requests
  if (config.url?.includes('/follow/')) {
    console.log('Follow API Request:', {
      method: config.method,
      url: config.url,
      headers: config.headers,
      data: config.data
    });
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => {
    // Debug follow responses
    if (res.config?.url?.includes('/follow/')) {
      console.log('Follow API Response:', {
        status: res.status,
        data: res.data,
        url: res.config.url
      });
    }
    return res;
  },
  (err) => {
    // Debug follow errors
    if (err.config?.url?.includes('/follow/')) {
      console.log('Follow API Error:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        url: err.config?.url
      });
    }
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
  register:   (data)    => api.post('/auth/register', data),
  login:      (data)    => api.post('/auth/login', data),
  me:         ()        => api.get('/auth/me'),
  googleAuth: (data)    => api.post('/auth/google', data),
};

/* ── Profile ── */
export const profileAPI = {
  getById:  (id)   => api.get(`/profile/${id}`),
  getMe:    ()     => api.get('/profile/me'),
  update:   (data) => api.put('/profile/update', data),
};

/* ── Projects ── */
export const projectAPI = {
  getAll:          (params)   => api.get('/projects', { params }),
  getById:         (id)       => api.get(`/projects/${id}`),
  getMine:         ()         => api.get('/projects/my'),
  getRecommended:  ()         => api.get('/projects/recommended'),
  create:          (data)     => api.post('/projects', data),
  update:          (id, data) => api.put(`/projects/${id}`, data),
  delete:          (id)       => api.delete(`/projects/${id}`),
  setYoutubeLink:  (id, link)     => api.patch(`/projects/${id}/youtube-link`, { youtubeLink: link }),
  setEpisodeLinks: (id, episodes) => api.patch(`/projects/${id}/youtube-link`, { episodeLinks: episodes }),
  getAllFilms:     (params)        => api.get('/projects/films', { params }),
  getUserFilms:   (userId)        => api.get(`/projects/films/${userId}`),
};

/* ── Applications ── */
export const applicationAPI = {
  apply:          (data)   => api.post('/apply', data),
  getForProject:  (id)     => api.get(`/applications/${id}`),
  getMine:        ()       => api.get('/applications/my'),
  updateStatus:   (data)   => api.put('/application/status', data),
};

/* ── Crew Match ── */
export const crewMatchAPI = {
  getSuggestions: (projectId) => api.get(`/projects/${projectId}/crew-suggestions`),
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
  getAll:         ()     => api.get('/notifications'),
  getUnreadCount: ()     => api.get('/notifications/unread-count'),
  markRead:       (id)   => api.patch(`/notifications/${id}/read`),
  markAllRead:    ()     => api.patch('/notifications/read-all'),
  delete:         (id)   => api.delete(`/notifications/${id}`),
  // Send a targeted notification to one user (project invite, etc.)
  sendDirect:     (data) => api.post('/notifications/send', data),
  // Admin: send global notification to all users
  sendGlobal:     (data) => api.post('/notifications/admin/global', data),
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
  fill:         (projectId, role, note) => api.patch(`/projects/${projectId}/roles/fill`, { role, note }),
  removeMember: (projectId, userId)     => api.delete(`/projects/${projectId}/members/${userId}`),
  leaveProject: (projectId)             => api.delete(`/projects/${projectId}/leave`),
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
  follow:       (userId)       => api.post(`/follow/${userId}`),
  unfollow:     (userId)       => api.delete(`/follow/${userId}`),
  getStatus:     (userId)       => api.get(`/follow/status/${userId}`),
  getCounts:    (userId)       => api.get(`/follow/counts/${userId}`),
  getFollowers:  (userId)       => api.get(`/follow/followers/${userId}`),
  getFollowing:  (userId)       => api.get(`/follow/following/${userId}`),
  getFeed:       (page = 1)     => api.get('/follow/feed', { params: { page } }),
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

/* ── Launch Waitlist ── */
export const launchWaitlistAPI = {
  join:           (data) => api.post('/launch-waitlist', data),
  getAll:         ()     => api.get('/launch-waitlist'),
  notify:         ()     => api.post('/launch-waitlist/notify'),
  forceNotify:    ()     => api.post('/launch-waitlist/force-notify'),
  resetNotified:  ()     => api.post('/launch-waitlist/reset-notified'),
  notifyOne:      (id)   => api.post(`/launch-waitlist/notify/${id}`),
};

/* ── Admin ── */
export const adminAPI = {
  getStats:           ()              => api.get('/admin/stats'),
  getAnalytics:       ()              => api.get('/admin/analytics'),
  getUsers:           (params)        => api.get('/admin/users', { params }),
  suspendUser:        (id, suspend)   => api.patch(`/admin/users/${id}/suspend`, { suspend }),
  announce:           (data)          => api.post('/admin/announce', data),
  getTrending:        ()              => api.get('/admin/trending-films'),
  getReports:         (params)        => api.get('/admin/reports', { params }),
  updateReportStatus: (id, status)    => api.patch(`/admin/reports/${id}`, { status }),
};

/* ── Contests ── */
export const contestAPI = {
  getAll:     ()         => api.get('/contests'),
  getById:    (id)       => api.get(`/contests/${id}`),
  create:     (data)     => api.post('/contests', data),
  update:     (id, data) => api.put(`/contests/${id}`, data),
  end:        (id)       => api.patch(`/contests/${id}/end`),
  setWinners: (id, data) => api.patch(`/contests/${id}/winners`, data),
  delete:     (id)       => api.delete(`/contests/${id}`),
};

/* ── Contest Submissions ── */
export const contestSubmissionAPI = {
  getSubmissions:    (contestId, params)            => api.get(`/contests/${contestId}/submissions`, { params }),
  getLeaderboard:    (contestId)                    => api.get(`/contests/${contestId}/leaderboard`),
  checkEligibility:  (contestId)                    => api.get(`/contests/${contestId}/eligibility`),
  submitFilm:        (contestId, data)              => api.post(`/contests/${contestId}/submissions`, data),
  deleteSubmission:  (contestId, subId)             => api.delete(`/contests/${contestId}/submissions/${subId}`),
  toggleLike:        (contestId, subId)             => api.post(`/contests/${contestId}/submissions/${subId}/like`),
  toggleVote:        (contestId, subId)             => api.post(`/contests/${contestId}/submissions/${subId}/vote`),
  getComments:       (contestId, subId)             => api.get(`/contests/${contestId}/submissions/${subId}/comments`),
  addComment:        (contestId, subId, text)       => api.post(`/contests/${contestId}/submissions/${subId}/comments`, { text }),
  deleteComment:     (contestId, subId, commentId)  => api.delete(`/contests/${contestId}/submissions/${subId}/comments/${commentId}`),
};

/* ── Film Interactions (likes, comments, bookmarks, analytics, report) ── */
export const filmAPI = {
  // Likes
  toggleLike:       (projectId)               => api.post(`/films/${projectId}/like`),
  getLikeStatus:    (projectId)               => api.get(`/films/${projectId}/like`),
  // Comments
  getComments:      (projectId)               => api.get(`/films/${projectId}/comments`),
  addComment:       (projectId, text)         => api.post(`/films/${projectId}/comments`, { text }),
  deleteComment:    (projectId, commentId)    => api.delete(`/films/${projectId}/comments/${commentId}`),
  // Bookmarks
  toggleBookmark:   (projectId)               => api.post(`/films/${projectId}/bookmark`),
  getBookmarkStatus:(projectId)               => api.get(`/films/${projectId}/bookmark`),
  getBookmarks:     ()                        => api.get('/films/bookmarks'),
  // Analytics (owner only)
  getAnalytics:     (projectId)               => api.get(`/films/${projectId}/analytics`),
  // Report
  report:           (projectId, reason, details) => api.post(`/films/${projectId}/report`, { reason, details }),
};

export default api;
