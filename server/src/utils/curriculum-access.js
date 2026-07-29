const Course = require('../models/Course')
const { ApiError } = require('../utils/helpers')
const { ROLES } = require('../constants')

async function assertCourseAccess(courseId, reqContext = {}, { manage = false } = {}) {
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
