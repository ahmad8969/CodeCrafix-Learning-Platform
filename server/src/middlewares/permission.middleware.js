const { ROLES } = require('../constants')
const { ApiError } = require('../utils/helpers')

/**
 * Course + curriculum permissions
 * - super_admin / admin: full
 * - teacher: view assigned + manage curriculum for assigned courses
 * - student: view published curriculum only
 */
const COURSE_PERMISSIONS = Object.freeze({
  VIEW: 'course:view',
  CREATE: 'course:create',
  UPDATE: 'course:update',
  DELETE: 'course:delete',
  PUBLISH: 'course:publish',
  ARCHIVE: 'course:archive',
  MANAGE_CATEGORY: 'category:manage',
  MANAGE_BATCH: 'batch:manage',
  VIEW_CURRICULUM: 'curriculum:view',
  MANAGE_CURRICULUM: 'curriculum:manage',
  BOOKMARK: 'learning:bookmark',
  NOTES: 'learning:notes',
})

const ROLE_PERMISSIONS = Object.freeze({
  [ROLES.SUPER_ADMIN]: Object.values(COURSE_PERMISSIONS),
  [ROLES.ADMIN]: Object.values(COURSE_PERMISSIONS),
  [ROLES.TEACHER]: [
    COURSE_PERMISSIONS.VIEW,
    COURSE_PERMISSIONS.VIEW_CURRICULUM,
    COURSE_PERMISSIONS.MANAGE_CURRICULUM,
    COURSE_PERMISSIONS.BOOKMARK,
    COURSE_PERMISSIONS.NOTES,
  ],
  [ROLES.STUDENT]: [
    COURSE_PERMISSIONS.VIEW,
    COURSE_PERMISSIONS.VIEW_CURRICULUM,
    COURSE_PERMISSIONS.BOOKMARK,
    COURSE_PERMISSIONS.NOTES,
  ],
})

function hasPermission(role, permission) {
  return (ROLE_PERMISSIONS[role] || []).includes(permission)
}

function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, 'Authentication required'))
    if (!hasPermission(req.user.role, permission)) {
      return next(new ApiError(403, 'You do not have permission for this action'))
    }

    if (req.user.role === ROLES.TEACHER) {
      req.courseScope = 'assigned'
      req.assignedUserId = req.user._id
    } else if (req.user.role === ROLES.STUDENT) {
      req.courseScope = 'published'
      req.assignedUserId = null
    } else {
      req.courseScope = 'all'
    }

    next()
  }
}

function requireCourseAccess() {
  return requirePermission(COURSE_PERMISSIONS.VIEW)
}

module.exports = {
  COURSE_PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  requirePermission,
  requireCourseAccess,
}
