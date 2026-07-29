import api from '@/services/api'

const unwrap = (response) => response.data?.data ?? response.data

export const enrollmentService = {
  list: async (params) => unwrap(await api.get('/enrollments', { params })),
  get: async (id) => unwrap(await api.get(`/enrollments/${id}`)),
  create: async (payload) => unwrap(await api.post('/enrollments', payload)),
  bulk: async (rows) => unwrap(await api.post('/enrollments/bulk', { rows })),
  selfEnroll: async (payload) => unwrap(await api.post('/enrollments/self', payload)),
  enrollByCode: async (code) => unwrap(await api.post('/enrollments/code', { code })),
  approve: async (id) => unwrap(await api.post(`/enrollments/${id}/approve`)),
  reject: async (id, notes) => unwrap(await api.post(`/enrollments/${id}/reject`, { notes })),
  withdraw: async (id) => unwrap(await api.post(`/enrollments/${id}/withdraw`)),
  transferBatch: async (id, batchId) =>
    unwrap(await api.post(`/enrollments/${id}/transfer-batch`, { batchId })),
  transferCourse: async (id, payload) =>
    unwrap(await api.post(`/enrollments/${id}/transfer-course`, payload)),
  progressReport: async (studentId, courseId) =>
    unwrap(await api.get(`/enrollments/progress/${studentId}/${courseId}`)),
  timeline: async (params) => unwrap(await api.get('/enrollments/timeline', { params })),
  learningPath: async (courseId, params) =>
    unwrap(await api.get(`/enrollments/learning-path/${courseId}`, { params })),
  topicAccess: async (topicId, params) =>
    unwrap(await api.get(`/enrollments/topics/${topicId}/access`, { params })),
  unlockTopic: async (payload) => unwrap(await api.post('/enrollments/topics/unlock', payload)),
  analytics: async () => unwrap(await api.get('/enrollments/analytics')),
  batchReport: async (batchId) => unwrap(await api.get(`/enrollments/reports/batch/${batchId}`)),
  courseReport: async (courseId) => unwrap(await api.get(`/enrollments/reports/course/${courseId}`)),
  teacherReport: async (teacherId) =>
    unwrap(
      await api.get(teacherId ? `/enrollments/reports/teacher/${teacherId}` : '/enrollments/reports/teacher')
    ),
  myProfile: async () => unwrap(await api.get('/enrollments/profile/me')),
  updateProfile: async (payload) => unwrap(await api.patch('/enrollments/profile/me', payload)),
  studentProfile: async (studentId) => unwrap(await api.get(`/enrollments/profile/${studentId}`)),
  continueLearning: async () => unwrap(await api.get('/enrollments/continue')),
}

export const batchRosterService = {
  students: async (id) => unwrap(await api.get(`/batches/${id}/students`)),
  analytics: async (id) => unwrap(await api.get(`/batches/${id}/analytics`)),
  calendar: async (id) => unwrap(await api.get(`/batches/${id}/calendar`)),
  archive: async (id) => unwrap(await api.post(`/batches/${id}/archive`)),
  clone: async (id) => unwrap(await api.post(`/batches/${id}/clone`)),
}
