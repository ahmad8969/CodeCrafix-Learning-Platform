import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authService, clearTokens, getStoredAccessToken } from '@/services/auth.service'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    if (!getStoredAccessToken() && !localStorage.getItem('codecrafters-refresh-token')) {
      setUser(null)
      return null
    }
    try {
      const me = await authService.me()
      setUser(me)
      return me
    } catch {
      try {
        const refreshed = await authService.refreshToken()
        setUser(refreshed.user)
        return refreshed.user
      } catch {
        clearTokens()
        setUser(null)
        return null
      }
    }
  }, [])

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      if (getStoredAccessToken() || localStorage.getItem('codecrafters-refresh-token')) {
        try {
          const me = await authService.me()
          if (active) setUser(me)
        } catch {
          try {
            const refreshed = await authService.refreshToken()
            if (active) setUser(refreshed.user)
          } catch {
            clearTokens()
            if (active) setUser(null)
          }
        }
      }
      if (active) setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (credentials) => {
    const data = await authService.login(credentials)
    setUser(data.user)
    return data
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch {
      clearTokens()
    }
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      logout,
      refreshUser,
      setUser,
    }),
    [user, loading, login, logout, refreshUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
