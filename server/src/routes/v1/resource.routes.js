const express = require('express')
const controller = require('../../controllers/resource.controller')
const { protect } = require('../../middlewares/auth.middleware')
const { requirePermission, COURSE_PERMISSIONS } = require('../../middlewares/permission.middleware')
const { validate } = require('../../middlewares/validate.middleware')
const { resourceCreate, resourceUpdate, mongoId, reorderBody } = require('../../validators/curriculum.validator')
const { body } = require('express-validator')

const router = express.Router()
router.use(protect)

router.get('/', requirePermission(COURSE_PERMISSIONS.VIEW_CURRICULUM), controller.getAll)
router.post(
  '/reorder',
  requirePermission(COURSE_PERMISSIONS.MANAGE_CURRICULUM),
  reorderBody,
  body('lesson').isMongoId(),
  validate,
  controller.reorder
)
router.post('/', requirePermission(COURSE_PERMISSIONS.MANAGE_CURRICULUM), resourceCreate, validate, controller.create)
router.get('/:id', requirePermission(COURSE_PERMISSIONS.VIEW_CURRICULUM), mongoId(), validate, controller.getOne)
router.patch(
  '/:id',
  requirePermission(COURSE_PERMISSIONS.MANAGE_CURRICULUM),
  resourceUpdate,
  validate,
  controller.update
)
router.delete(
  '/:id',
  requirePermission(COURSE_PERMISSIONS.MANAGE_CURRICULUM),
  mongoId(),
  validate,
  controller.remove
)
router.post(
  '/:id/restore',
  requirePermission(COURSE_PERMISSIONS.MANAGE_CURRICULUM),
  mongoId(),
  validate,
  controller.restore
)

module.exports = router
