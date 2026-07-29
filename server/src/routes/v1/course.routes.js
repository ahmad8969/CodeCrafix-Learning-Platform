const express = require('express')
const courseController = require('../../controllers/course.controller')
const { protect } = require('../../middlewares/auth.middleware')
const { requirePermission, COURSE_PERMISSIONS } = require('../../middlewares/permission.middleware')
const { validate } = require('../../middlewares/validate.middleware')
const {
  courseCreate,
  courseUpdate,
  mongoId,
  bulkIds,
} = require('../../validators/course.validator')
const { body } = require('express-validator')
const { COURSE_STATUS } = require('../../constants')

const router = express.Router()

router.use(protect)

router.get('/stats/dashboard', requirePermission(COURSE_PERMISSIONS.VIEW), courseController.stats)
router.get('/', requirePermission(COURSE_PERMISSIONS.VIEW), courseController.getAll)
router.post(
  '/bulk/status',
  requirePermission(COURSE_PERMISSIONS.PUBLISH),
  bulkIds,
  body('status').isIn(Object.values(COURSE_STATUS)),
  validate,
  courseController.bulkStatus
)
router.post(
  '/bulk/delete',
  requirePermission(COURSE_PERMISSIONS.DELETE),
  bulkIds,
  validate,
  courseController.bulkDelete
)
router.post(
  '/',
  requirePermission(COURSE_PERMISSIONS.CREATE),
  courseCreate,
  validate,
  courseController.create
)

router.get('/:id', requirePermission(COURSE_PERMISSIONS.VIEW), mongoId(), validate, courseController.getOne)
router.patch(
  '/:id',
  requirePermission(COURSE_PERMISSIONS.UPDATE),
  courseUpdate,
  validate,
  courseController.update
)
router.delete(
  '/:id',
  requirePermission(COURSE_PERMISSIONS.DELETE),
  mongoId(),
  validate,
  courseController.remove
)
router.post(
  '/:id/restore',
  requirePermission(COURSE_PERMISSIONS.DELETE),
  mongoId(),
  validate,
  courseController.restore
)
router.post(
  '/:id/publish',
  requirePermission(COURSE_PERMISSIONS.PUBLISH),
  mongoId(),
  validate,
  courseController.publish
)
router.post(
  '/:id/archive',
  requirePermission(COURSE_PERMISSIONS.ARCHIVE),
  mongoId(),
  validate,
  courseController.archive
)
router.post(
  '/:id/feature',
  requirePermission(COURSE_PERMISSIONS.UPDATE),
  mongoId(),
  validate,
  courseController.feature
)

module.exports = router
