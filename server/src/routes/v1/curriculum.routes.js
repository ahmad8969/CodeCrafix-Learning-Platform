const express = require('express')
const controller = require('../../controllers/curriculum.controller')
const { protect } = require('../../middlewares/auth.middleware')
const { requirePermission, COURSE_PERMISSIONS } = require('../../middlewares/permission.middleware')
const { validate } = require('../../middlewares/validate.middleware')
const { param } = require('express-validator')

const router = express.Router({ mergeParams: true })
router.use(protect)

const courseId = param('courseId').isMongoId().withMessage('Invalid course id')

router.get(
  '/tree',
  requirePermission(COURSE_PERMISSIONS.VIEW_CURRICULUM),
  courseId,
  validate,
  controller.tree
)
router.get(
  '/search',
  requirePermission(COURSE_PERMISSIONS.VIEW_CURRICULUM),
  courseId,
  validate,
  controller.search
)
router.get(
  '/stats',
  requirePermission(COURSE_PERMISSIONS.VIEW_CURRICULUM),
  courseId,
  validate,
  controller.stats
)

module.exports = router
