import api from '@/services/api'

function unwrap(response) {
  return response.data?.data ?? response.data
}

export const curriculumService = {
  tree: async (courseId) => unwrap(await api.get(`/courses/${courseId}/curriculum/tree`)),
  search: async (courseId, params) =>
    unwrap(await api.get(`/courses/${courseId}/curriculum/search`, { params })),
  stats: async (courseId) => unwrap(await api.get(`/courses/${courseId}/curriculum/stats`)),
}

function crud(base) {
  return {
    list: async (params) => unwrap(await api.get(`/${base}`, { params })),
    get: async (id) => unwrap(await api.get(`/${base}/${id}`)),
    create: async (payload) => unwrap(await api.post(`/${base}`, payload)),
    update: async (id, payload) => unwrap(await api.patch(`/${base}/${id}`, payload)),
    remove: async (id) => unwrap(await api.delete(`/${base}/${id}`)),
    restore: async (id) => unwrap(await api.post(`/${base}/${id}/restore`)),
    reorder: async (payload) => unwrap(await api.post(`/${base}/reorder`, payload)),
  }
}

export const moduleService = crud('modules')
export const weekService = crud('weeks')
export const topicService = crud('topics')
export const lessonService = {
  ...crud('lessons'),
  experience: async (id) => unwrap(await api.get(`/lessons/${id}/experience`)),
  resources: async (id) => unwrap(await api.get(`/lessons/${id}/resources`)),
  related: async (id) => unwrap(await api.get(`/lessons/${id}/related`)),
  search: async (params) => unwrap(await api.get('/lessons/search/query', { params })),
  bookmark: async (id) => unwrap(await api.post(`/lessons/${id}/bookmark`)),
  unbookmark: async (id) => unwrap(await api.delete(`/lessons/${id}/bookmark`)),
  progress: async (id, payload) => unwrap(await api.post(`/lessons/${id}/progress`, payload)),
  getNote: async (id) => unwrap(await api.get(`/lessons/${id}/notes`)),
  saveNote: async (id, content) => unwrap(await api.put(`/lessons/${id}/notes`, { content })),
  deleteNote: async (id) => unwrap(await api.delete(`/lessons/${id}/notes`)),
}
export const resourceService = crud('resources')

export const learningService = {
  dashboard: async () => unwrap(await api.get('/learning/dashboard')),
  bookmarks: async (params) => unwrap(await api.get('/learning/bookmarks', { params })),
}
