import api from '@/services/api'

const unwrap = (response) => response.data?.data ?? response.data

export const quizService = {
  list: async (params) => unwrap(await api.get('/quizzes', { params })),
  get: async (id) => unwrap(await api.get(`/quizzes/${id}`)),
  create: async (payload) => unwrap(await api.post('/quizzes', payload)),
  update: async (id, payload) => unwrap(await api.patch(`/quizzes/${id}`, payload)),
  remove: async (id) => unwrap(await api.delete(`/quizzes/${id}`)),
  restore: async (id) => unwrap(await api.post(`/quizzes/${id}/restore`)),
  publish: async (id) => unwrap(await api.post(`/quizzes/${id}/publish`)),
  archive: async (id) => unwrap(await api.post(`/quizzes/${id}/archive`)),
  duplicate: async (id) => unwrap(await api.post(`/quizzes/${id}/duplicate`)),
  start: async (id, payload = {}) => unwrap(await api.post(`/quizzes/${id}/start`, payload)),
  saveProgress: async (attemptId, payload) =>
    unwrap(await api.post(`/quizzes/attempts/${attemptId}/progress`, payload)),
  submit: async (attemptId, payload) =>
    unwrap(await api.post(`/quizzes/attempts/${attemptId}/submit`, payload)),
  getAttempt: async (attemptId) => unwrap(await api.get(`/quizzes/attempts/${attemptId}`)),
  listAttempts: async (id) => unwrap(await api.get(`/quizzes/${id}/attempts`)),
  history: async (id) => unwrap(await api.get(`/quizzes/${id}/history`)),
  leaderboard: async (id, params) => unwrap(await api.get(`/quizzes/${id}/leaderboard`, { params })),
  analytics: async (params) => unwrap(await api.get('/quizzes/analytics', { params })),
  pool: async (params) => unwrap(await api.get('/quizzes/pool', { params })),
  studentDashboard: async () => unwrap(await api.get('/quizzes/dashboard/student')),
  teacherDashboard: async () => unwrap(await api.get('/quizzes/dashboard/teacher')),
}
