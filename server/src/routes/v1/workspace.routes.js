const express = require('express')
const controller = require('../../controllers/workspace.controller')
const { protect } = require('../../middlewares/auth.middleware')
const { requirePermission, COURSE_PERMISSIONS } = require('../../middlewares/permission.middleware')
const { validate } = require('../../middlewares/validate.middleware')
const { param, body, query } = require('express-validator')

const router = express.Router()
router.use(protect)

const lessonId = param('lessonId').isMongoId().withMessage('Invalid lesson id')

router.get(
  '/dashboard',
  requirePermission(COURSE_PERMISSIONS.VIEW_CURRICULUM),
  controller.codingDashboard
)

router.get(
  '/lessons/:lessonId',
  requirePermission(COURSE_PERMISSIONS.VIEW_CURRICULUM),
  lessonId,
  validate,
  controller.getWorkspace
)

router.get(
  '/lessons/:lessonId/starter',
  requirePermission(COURSE_PERMISSIONS.VIEW_CURRICULUM),
  lessonId,
  validate,
  controller.getStarter
)

router.post(
  '/lessons/:lessonId/save',
  requirePermission(COURSE_PERMISSIONS.VIEW_CURRICULUM),
  lessonId,
  body('files').isArray({ min: 1 }),
  body('files.*.path').isString().notEmpty(),
  body('activeFile').optional().isString(),
  body('codingTimeDelta').optional().isInt({ min: 0 }),
  body('source').optional().isIn(['manual', 'auto', 'upload']),
  body('label').optional().isString(),
  validate,
  controller.saveWorkspace
)

router.post(
  '/lessons/:lessonId/reset',
  requirePermission(COURSE_PERMISSIONS.VIEW_CURRICULUM),
  lessonId,
  validate,
  controller.resetWorkspace
)

router.get(
  '/lessons/:lessonId/versions',
  requirePermission(COURSE_PERMISSIONS.VIEW_CURRICULUM),
  lessonId,
  validate,
  controller.listVersions
)

router.get(
  '/lessons/:lessonId/versions/compare',
  requirePermission(COURSE_PERMISSIONS.VIEW_CURRICULUM),
  lessonId,
  query('a').isInt({ min: 1 }),
  query('b').isInt({ min: 1 }),
  validate,
  controller.compareVersions
)

router.get(
  '/lessons/:lessonId/versions/:version',
  requirePermission(COURSE_PERMISSIONS.VIEW_CURRICULUM),
  lessonId,
  param('version').isInt({ min: 1 }),
  validate,
  controller.getVersion
)

router.post(
  '/lessons/:lessonId/versions/:version/restore',
  requirePermission(COURSE_PERMISSIONS.VIEW_CURRICULUM),
  lessonId,
  param('version').isInt({ min: 1 }),
  validate,
  controller.restoreVersion
)

module.exports = router
