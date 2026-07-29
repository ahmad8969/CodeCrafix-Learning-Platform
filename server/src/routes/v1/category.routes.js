const express = require('express')
const categoryController = require('../../controllers/category.controller')
const { protect } = require('../../middlewares/auth.middleware')
const { requirePermission, COURSE_PERMISSIONS } = require('../../middlewares/permission.middleware')
const { validate } = require('../../middlewares/validate.middleware')
const { categoryCreate, categoryUpdate, mongoId } = require('../../validators/course.validator')

const router = express.Router()

router.use(protect)

router.get('/', requirePermission(COURSE_PERMISSIONS.VIEW), categoryController.getAll)
router.get('/:id', requirePermission(COURSE_PERMISSIONS.VIEW), mongoId(), validate, categoryController.getOne)
router.post(
  '/',
  requirePermission(COURSE_PERMISSIONS.MANAGE_CATEGORY),
  categoryCreate,
  validate,
  categoryController.create
)
router.patch(
  '/:id',
  requirePermission(COURSE_PERMISSIONS.MANAGE_CATEGORY),
  categoryUpdate,
  validate,
  categoryController.update
)
router.delete(
  '/:id',
  requirePermission(COURSE_PERMISSIONS.MANAGE_CATEGORY),
  mongoId(),
  validate,
  categoryController.remove
)
router.post(
  '/:id/restore',
  requirePermission(COURSE_PERMISSIONS.MANAGE_CATEGORY),
  mongoId(),
  validate,
  categoryController.restore
)

module.exports = router
