const express = require('express')
const controller = require('../../controllers/lesson.controller')
const learning = require('../../controllers/learning.controller')
const { protect } = require('../../middlewares/auth.middleware')
const { requirePermission, COURSE_PERMISSIONS } = require('../../middlewares/permission.middleware')
const { validate } = require('../../middlewares/validate.middleware')
const { lessonCreate, lessonUpdate, mongoId, reorderBody } = require('../../validators/curriculum.validator')
const { body } = require('express-validator')

const router = express.Router()
router.use(protect)

router.get('/', requirePermission(COURSE_PERMISSIONS.VIEW_CURRICULUM), controller.getAll)
router.get('/search/query', requirePermission(COURSE_PERMISSIONS.VIEW_CURRICULUM), learning.search)
router.post(
  '/reorder',
  requirePermission(COURSE_PERMISSIONS.MANAGE_CURRICULUM),
  reorderBody,
  body('topic').isMongoId(),
  validate,
  controller.reorder
)
router.post('/', requirePermission(COURSE_PERMISSIONS.MANAGE_CURRICULUM), lessonCreate, validate, controller.create)

router.get(
  '/:id/experience',
  requirePermission(COURSE_PERMISSIONS.VIEW_CURRICULUM),
  mongoId(),
  validate,
  learning.experience
)
router.get(
  '/:id/resources',
  requirePermission(COURSE_PERMISSIONS.VIEW_CURRICULUM),
  mongoId(),
  validate,
  learning.resources
)
router.get(
  '/:id/related',
  requirePermission(COURSE_PERMISSIONS.VIEW_CURRICULUM),
  mongoId(),
  validate,
  learning.related
)
router.post(
  '/:id/bookmark',
  requirePermission(COURSE_PERMISSIONS.BOOKMARK),
  mongoId(),
  validate,
  learning.addBookmark
)
router.delete(
  '/:id/bookmark',
  requirePermission(COURSE_PERMISSIONS.BOOKMARK),
  mongoId(),
  validate,
  learning.removeBookmark
)
router.post(
  '/:id/progress',
  requirePermission(COURSE_PERMISSIONS.VIEW_CURRICULUM),
  mongoId(),
  validate,
  learning.progress
)
router.get(
  '/:id/notes',
  requirePermission(COURSE_PERMISSIONS.NOTES),
  mongoId(),
  validate,
  learning.getNote
)
router.put(
  '/:id/notes',
  requirePermission(COURSE_PERMISSIONS.NOTES),
  mongoId(),
  validate,
  learning.upsertNote
)
router.delete(
  '/:id/notes',
  requirePermission(COURSE_PERMISSIONS.NOTES),
  mongoId(),
  validate,
  learning.deleteNote
)

router.get('/:id', requirePermission(COURSE_PERMISSIONS.VIEW_CURRICULUM), mongoId(), validate, controller.getOne)
router.patch(
  '/:id',
  requirePermission(COURSE_PERMISSIONS.MANAGE_CURRICULUM),
  lessonUpdate,
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
