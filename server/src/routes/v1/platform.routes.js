const express = require('express')
const controller = require('../../controllers/platform.controller')
const { protect, authorize } = require('../../middlewares/auth.middleware')
const { validate } = require('../../middlewares/validate.middleware')
const { body, param, query } = require('express-validator')
const { ROLES } = require('../../constants')

const router = express.Router()

router.get('/architecture', protect, controller.getArchitecture)
router.get('/languages', protect, controller.getLanguages)
router.get('/feature-flags', protect, controller.getFeatureFlags)
router.patch(
  '/feature-flags',
  protect,
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  body('key').isString().notEmpty(),
  body('enabled').isBoolean(),
  validate,
  controller.updateFeatureFlag
)
router.get('/plugins', protect, controller.getPlugins)

router.get(
  '/audit-logs',
  protect,
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  query('page').optional().isInt({ min: 1 }),
  validate,
  controller.listAuditLogs
)

router.get('/notifications', protect, controller.listNotifications)
router.post('/notifications/:id/read', protect, param('id').isMongoId(), validate, controller.markNotificationRead)

router.post(
  '/progress',
  protect,
  body('eventType').isString().notEmpty(),
  validate,
  controller.trackProgress
)
router.get('/progress/summary', protect, controller.progressSummary)

router.get('/ai/catalog', protect, controller.aiCatalog)
router.post(
  '/ai/actions',
  protect,
  body('action').isString().notEmpty(),
  validate,
  controller.aiAction
)

router.post(
  '/offline/sync',
  protect,
  body('ops').isArray({ min: 1 }),
  validate,
  controller.offlineSync
)

router.post('/evaluate', protect, controller.evaluateStub)
router.post('/execute', protect, controller.executeStub)

module.exports = router
