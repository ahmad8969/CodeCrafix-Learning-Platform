import api from '@/services/api'
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/constants'

function unwrap(response) {
  return response.data?.data ?? response.data
}

export function persistTokens({ accessToken, refreshToken }) {
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  // legacy key cleanup
  localStorage.removeItem('codecrafters-token')
}

export function getStoredAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem('codecrafters-token')
}

export function getStoredRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export const authService = {
  async login(payload) {
    const res = await api.post('/auth/login', payload)
    const data = unwrap(res)
    persistTokens(data)
    return data
  },

  async logout() {
    try {
      await api.post('/auth/logout')
    } finally {
      clearTokens()
    }
  },

  async refreshToken() {
    const refreshToken = getStoredRefreshToken()
    const res = await api.post('/auth/refresh-token', refreshToken ? { refreshToken } : {})
    const data = unwrap(res)
    persistTokens(data)
    return data
  },

  async me() {
    const res = await api.get('/auth/me')
    return unwrap(res)
  },

  async forgotPassword(email) {
    const res = await api.post('/auth/forgot-password', { email })
    return unwrap(res)
  },

  async resetPassword(payload) {
    const res = await api.post('/auth/reset-password', payload)
    return unwrap(res)
  },

  async changePassword(payload) {
    const res = await api.post('/auth/change-password', payload)
    return unwrap(res)
  },
}
