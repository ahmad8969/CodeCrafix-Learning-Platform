import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  Users,
  Shield,
  Settings,
  BarChart3,
  GraduationCap,
} from 'lucide-react'
import { ROLES, ROUTES } from '@/constants'

/** Role-based sidebar menus — module pages are placeholders only. */
export const ROLE_MENUS = {
  [ROLES.STUDENT]: [
    { to: ROUTES.STUDENT, label: 'Overview', icon: LayoutDashboard, end: true },
    { to: `${ROUTES.STUDENT}/courses`, label: 'Courses', icon: BookOpen },
    { to: `${ROUTES.STUDENT}/assignments`, label: 'Assignments', icon: ClipboardList },
  ],
  [ROLES.TEACHER]: [
    { to: ROUTES.TEACHER, label: 'Overview', icon: LayoutDashboard, end: true },
    { to: `${ROUTES.TEACHER}/classes`, label: 'Classes', icon: Users },
    { to: `${ROUTES.TEACHER}/reviews`, label: 'Reviews', icon: ClipboardList },
  ],
  [ROLES.ADMIN]: [
    { to: ROUTES.ADMIN, label: 'Overview', icon: LayoutDashboard, end: true },
    { to: `${ROUTES.ADMIN}/users`, label: 'Users', icon: Users },
    { to: `${ROUTES.ADMIN}/system`, label: 'System', icon: Shield },
  ],
  [ROLES.SUPER_ADMIN]: [
    { to: ROUTES.SUPER_ADMIN, label: 'Overview', icon: LayoutDashboard, end: true },
    { to: `${ROUTES.SUPER_ADMIN}/admins`, label: 'Admins', icon: Shield },
    { to: `${ROUTES.SUPER_ADMIN}/users`, label: 'All Users', icon: Users },
    { to: `${ROUTES.SUPER_ADMIN}/analytics`, label: 'Analytics', icon: BarChart3 },
    { to: `${ROUTES.SUPER_ADMIN}/courses`, label: 'Courses', icon: GraduationCap },
    { to: ROUTES.SETTINGS, label: 'Settings', icon: Settings },
  ],
}

export function getMenuForRole(role) {
  return ROLE_MENUS[role] || ROLE_MENUS[ROLES.STUDENT]
}

export function canAccessRolePath(userRole, path) {
  if (!userRole) return false
  if (userRole === ROLES.SUPER_ADMIN) return true

  if (path.startsWith(ROUTES.SUPER_ADMIN)) return userRole === ROLES.SUPER_ADMIN
  if (path.startsWith(ROUTES.ADMIN)) return userRole === ROLES.ADMIN || userRole === ROLES.SUPER_ADMIN
  if (path.startsWith(ROUTES.TEACHER)) {
    return [ROLES.TEACHER, ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(userRole)
  }
  if (path.startsWith(ROUTES.STUDENT)) {
    return userRole === ROLES.STUDENT || userRole === ROLES.SUPER_ADMIN
  }
  return true
}
