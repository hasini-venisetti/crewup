import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('crewup_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally — redirect to login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('crewup_token');
        localStorage.removeItem('crewup_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/* ── Auth ── */
export const authAPI = {
  register:        (data)   => api.post('/auth/register', data),
  login:           (data)   => api.post('/auth/login', data),
  me:              ()       => api.get('/auth/me'),
  googleAuth:      (data)   => api.post('/auth/google', data),
  // Email OTP verification
  sendEmailOTP:    ()         => api.post('/auth/send-email-otp'),
  verifyEmail:     (code)     => api.post('/auth/verify-email', { code }),
  // Phone OTP verification
  sendPhoneOTP:    (phone)    => api.post('/auth/send-phone-otp', { phone }),
  verifyPhone:     (code)     => api.post('/auth/verify-phone', { code }),
  // Password reset
  forgotPassword:  (email)    => api.post('/auth/forgot-password', { email }),
  resetPassword:   (data)     => api.post('/auth/reset-password', data),
};

/* ── Profile ── */
export const profileAPI = {
  getById:       (id)        => api.get(`/profile/${id}`),
  getMe:         ()          => api.get('/profile/me'),
  update:        (data)      => api.put('/profile/update', data),
  uploadPicture: (imageData) => api.patch('/profile/picture', { imageData }),
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
  resubmit:        (id)           => api.patch(`/projects/${id}/resubmit`),
  publishDraft:      (id)         => api.patch(`/projects/${id}/publish`),
  postStatusUpdate:  (id, text)   => api.post(`/projects/${id}/status-update`, { text }),
  getBookmarks:      ()           => api.get('/projects/bookmarks'),
  getAllFilms:     (params)        => api.get('/projects/films', { params }),
  getUserFilms:   (userId)        => api.get(`/projects/films/${userId}`),
};

/* ── Applications ── */
export const applicationAPI = {
  apply:          (data)   => api.post('/apply', data),
  getForProject:  (id)     => api.get(`/applications/${id}`),
  getMine:        ()       => api.get('/applications/my'),
  updateStatus:   (data)   => api.put('/application/status', data),
  withdraw:       (id)     => api.delete(`/application/${id}`),
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
  block:           (convId) => api.post(`/conversations/${convId}/block`),
  unblock:         (convId) => api.delete(`/conversations/${convId}/block`),
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

/* ── Follow API ── */
export const followAPI = {
  follow:       (userId)   => api.post(`/follow/${userId}`),
  unfollow:     (userId)   => api.delete(`/follow/${userId}`),
  // New — follow status + counts in one request
  getStatus:    (userId)   => api.get(`/follow/status/${userId}`),
  // Legacy alias (kept for backward compat)
  getInfo:      (userId)   => api.get(`/follow/status/${userId}`),
  // Public endpoints (no auth needed)
  getCounts:    (userId)   => api.get(`/follow/counts/${userId}`),
  getFollowers: (userId)   => api.get(`/follow/followers/${userId}`),
  getFollowing: (userId)   => api.get(`/follow/following/${userId}`),
  getFeed:      (page = 1) => api.get('/follow/feed', { params: { page } }),
};

/* ── Waitlist API ── */
export const waitlistAPI = {
  join:    (projectId, role) => api.post(`/projects/${projectId}/waitlist`, { role }),
  leave:   (projectId, role) => api.delete(`/projects/${projectId}/waitlist`, { data: { role } }),
  getAll:  (projectId)       => api.get(`/projects/${projectId}/waitlist`),
};

/* ── Mentor API ── */
export const mentorAPI = {
  getAll:              (params)                      => api.get('/mentors', { params }),
  updateSettings:      (data)                        => api.patch('/mentors/settings', data),
  updateStatus:        (mentorStatus)                => api.patch('/mentors/settings', { mentorStatus }),
  apply:               (mentorUserId, message)       => api.post(`/mentors/${mentorUserId}/apply`, { message }),
  getApplications:     ()                            => api.get('/message-requests'),
  getSentRequests:     ()                            => api.get('/message-requests/sent'),
  acceptRequest:       (requestId)                   => api.patch(`/mentors/requests/${requestId}/accept`),
  declineRequest:      (requestId)                   => api.patch(`/message-requests/${requestId}/decline`),
  getReviews:          (mentorUserId)                => api.get(`/mentors/${mentorUserId}/reviews`),
  submitReview:        (mentorUserId, data)          => api.post(`/mentors/${mentorUserId}/reviews`, data),
  deleteReview:        (mentorUserId)                => api.delete(`/mentors/${mentorUserId}/reviews`),
  // Booking
  getSlots:            (mentorUserId, month)         => api.get(`/mentors/${mentorUserId}/slots`, { params: { month } }),
  requestBooking:      (mentorUserId, data)          => api.post(`/mentors/${mentorUserId}/bookings`, data),
  getMyBookings:       ()                            => api.get('/mentors/my-bookings'),
  getIncomingBookings: ()                            => api.get('/mentors/incoming-bookings'),
  confirmBooking:      (id, data)                    => api.patch(`/mentors/bookings/${id}/confirm`, data),
  cancelBooking:       (id, reason)                  => api.patch(`/mentors/bookings/${id}/cancel`, { reason }),
  completeBooking:     (id)                          => api.patch(`/mentors/bookings/${id}/complete`),
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
  getStats:            ()                => api.get('/admin/stats'),
  getAnalytics:        ()                => api.get('/admin/analytics'),
  getUsers:            (params)          => api.get('/admin/users', { params }),
  suspendUser:         (id, suspend)     => api.patch(`/admin/users/${id}/suspend`, { suspend }),
  announce:            (data)            => api.post('/admin/announce', data),
  getTrending:         ()                => api.get('/admin/trending-films'),
  getReports:          (params)          => api.get('/admin/reports', { params }),
  updateReportStatus:  (id, status)      => api.patch(`/admin/reports/${id}`, { status }),
  clearTestData:       ()                => api.delete('/admin/clear-test-data'),
  // Phase 2: Project moderation
  getPendingProjects:  (params)          => api.get('/admin/projects/pending', { params }),
  moderateProject:     (id, action, note) => api.patch(`/admin/projects/${id}/moderate`, { action, note }),
  // Phase 4: Verified Creator badge
  setVerifiedBadge:    (id, verified)    => api.patch(`/admin/users/${id}/verify`, { verified }),
  // Risk Monitor
  getRiskProjects:     (params)          => api.get('/admin/risk-monitor', { params }),
  adminDeleteProject:  (id)              => api.delete(`/admin/risk-monitor/${id}`),
  restoreProject:      (id)              => api.patch(`/admin/risk-monitor/${id}/restore`),
};

/* ── Reports ── */
export const reportAPI = {
  submit:       (data)   => api.post('/reports', data),
  mine:         ()       => api.get('/reports/mine'),
  // Admin
  getQueue:     (params) => api.get('/admin/report-queue', { params }),
  resolve:      (id, action, note, warnUser) => api.patch(`/admin/report-queue/${id}/resolve`, { action, note, warnUser }),
};

/* ── Contests ── */
export const contestAPI = {
  getAll:     ()         => api.get('/contests'),
  getById:    (id)       => api.get(`/contests/${id}`),
  create:     (data)     => api.post('/contests', data),
  update:     (id, data) => api.put(`/contests/${id}`, data),
  end:        (id)       => api.patch(`/contests/${id}/end`),
  setWinners:      (id, data) => api.patch(`/contests/${id}/winners`, data),
  delete:          (id)       => api.delete(`/contests/${id}`),
  submitPrizeClaim:   (id, data)       => api.post(`/contests/${id}/prize-claim`, data),
  getPrizeClaims:     (id)             => api.get(`/contests/${id}/prize-claims`),
  markClaimProcessed: (id, claimId)    => api.patch(`/contests/${id}/prize-claims/${claimId}`),
};

/* ── Contest Submissions ── */
export const contestSubmissionAPI = {
  getSubmissions:    (contestId, params)            => api.get(`/contests/${contestId}/submissions`, { params }),
  getLeaderboard:    (contestId)                    => api.get(`/contests/${contestId}/leaderboard`),
  checkEligibility:  (contestId)                    => api.get(`/contests/${contestId}/eligibility`),
  getMySubmission:   (contestId)                    => api.get(`/contests/${contestId}/my-submission`),
  submitFilm:        (contestId, data)              => api.post(`/contests/${contestId}/submissions`, data),
  deleteSubmission:  (contestId, subId)             => api.delete(`/contests/${contestId}/submissions/${subId}`),
  toggleLike:        (contestId, subId)             => api.post(`/contests/${contestId}/submissions/${subId}/like`),
  toggleVote:        (contestId, subId)             => api.post(`/contests/${contestId}/submissions/${subId}/vote`),
  getComments:       (contestId, subId)             => api.get(`/contests/${contestId}/submissions/${subId}/comments`),
  addComment:        (contestId, subId, text)       => api.post(`/contests/${contestId}/submissions/${subId}/comments`, { text }),
  deleteComment:     (contestId, subId, commentId)  => api.delete(`/contests/${contestId}/submissions/${subId}/comments/${commentId}`),
  // Admin
  adminGetAll:    (params)        => api.get('/contests/admin/submissions', { params }),
  adminApprove:   (subId, note)   => api.patch(`/contests/admin/submissions/${subId}/approve`, { note }),
  adminReject:    (subId, reason) => api.patch(`/contests/admin/submissions/${subId}/reject`, { reason }),
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

/* ── Activity Feed ── */
export const activityAPI = {
  getFeed:         (page = 1, limit = 20) => api.get(`/activity/feed?page=${page}&limit=${limit}`),
  getUserActivity: (userId, page = 1)     => api.get(`/activity/user/${userId}?page=${page}`),
};

/* ── Message Requests ── */
export const messageRequestAPI = {
  send:        (recipientId, message = '') => api.post('/message-requests', { recipientId, message }),
  getIncoming: ()                          => api.get('/message-requests'),
  getSent:     ()                          => api.get('/message-requests/sent'),
  getStatus:   (userId)                    => api.get(`/message-requests/status/${userId}`),
  accept:      (requestId)                 => api.patch(`/message-requests/${requestId}/accept`),
  decline:     (requestId)                 => api.patch(`/message-requests/${requestId}/decline`),
};

export default api;
