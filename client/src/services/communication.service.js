import api from '@/services/api'

const unwrap = (response) => response.data?.data ?? response.data

export const communicationService = {
  search: async (params) => unwrap(await api.get('/communication/search', { params })),

  // Messaging
  conversations: async () => unwrap(await api.get('/communication/messages/conversations')),
  searchMessages: async (q) =>
    unwrap(await api.get('/communication/messages/search', { params: { q } })),
  startDirect: async (userId) =>
    unwrap(await api.post('/communication/messages/direct', { userId })),
  createGroup: async (payload) =>
    unwrap(await api.post('/communication/messages/groups', payload)),
  messages: async (id, params) =>
    unwrap(await api.get(`/communication/messages/conversations/${id}`, { params })),
  sendMessage: async (id, payload) =>
    unwrap(await api.post(`/communication/messages/conversations/${id}`, payload)),
  markRead: async (id) =>
    unwrap(await api.post(`/communication/messages/conversations/${id}/read`)),
  pinMessage: async (id, messageId) =>
    unwrap(await api.post(`/communication/messages/conversations/${id}/pin`, { messageId })),
  archiveConversation: async (id) =>
    unwrap(await api.post(`/communication/messages/conversations/${id}/archive`)),

  // Forums
  listThreads: async (params) => unwrap(await api.get('/communication/forums', { params })),
  getThread: async (id) => unwrap(await api.get(`/communication/forums/${id}`)),
  createThread: async (payload) => unwrap(await api.post('/communication/forums', payload)),
  reply: async (id, payload) =>
    unwrap(await api.post(`/communication/forums/${id}/replies`, payload)),
  like: async (id) => unwrap(await api.post(`/communication/forums/${id}/like`)),
  follow: async (id) => unwrap(await api.post(`/communication/forums/${id}/follow`)),
  bestAnswer: async (id, replyId) =>
    unwrap(await api.post(`/communication/forums/${id}/best-answer`, { replyId })),
  pinThread: async (id) => unwrap(await api.post(`/communication/forums/${id}/pin`)),
  lockThread: async (id) => unwrap(await api.post(`/communication/forums/${id}/lock`)),
  report: async (id) => unwrap(await api.post(`/communication/forums/${id}/report`)),

  // Helpdesk
  listTickets: async (params) => unwrap(await api.get('/communication/tickets', { params })),
  getTicket: async (id) => unwrap(await api.get(`/communication/tickets/${id}`)),
  createTicket: async (payload) => unwrap(await api.post('/communication/tickets', payload)),
  commentTicket: async (id, payload) =>
    unwrap(await api.post(`/communication/tickets/${id}/comments`, payload)),
  updateTicket: async (id, payload) =>
    unwrap(await api.patch(`/communication/tickets/${id}`, payload)),
  reopenTicket: async (id) => unwrap(await api.post(`/communication/tickets/${id}/reopen`)),

  // CRM
  listLeads: async (params) => unwrap(await api.get('/communication/crm/leads', { params })),
  getLead: async (id) => unwrap(await api.get(`/communication/crm/leads/${id}`)),
  createLead: async (payload) => unwrap(await api.post('/communication/crm/leads', payload)),
  updateLead: async (id, payload) =>
    unwrap(await api.patch(`/communication/crm/leads/${id}`, payload)),
  followUp: async (id, payload) =>
    unwrap(await api.post(`/communication/crm/leads/${id}/follow-ups`, payload)),
  moveLead: async (id, stage) =>
    unwrap(await api.post(`/communication/crm/leads/${id}/move`, { stage })),

  // Surveys
  listSurveys: async (params) => unwrap(await api.get('/communication/surveys', { params })),
  getSurvey: async (id) => unwrap(await api.get(`/communication/surveys/${id}`)),
  createSurvey: async (payload) => unwrap(await api.post('/communication/surveys', payload)),
  updateSurvey: async (id, payload) =>
    unwrap(await api.patch(`/communication/surveys/${id}`, payload)),
  publishSurvey: async (id) => unwrap(await api.post(`/communication/surveys/${id}/publish`)),
  submitSurvey: async (id, answers) =>
    unwrap(await api.post(`/communication/surveys/${id}/responses`, { answers })),
  surveyAnalytics: async (id) =>
    unwrap(await api.get(`/communication/surveys/${id}/analytics`)),

  // Career
  myCareer: async () => unwrap(await api.get('/communication/career/me')),
  updateCareer: async (payload) => unwrap(await api.put('/communication/career/me', payload)),
  listCareers: async (params) =>
    unwrap(await api.get('/communication/career/profiles', { params })),
  reviewCareer: async (userId, payload) =>
    unwrap(await api.post(`/communication/career/profiles/${userId}/review`, payload)),
  listJobs: async (params) => unwrap(await api.get('/communication/career/jobs', { params })),
  getJob: async (id) => unwrap(await api.get(`/communication/career/jobs/${id}`)),
  createJob: async (payload) => unwrap(await api.post('/communication/career/jobs', payload)),
  updateJob: async (id, payload) =>
    unwrap(await api.patch(`/communication/career/jobs/${id}`, payload)),
  applyJob: async (id, payload) =>
    unwrap(await api.post(`/communication/career/jobs/${id}/apply`, payload)),
  myApplications: async () => unwrap(await api.get('/communication/career/applications/me')),

  // Alumni
  listAlumni: async (params) => unwrap(await api.get('/communication/alumni', { params })),
  upsertAlumni: async (payload) => unwrap(await api.put('/communication/alumni/me', payload)),
  listAlumniEvents: async () => unwrap(await api.get('/communication/alumni/events')),
  createAlumniEvent: async (payload) =>
    unwrap(await api.post('/communication/alumni/events', payload)),
}
