import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { ROUTES, getHomePathForRole } from '@/constants'
import { PageLoader } from '@/components/loaders'

export function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, loading, user } = useAuth()
  const location = useLocation()

  if (loading) return <PageLoader label="Checking session…" />

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />
  }

  if (roles?.length && !roles.includes(user?.role)) {
    // Super admin can access admin portal
    if (!(user?.role === 'super_admin' && roles.includes('admin'))) {
      return <Navigate to={ROUTES.UNAUTHORIZED} replace />
    }
  }

  return children || <Outlet />
}

export function GuestOnlyRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth()

  if (loading) return <PageLoader label="Loading…" />

  if (isAuthenticated) {
    return <Navigate to={getHomePathForRole(user?.role)} replace />
  }

  return children || <Outlet />
}

export function RoleRoute({ roles, children }) {
  return <ProtectedRoute roles={roles}>{children}</ProtectedRoute>
}
