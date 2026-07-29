import api from '@/services/api'

const unwrap = (response) => response.data?.data ?? response.data

export const assignmentService = {
  list: async (params) => unwrap(await api.get('/assignments', { params })),
  get: async (id) => unwrap(await api.get(`/assignments/${id}`)),
  create: async (payload) => unwrap(await api.post('/assignments', payload)),
  update: async (id, payload) => unwrap(await api.patch(`/assignments/${id}`, payload)),
  remove: async (id) => unwrap(await api.delete(`/assignments/${id}`)),
  restore: async (id) => unwrap(await api.post(`/assignments/${id}/restore`)),
  publish: async (id) => unwrap(await api.post(`/assignments/${id}/publish`)),
  archive: async (id) => unwrap(await api.post(`/assignments/${id}/archive`)),
  updateRubrics: async (id, rubrics) =>
    unwrap(await api.patch(`/assignments/${id}/rubrics`, { rubrics })),
  draft: async (id, payload) => unwrap(await api.post(`/assignments/${id}/draft`, payload)),
  submit: async (id, formData) =>
    unwrap(
      await api.post(`/assignments/${id}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    ),
  submitJson: async (id, payload) => unwrap(await api.post(`/assignments/${id}/submit`, payload)),
  resubmit: async (id, formData) =>
    unwrap(
      await api.post(`/assignments/${id}/resubmit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    ),
  history: async (id) => unwrap(await api.get(`/assignments/${id}/history`)),
  listSubmissions: async (id, params) =>
    unwrap(await api.get(`/assignments/${id}/submissions`, { params })),
  getSubmission: async (submissionId) =>
    unwrap(await api.get(`/assignments/submissions/${submissionId}`)),
  grade: async (submissionId, payload) =>
    unwrap(await api.post(`/assignments/submissions/${submissionId}/grade`, payload)),
  upload: async (formData) =>
    unwrap(
      await api.post('/assignments/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    ),
  analytics: async (params) => unwrap(await api.get('/assignments/analytics', { params })),
  studentDashboard: async () => unwrap(await api.get('/assignments/dashboard/student')),
  teacherDashboard: async () => unwrap(await api.get('/assignments/dashboard/teacher')),
  adminDashboard: async () => unwrap(await api.get('/assignments/dashboard/admin')),
}
