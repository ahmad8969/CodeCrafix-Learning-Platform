const Course = require('../models/Course')
const Enrollment = require('../models/Enrollment')
const { ApiError } = require('../utils/helpers')
const { ROLES } = require('../constants')
const { ENROLLMENT_STATUS } = require('../constants/enrollment')

async function assertCourseAccess(courseId, reqContext = {}, { manage = false, requireEnrollment = false } = {}) {
  const course = await Course.findOne({ _id: courseId, deletedAt: null })
  if (!course) throw new ApiError(404, 'Course not found')

  if (reqContext.courseScope === 'assigned') {
    if (String(course.instructor) !== String(reqContext.assignedUserId)) {
      throw new ApiError(403, 'You can only access curriculum for assigned courses')
    }
  }

  if (reqContext.courseScope === 'published' && manage) {
    throw new ApiError(403, 'Students cannot manage curriculum')
  }

  if (
    requireEnrollment &&
    (reqContext.role === ROLES.STUDENT || reqContext.courseScope === 'published') &&
    reqContext.userId
  ) {
    const enrolled = await Enrollment.findOne({
      student: reqContext.userId,
      course: courseId,
      status: ENROLLMENT_STATUS.ACTIVE,
      deletedAt: null,
    }).lean()
    if (!enrolled) {
      throw new ApiError(403, 'You must be enrolled in this course')
    }
  }

  return course
}

function publishedFilter(reqContext) {
  if (reqContext?.courseScope === 'published') {
    return { status: 'published' }
  }
  return {}
}

function ctxFromReq(req) {
  return {
    courseScope: req.courseScope,
    assignedUserId: req.assignedUserId,
    userId: req.user?._id,
    role: req.user?.role,
  }
}

function isManagerRole(role) {
  return [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER].includes(role)
}

module.exports = {
  assertCourseAccess,
  publishedFilter,
  ctxFromReq,
  isManagerRole,
}
