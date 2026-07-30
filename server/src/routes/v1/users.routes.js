const express = require('express')
const User = require('../../models/User')
const { protect } = require('../../middlewares/auth.middleware')
const { requirePermission, COURSE_PERMISSIONS } = require('../../middlewares/permission.middleware')
const { asyncHandler, sendSuccess, ApiError } = require('../../utils/helpers')
const { ROLES } = require('../../constants')

const router = express.Router()

router.use(protect)

/** List instructors for course/batch assignment */
router.get(
  '/instructors',
  requirePermission(COURSE_PERMISSIONS.VIEW),
  asyncHandler(async (req, res) => {
    const users = await User.find({
      role: { $in: [ROLES.TEACHER, ROLES.ADMIN, ROLES.SUPER_ADMIN] },
      status: 'active',
    })
      .select('fullName email role profileImage')
      .sort({ fullName: 1 })
      .lean()
    sendSuccess(res, users)
  })
)

/** List students for admissions / finance / messaging directory */
router.get(
  '/students',
  requirePermission(COURSE_PERMISSIONS.COMM_VIEW),
  asyncHandler(async (req, res) => {
    const isStaff = [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.TEACHER].includes(req.user.role)
    if (!isStaff) throw new ApiError(403, 'Forbidden')
    const users = await User.find({
      role: ROLES.STUDENT,
      status: 'active',
    })
      .select('fullName email phoneNumber role profileImage status')
      .sort({ fullName: 1 })
      .limit(200)
      .lean()
    sendSuccess(res, users)
  })
)

module.exports = router
