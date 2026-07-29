import api from '@/services/api'

const unwrap = (response) => response.data?.data ?? response.data

export const platformService = {
  architecture: async () => unwrap(await api.get('/platform/architecture')),
  languages: async () => unwrap(await api.get('/platform/languages')),
  featureFlags: async () => unwrap(await api.get('/platform/feature-flags')),
  plugins: async () => unwrap(await api.get('/platform/plugins')),
  notifications: async (params) => unwrap(await api.get('/platform/notifications', { params })),
  markNotificationRead: async (id) => unwrap(await api.post(`/platform/notifications/${id}/read`)),
  trackProgress: async (payload) => unwrap(await api.post('/platform/progress', payload)),
  progressSummary: async () => unwrap(await api.get('/platform/progress/summary')),
  aiCatalog: async () => unwrap(await api.get('/platform/ai/catalog')),
  aiAction: async (payload) => unwrap(await api.post('/platform/ai/actions', payload)),
  offlineSync: async (ops) => unwrap(await api.post('/platform/offline/sync', { ops })),
  evaluate: async (payload) => unwrap(await api.post('/platform/evaluate', payload)),
}
