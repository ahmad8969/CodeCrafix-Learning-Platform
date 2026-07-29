const express = require('express')
const batchController = require('../../controllers/batch.controller')
const { protect } = require('../../middlewares/auth.middleware')
const { requirePermission, COURSE_PERMISSIONS } = require('../../middlewares/permission.middleware')
const { validate } = require('../../middlewares/validate.middleware')
const { batchCreate, batchUpdate, mongoId } = require('../../validators/course.validator')

const router = express.Router()

router.use(protect)

router.get('/', requirePermission(COURSE_PERMISSIONS.VIEW), batchController.getAll)
router.get('/:id', requirePermission(COURSE_PERMISSIONS.VIEW), mongoId(), validate, batchController.getOne)
router.post(
  '/',
  requirePermission(COURSE_PERMISSIONS.MANAGE_BATCH),
  batchCreate,
  validate,
  batchController.create
)
router.patch(
  '/:id',
  requirePermission(COURSE_PERMISSIONS.MANAGE_BATCH),
  batchUpdate,
  validate,
  batchController.update
)
router.delete(
  '/:id',
  requirePermission(COURSE_PERMISSIONS.MANAGE_BATCH),
  mongoId(),
  validate,
  batchController.remove
)
router.post(
  '/:id/restore',
  requirePermission(COURSE_PERMISSIONS.MANAGE_BATCH),
  mongoId(),
  validate,
  batchController.restore
)

module.exports = router
