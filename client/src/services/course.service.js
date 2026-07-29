import api from '@/services/api'

function unwrap(response) {
  return response.data?.data ?? response.data
}

export const categoryService = {
  list: async (params) => unwrap(await api.get('/categories', { params })),
  get: async (id) => unwrap(await api.get(`/categories/${id}`)),
  create: async (payload) => unwrap(await api.post('/categories', payload)),
  update: async (id, payload) => unwrap(await api.patch(`/categories/${id}`, payload)),
  remove: async (id) => unwrap(await api.delete(`/categories/${id}`)),
  restore: async (id) => unwrap(await api.post(`/categories/${id}/restore`)),
}

export const courseService = {
  list: async (params) => unwrap(await api.get('/courses', { params })),
  get: async (id) => unwrap(await api.get(`/courses/${id}`)),
  create: async (payload) => unwrap(await api.post('/courses', payload)),
  update: async (id, payload) => unwrap(await api.patch(`/courses/${id}`, payload)),
  remove: async (id) => unwrap(await api.delete(`/courses/${id}`)),
  restore: async (id) => unwrap(await api.post(`/courses/${id}/restore`)),
  publish: async (id) => unwrap(await api.post(`/courses/${id}/publish`)),
  archive: async (id) => unwrap(await api.post(`/courses/${id}/archive`)),
  feature: async (id, featured = true) =>
    unwrap(await api.post(`/courses/${id}/feature`, { featured })),
  bulkStatus: async (ids, status) =>
    unwrap(await api.post('/courses/bulk/status', { ids, status })),
  bulkDelete: async (ids) => unwrap(await api.post('/courses/bulk/delete', { ids })),
  stats: async () => unwrap(await api.get('/courses/stats/dashboard')),
}

export const batchService = {
  list: async (params) => unwrap(await api.get('/batches', { params })),
  get: async (id) => unwrap(await api.get(`/batches/${id}`)),
  create: async (payload) => unwrap(await api.post('/batches', payload)),
  update: async (id, payload) => unwrap(await api.patch(`/batches/${id}`, payload)),
  remove: async (id) => unwrap(await api.delete(`/batches/${id}`)),
  restore: async (id) => unwrap(await api.post(`/batches/${id}/restore`)),
  students: async (id) => unwrap(await api.get(`/batches/${id}/students`)),
  analytics: async (id) => unwrap(await api.get(`/batches/${id}/analytics`)),
  calendar: async (id) => unwrap(await api.get(`/batches/${id}/calendar`)),
  archive: async (id) => unwrap(await api.post(`/batches/${id}/archive`)),
  clone: async (id) => unwrap(await api.post(`/batches/${id}/clone`)),
}

export const usersService = {
  instructors: async () => unwrap(await api.get('/users/instructors')),
}
