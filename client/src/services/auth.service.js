import api from '@/services/api'
import { ACCESS_TOKEN_KEY } from '@/constants'

function unwrap(response) {
  return response.data?.data ?? response.data
}

function getMessage(response) {
  return response.data?.message
}

export const authService = {
  async login(credentials) {
    const response = await api.post('/auth/login', credentials)
    const data = unwrap(response)
    if (data?.accessToken) {
      localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken)
    }
    return data
  },

  async logout() {
    try {
      await api.post('/auth/logout')
    } finally {
      localStorage.removeItem(ACCESS_TOKEN_KEY)
    }
  },

  async refreshToken() {
    const response = await api.post('/auth/refresh-token')
    const data = unwrap(response)
    if (data?.accessToken) {
      localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken)
    }
    return data
  },

  async me() {
    const response = await api.get('/auth/me')
    return unwrap(response)
  },

  async forgotPassword(payload) {
    const response = await api.post('/auth/forgot-password', payload)
    return { ...(unwrap(response) || {}), message: getMessage(response) }
  },

  async resetPassword(payload) {
    const response = await api.post('/auth/reset-password', payload)
    return { message: getMessage(response) }
  },

  async changePassword(payload) {
    const response = await api.post('/auth/change-password', payload)
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    return { message: getMessage(response) }
  },
}

export { unwrap }
