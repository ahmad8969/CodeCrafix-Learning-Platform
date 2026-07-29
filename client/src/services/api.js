import axios from 'axios'
import { apiConfig } from '@/config/api.config'
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, ROUTES } from '@/constants'
import { handleApiError } from '@/utils/error'

const api = axios.create({
  baseURL: apiConfig.baseURL,
  timeout: apiConfig.timeout,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

let isRefreshing = false
let pendingQueue = []

function flushQueue(error, token = null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token)
  })
  pendingQueue = []
}

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem('codecrafters-token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const status = error.response?.status

    if (status !== 401 || !original || original._retry) {
      return Promise.reject(error)
    }

    // Don't try refresh on auth endpoints themselves
    const url = original.url || ''
    if (
      url.includes('/auth/login') ||
      url.includes('/auth/refresh-token') ||
      url.includes('/auth/forgot-password') ||
      url.includes('/auth/reset-password')
    ) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject })
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
      const { data } = await axios.post(
        `${apiConfig.baseURL}/auth/refresh-token`,
        refreshToken ? { refreshToken } : {},
        { withCredentials: true }
      )
      const payload = data?.data ?? data
      const accessToken = payload.accessToken
      const nextRefresh = payload.refreshToken

      if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
      if (nextRefresh) localStorage.setItem(REFRESH_TOKEN_KEY, nextRefresh)

      flushQueue(null, accessToken)
      original.headers.Authorization = `Bearer ${accessToken}`
      return api(original)
    } catch (refreshError) {
      flushQueue(refreshError, null)
      localStorage.removeItem(ACCESS_TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      localStorage.removeItem('codecrafters-token')
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.assign(ROUTES.LOGIN)
      }
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export { handleApiError }
export default api
