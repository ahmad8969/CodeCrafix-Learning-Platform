export const APP_NAME = 'CodeCrafters'
export const APP_TAGLINE = 'Learning Platform'

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
}

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  teacher: 'Teacher',
  student: 'Student',
}

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  CHANGE_PASSWORD: '/change-password',
  UNAUTHORIZED: '/unauthorized',
  NOT_FOUND: '/404',
  SERVER_ERROR: '/500',
  OFFLINE: '/offline',
  SETTINGS: '/settings',
  SUPER_ADMIN: '/super-admin',
  ADMIN: '/admin',
  TEACHER: '/teacher',
  STUDENT: '/student',
}

export function getHomePathForRole(role) {
  switch (role) {
    case ROLES.SUPER_ADMIN:
      return ROUTES.SUPER_ADMIN
    case ROLES.ADMIN:
      return ROUTES.ADMIN
    case ROLES.TEACHER:
      return ROUTES.TEACHER
    case ROLES.STUDENT:
    default:
      return ROUTES.STUDENT
  }
}

export const ACCESS_TOKEN_KEY = 'codecrafters-access-token'
