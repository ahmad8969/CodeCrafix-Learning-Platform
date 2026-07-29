module.exports = {
  APP_NAME: 'CodeCrafters Learning Platform',
  API_VERSION: 'v1',
  ROLES: Object.freeze({
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    TEACHER: 'teacher',
    STUDENT: 'student',
  }),
  USER_STATUS: Object.freeze({
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended',
  }),
  ROLE_HIERARCHY: Object.freeze({
    super_admin: ['super_admin', 'admin', 'teacher', 'student'],
    admin: ['admin', 'teacher', 'student'],
    teacher: ['teacher'],
    student: ['student'],
  }),
}
