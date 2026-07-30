import api from '@/services/api'

const unwrap = (response) => response.data?.data ?? response.data

export const certificateService = {
  list: async (params) => unwrap(await api.get('/certificates', { params })),
  get: async (id) => unwrap(await api.get(`/certificates/${id}`)),
  issue: async (payload) => unwrap(await api.post('/certificates/issue', payload)),
  approve: async (id) => unwrap(await api.post(`/certificates/${id}/approve`)),
  revoke: async (id, reason) => unwrap(await api.post(`/certificates/${id}/revoke`, { reason })),
  pending: async (params) => unwrap(await api.get('/certificates/pending', { params })),
  adminStats: async () => unwrap(await api.get('/certificates/admin/stats')),
  listTemplates: async (params) => unwrap(await api.get('/certificates/templates', { params })),
  getTemplate: async (id) => unwrap(await api.get(`/certificates/templates/${id}`)),
  createTemplate: async (payload) => unwrap(await api.post('/certificates/templates', payload)),
  updateTemplate: async (id, payload) =>
    unwrap(await api.patch(`/certificates/templates/${id}`, payload)),
  deleteTemplate: async (id) => unwrap(await api.delete(`/certificates/templates/${id}`)),
  getRule: async (courseId, params) =>
    unwrap(await api.get(`/certificates/rules/${courseId}`, { params })),
  saveRule: async (courseId, payload) =>
    unwrap(await api.put(`/certificates/rules/${courseId}`, payload)),
  eligibility: async (courseId, params) =>
    unwrap(await api.get(`/certificates/eligibility/${courseId}`, { params })),
  verify: async (tokenOrNumber) => {
    if (String(tokenOrNumber).startsWith('CC-')) {
      return unwrap(await api.get('/certificates/verify', { params: { number: tokenOrNumber } }))
    }
    return unwrap(await api.get(`/certificates/verify/${tokenOrNumber}`))
  },
}

export const gamificationService = {
  me: async (params) => unwrap(await api.get('/gamification/me', { params })),
  dailyLogin: async () => unwrap(await api.post('/gamification/me/daily-login')),
  myAchievements: async () => unwrap(await api.get('/gamification/me/achievements')),
  myPortfolio: async () => unwrap(await api.get('/gamification/me/portfolio')),
  setPortfolioVisibility: async (isPublic) =>
    unwrap(await api.patch('/gamification/me/portfolio/visibility', { public: isPublic })),
  publicPortfolio: async (slug) => unwrap(await api.get(`/gamification/portfolio/public/${slug}`)),
  leaderboard: async (params) => unwrap(await api.get('/gamification/leaderboard', { params })),
  listBadges: async (params) => unwrap(await api.get('/gamification/badges', { params })),
  listAchievements: async (params) => unwrap(await api.get('/gamification/achievements', { params })),
  getSettings: async () => unwrap(await api.get('/gamification/settings')),
  updateSettings: async (payload) => unwrap(await api.put('/gamification/settings', payload)),
  upsertBadge: async (payload) => unwrap(await api.post('/gamification/badges', payload)),
  upsertAchievement: async (payload) => unwrap(await api.post('/gamification/achievements', payload)),
  awardBadge: async (payload) => unwrap(await api.post('/gamification/badges/award', payload)),
  awardXp: async (payload) => unwrap(await api.post('/gamification/xp/award', payload)),
  studentSummary: async (studentId, params) =>
    unwrap(await api.get(`/gamification/students/${studentId}`, { params })),
  studentPortfolio: async (studentId) =>
    unwrap(await api.get(`/gamification/students/${studentId}/portfolio`)),
  adminDashboard: async () => unwrap(await api.get('/gamification/admin/dashboard')),
  seedDefaults: async () => unwrap(await api.post('/gamification/admin/seed-defaults')),
  courseConfig: async (courseId) =>
    unwrap(await api.get(`/gamification/courses/${courseId}/config`)),
  updateCourseConfig: async (courseId, payload) =>
    unwrap(await api.put(`/gamification/courses/${courseId}/config`, payload)),
}
