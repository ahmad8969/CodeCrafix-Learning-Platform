import api from '@/services/api'

const unwrap = (response) => response.data?.data ?? response.data

export const liveClassService = {
  list: async (params) => unwrap(await api.get('/live-classes', { params })),
  get: async (id) => unwrap(await api.get(`/live-classes/${id}`)),
  create: async (payload) => unwrap(await api.post('/live-classes', payload)),
  update: async (id, payload) => unwrap(await api.patch(`/live-classes/${id}`, payload)),
  remove: async (id) => unwrap(await api.delete(`/live-classes/${id}`)),
  start: async (id) => unwrap(await api.post(`/live-classes/${id}/start`)),
  end: async (id) => unwrap(await api.post(`/live-classes/${id}/end`)),
  cancel: async (id, reason) => unwrap(await api.post(`/live-classes/${id}/cancel`, { reason })),
  duplicate: async (id) => unwrap(await api.post(`/live-classes/${id}/duplicate`)),
  teacherSchedule: async (params) => unwrap(await api.get('/live-classes/schedule/teacher', { params })),
  studentSchedule: async (params) => unwrap(await api.get('/live-classes/schedule/student', { params })),
  adminDashboard: async () => unwrap(await api.get('/live-classes/dashboard/admin')),
  roster: async (id) => unwrap(await api.get(`/live-classes/${id}/roster`)),
  classAttendance: async (id) => unwrap(await api.get(`/live-classes/${id}/attendance`)),
  markAttendance: async (id, entries) =>
    unwrap(await api.post(`/live-classes/${id}/attendance`, { entries })),
  myAttendance: async (params) => unwrap(await api.get('/live-classes/attendance/me', { params })),
  studentAttendance: async (studentId, params) =>
    unwrap(await api.get(`/live-classes/attendance/students/${studentId}`, { params })),
  attendanceRules: async (params) => unwrap(await api.get('/live-classes/attendance/rules', { params })),
  saveAttendanceRules: async (payload) => unwrap(await api.put('/live-classes/attendance/rules', payload)),
  attendanceAnalytics: async (params) =>
    unwrap(await api.get('/live-classes/attendance/analytics', { params })),
  listAnnouncements: async (params) => unwrap(await api.get('/live-classes/announcements', { params })),
  getAnnouncement: async (id) => unwrap(await api.get(`/live-classes/announcements/${id}`)),
  createAnnouncement: async (payload) => unwrap(await api.post('/live-classes/announcements', payload)),
  updateAnnouncement: async (id, payload) =>
    unwrap(await api.patch(`/live-classes/announcements/${id}`, payload)),
  publishAnnouncement: async (id) => unwrap(await api.post(`/live-classes/announcements/${id}/publish`)),
  archiveAnnouncement: async (id) => unwrap(await api.post(`/live-classes/announcements/${id}/archive`)),
  deleteAnnouncement: async (id) => unwrap(await api.delete(`/live-classes/announcements/${id}`)),
  calendar: async (params) => unwrap(await api.get('/live-classes/calendar', { params })),
  createEvent: async (payload) => unwrap(await api.post('/live-classes/calendar/events', payload)),
  updateEvent: async (id, payload) =>
    unwrap(await api.patch(`/live-classes/calendar/events/${id}`, payload)),
  deleteEvent: async (id) => unwrap(await api.delete(`/live-classes/calendar/events/${id}`)),
  listRecordings: async (params) => unwrap(await api.get('/live-classes/recordings', { params })),
  addRecording: async (payload) => unwrap(await api.post('/live-classes/recordings', payload)),
}
