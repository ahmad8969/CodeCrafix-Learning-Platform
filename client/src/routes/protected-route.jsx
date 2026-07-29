import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { PageLoader } from '@/components/loaders'
import { ROUTES, getHomePathForRole } from '@/constants'
import { canAccessRolePath } from '@/constants/navigation'

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) return <PageLoader label="Checking session…" />

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />
  }

  return children || <Outlet />
}

export function RoleRoute({ allow = [], children }) {
  const { user, loading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (loading) return <PageLoader label="Checking permissions…" />

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />
  }

  const role = user?.role
  const allowed = allow.length === 0 || allow.includes(role) || role === 'super_admin'

  if (!allowed || !canAccessRolePath(role, location.pathname)) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />
  }

  return children || <Outlet />
}

export function GuestOnlyRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth()

  if (loading) return <PageLoader />

  if (isAuthenticated) {
    return <Navigate to={getHomePathForRole(user?.role)} replace />
  }

  return children || <Outlet />
}
