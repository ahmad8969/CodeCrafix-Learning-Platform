import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  Users,
  Shield,
  Settings,
  BarChart3,
  GraduationCap,
  FolderTree,
  Layers3,
} from 'lucide-react'
import { ROLES, ROUTES } from '@/constants'

export const NAV_BY_ROLE = {
  [ROLES.SUPER_ADMIN]: [
    { to: ROUTES.SUPER_ADMIN, label: 'Overview', icon: LayoutDashboard, end: true },
    { to: `${ROUTES.SUPER_ADMIN}/users`, label: 'All Users', icon: Users },
    { to: `${ROUTES.SUPER_ADMIN}/admins`, label: 'Admins', icon: Shield },
    { to: `${ROUTES.SUPER_ADMIN}/courses`, label: 'Courses', icon: BookOpen },
    { to: `${ROUTES.SUPER_ADMIN}/categories`, label: 'Categories', icon: FolderTree },
    { to: `${ROUTES.SUPER_ADMIN}/batches`, label: 'Batches', icon: Layers3 },
    { to: `${ROUTES.SUPER_ADMIN}/reports`, label: 'Reports', icon: BarChart3 },
    { to: `${ROUTES.SUPER_ADMIN}/system`, label: 'System', icon: Settings },
  ],
  [ROLES.ADMIN]: [
    { to: ROUTES.ADMIN, label: 'Overview', icon: LayoutDashboard, end: true },
    { to: `${ROUTES.ADMIN}/users`, label: 'Users', icon: Users },
    { to: `${ROUTES.ADMIN}/teachers`, label: 'Teachers', icon: GraduationCap },
    { to: `${ROUTES.ADMIN}/courses`, label: 'Courses', icon: BookOpen },
    { to: `${ROUTES.ADMIN}/categories`, label: 'Categories', icon: FolderTree },
    { to: `${ROUTES.ADMIN}/batches`, label: 'Batches', icon: Layers3 },
    { to: `${ROUTES.ADMIN}/system`, label: 'System', icon: Shield },
  ],
  [ROLES.TEACHER]: [
    { to: ROUTES.TEACHER, label: 'Overview', icon: LayoutDashboard, end: true },
    { to: `${ROUTES.TEACHER}/classes`, label: 'Classes', icon: Users },
    { to: `${ROUTES.TEACHER}/reviews`, label: 'Reviews', icon: ClipboardList },
    { to: `${ROUTES.TEACHER}/courses`, label: 'Courses', icon: BookOpen },
  ],
  [ROLES.STUDENT]: [
    { to: ROUTES.STUDENT, label: 'Overview', icon: LayoutDashboard, end: true },
    { to: `${ROUTES.STUDENT}/courses`, label: 'Courses', icon: BookOpen },
    { to: `${ROUTES.STUDENT}/assignments`, label: 'Assignments', icon: ClipboardList },
  ],
}

export function getNavForRole(role) {
  return NAV_BY_ROLE[role] || NAV_BY_ROLE[ROLES.STUDENT]
}
