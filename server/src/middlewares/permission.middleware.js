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
  PRACTICE_SOLVE: 'practice:solve',
  PRACTICE_MANAGE: 'practice:manage',
  ASSIGNMENT_SUBMIT: 'assignment:submit',
  ASSIGNMENT_MANAGE: 'assignment:manage',
  QUIZ_TAKE: 'quiz:take',
  QUIZ_MANAGE: 'quiz:manage',
  ENROLLMENT_VIEW: 'enrollment:view',
  ENROLLMENT_MANAGE: 'enrollment:manage',
  LIVE_CLASS_VIEW: 'live_class:view',
  LIVE_CLASS_MANAGE: 'live_class:manage',
  ATTENDANCE_VIEW: 'attendance:view',
  ATTENDANCE_MANAGE: 'attendance:manage',
  ANNOUNCEMENT_VIEW: 'announcement:view',
  ANNOUNCEMENT_MANAGE: 'announcement:manage',
  CERTIFICATE_VIEW: 'certificate:view',
  CERTIFICATE_ISSUE: 'certificate:issue',
  CERTIFICATE_MANAGE: 'certificate:manage',
  CERTIFICATE_APPROVE: 'certificate:approve',
  GAMIFICATION_VIEW: 'gamification:view',
  GAMIFICATION_MANAGE: 'gamification:manage',
  FINANCE_VIEW: 'finance:view',
  FINANCE_MANAGE: 'finance:manage',
  FINANCE_COLLECT: 'finance:collect',
  COMM_VIEW: 'comm:view',
  COMM_MANAGE: 'comm:manage',
  HELPDESK_VIEW: 'helpdesk:view',
  HELPDESK_MANAGE: 'helpdesk:manage',
  CRM_MANAGE: 'crm:manage',
  CAREER_VIEW: 'career:view',
  CAREER_MANAGE: 'career:manage',
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
    COURSE_PERMISSIONS.PRACTICE_SOLVE,
    COURSE_PERMISSIONS.PRACTICE_MANAGE,
    COURSE_PERMISSIONS.ASSIGNMENT_SUBMIT,
    COURSE_PERMISSIONS.ASSIGNMENT_MANAGE,
    COURSE_PERMISSIONS.QUIZ_TAKE,
    COURSE_PERMISSIONS.QUIZ_MANAGE,
    COURSE_PERMISSIONS.MANAGE_BATCH,
    COURSE_PERMISSIONS.ENROLLMENT_VIEW,
    COURSE_PERMISSIONS.ENROLLMENT_MANAGE,
    COURSE_PERMISSIONS.LIVE_CLASS_VIEW,
    COURSE_PERMISSIONS.LIVE_CLASS_MANAGE,
    COURSE_PERMISSIONS.ATTENDANCE_VIEW,
    COURSE_PERMISSIONS.ATTENDANCE_MANAGE,
    COURSE_PERMISSIONS.ANNOUNCEMENT_VIEW,
    COURSE_PERMISSIONS.ANNOUNCEMENT_MANAGE,
    COURSE_PERMISSIONS.CERTIFICATE_VIEW,
    COURSE_PERMISSIONS.CERTIFICATE_ISSUE,
    COURSE_PERMISSIONS.CERTIFICATE_APPROVE,
    COURSE_PERMISSIONS.GAMIFICATION_VIEW,
    COURSE_PERMISSIONS.FINANCE_VIEW,
    COURSE_PERMISSIONS.COMM_VIEW,
    COURSE_PERMISSIONS.COMM_MANAGE,
    COURSE_PERMISSIONS.HELPDESK_VIEW,
    COURSE_PERMISSIONS.HELPDESK_MANAGE,
    COURSE_PERMISSIONS.CAREER_VIEW,
    COURSE_PERMISSIONS.CAREER_MANAGE,
  ],
  [ROLES.STUDENT]: [
    COURSE_PERMISSIONS.VIEW,
    COURSE_PERMISSIONS.VIEW_CURRICULUM,
    COURSE_PERMISSIONS.BOOKMARK,
    COURSE_PERMISSIONS.NOTES,
    COURSE_PERMISSIONS.PRACTICE_SOLVE,
    COURSE_PERMISSIONS.ASSIGNMENT_SUBMIT,
    COURSE_PERMISSIONS.QUIZ_TAKE,
    COURSE_PERMISSIONS.ENROLLMENT_VIEW,
    COURSE_PERMISSIONS.LIVE_CLASS_VIEW,
    COURSE_PERMISSIONS.ATTENDANCE_VIEW,
    COURSE_PERMISSIONS.ANNOUNCEMENT_VIEW,
    COURSE_PERMISSIONS.CERTIFICATE_VIEW,
    COURSE_PERMISSIONS.CERTIFICATE_ISSUE,
    COURSE_PERMISSIONS.GAMIFICATION_VIEW,
    COURSE_PERMISSIONS.FINANCE_VIEW,
    COURSE_PERMISSIONS.COMM_VIEW,
    COURSE_PERMISSIONS.HELPDESK_VIEW,
    COURSE_PERMISSIONS.CAREER_VIEW,
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
