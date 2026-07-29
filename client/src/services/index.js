import api from '@/services/api'

function unwrap(response) {
  return response.data?.data ?? response.data
}

export const authService = {
  async login(credentials) {
    const raw = await api.post('/auth/login', credentials)
    const data = unwrap(raw)
    if (data?.token) localStorage.setItem('codecrafters-token', data.token)
    return data
  },
  async register(payload) {
    const raw = await api.post('/auth/register', payload)
    const data = unwrap(raw)
    if (data?.token) localStorage.setItem('codecrafters-token', data.token)
    return data
  },
  async me() {
    const raw = await api.get('/auth/me')
    return unwrap(raw)
  },
  async logout() {
    try {
      await api.post('/auth/logout')
    } finally {
      localStorage.removeItem('codecrafters-token')
    }
  },
}

export const healthService = {
  async check() {
    const raw = await api.get('/health')
    return unwrap(raw)
  },
}

export const dashboardService = {
  async getStudent() {
    const raw = await api.get('/dashboard/student')
    return unwrap(raw)
  },
  async getTeacher() {
    const raw = await api.get('/dashboard/teacher')
    return unwrap(raw)
  },
  async getAdmin() {
    const raw = await api.get('/dashboard/admin')
    return unwrap(raw)
  },
}
