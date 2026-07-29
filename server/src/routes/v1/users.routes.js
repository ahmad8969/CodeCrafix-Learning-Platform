const express = require('express')
const User = require('../../models/User')
const { protect } = require('../../middlewares/auth.middleware')
const { requirePermission, COURSE_PERMISSIONS } = require('../../middlewares/permission.middleware')
const { asyncHandler, sendSuccess } = require('../../utils/helpers')
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

module.exports = router
