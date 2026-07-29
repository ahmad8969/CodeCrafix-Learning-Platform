import api from '@/services/api'

const unwrap = (response) => response.data?.data ?? response.data

export const practiceService = {
  list: async (params) => unwrap(await api.get('/practice/questions', { params })),
  get: async (id) => unwrap(await api.get(`/practice/questions/${id}`)),
  create: async (payload) => unwrap(await api.post('/practice/questions', payload)),
  update: async (id, payload) => unwrap(await api.patch(`/practice/questions/${id}`, payload)),
  archive: async (id) => unwrap(await api.delete(`/practice/questions/${id}`)),
  restore: async (id) => unwrap(await api.post(`/practice/questions/${id}/restore`)),
  clone: async (id) => unwrap(await api.post(`/practice/questions/${id}/clone`)),
  run: async (id, payload) => unwrap(await api.post(`/practice/questions/${id}/run`, payload)),
  submit: async (id, payload) => unwrap(await api.post(`/practice/questions/${id}/submit`, payload)),
  attempts: async (id) => unwrap(await api.get(`/practice/questions/${id}/attempts`)),
  bookmark: async (id) => unwrap(await api.post(`/practice/questions/${id}/bookmark`)),
  byTopic: async (topicId) => unwrap(await api.get(`/practice/topics/${topicId}/questions`)),
  assign: async (topicId, payload) =>
    unwrap(await api.post(`/practice/topics/${topicId}/assign`, payload)),
  dashboard: async () => unwrap(await api.get('/practice/dashboard')),
  analytics: async (params) => unwrap(await api.get('/practice/analytics', { params })),
  export: async (params) => unwrap(await api.get('/practice/questions/export', { params })),
  import: async (items) => unwrap(await api.post('/practice/questions/import', { items })),
  categories: async () => unwrap(await api.get('/practice/categories')),
  upsertCategory: async (payload) => unwrap(await api.post('/practice/categories', payload)),
  leaderboard: async (params) => unwrap(await api.get('/practice/leaderboard', { params })),
}
