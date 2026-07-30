import axios from 'axios'
import { apiConfig } from '@/config/api.config'
import { ACCESS_TOKEN_KEY, ROUTES } from '@/constants'

const api = axios.create({
  baseURL: apiConfig.baseURL,
  timeout: apiConfig.timeout,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

let isRefreshing = false
let pendingQueue = []

function flushQueue(error, token = null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token)
  })
  pendingQueue = []
}

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
      const { data } = await axios.post(
        `${apiConfig.baseURL}/auth/refresh-token`,
        {},
        { withCredentials: true }
      )
      const accessToken = data?.data?.accessToken
      if (!accessToken) throw new Error('No access token in refresh response')

      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
      flushQueue(null, accessToken)
      original.headers.Authorization = `Bearer ${accessToken}`
      return api(original)
    } catch (refreshError) {
      flushQueue(refreshError, null)
      localStorage.removeItem(ACCESS_TOKEN_KEY)
      const path = typeof window !== 'undefined' ? window.location.pathname : ''
      const publicPrefixes = [
        '/',
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
        '/unauthorized',
        '/offline',
        '/404',
        '/500',
        '/verify',
        '/portfolio',
      ]
      const isPublic =
        path === '/' ||
        publicPrefixes.some((p) => p !== '/' && path.startsWith(p))
      if (!isPublic) {
        window.location.assign(ROUTES.LOGIN)
      }
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default api
