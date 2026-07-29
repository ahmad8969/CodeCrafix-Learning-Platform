const express = require('express')
const { param } = require('express-validator')
const controller = require('../../controllers/practice.controller')
const { protect } = require('../../middlewares/auth.middleware')
const { requirePermission, COURSE_PERMISSIONS } = require('../../middlewares/permission.middleware')
const { validate } = require('../../middlewares/validate.middleware')
const {
  createQuestionRules,
  updateQuestionRules,
  runSubmitRules,
  assignRules,
  listRules,
  mongoId,
} = require('../../validators/practice.validator')

const router = express.Router()
router.use(protect)

router.get('/dashboard', requirePermission(COURSE_PERMISSIONS.VIEW_CURRICULUM), controller.studentDashboard)
router.get('/analytics', requirePermission(COURSE_PERMISSIONS.MANAGE_CURRICULUM), controller.analytics)
router.get('/leaderboard', requirePermission(COURSE_PERMISSIONS.VIEW_CURRICULUM), controller.leaderboard)
router.get('/categories', requirePermission(COURSE_PERMISSIONS.VIEW_CURRICULUM), controller.listCategories)
router.post('/categories', requirePermission(COURSE_PERMISSIONS.MANAGE_CURRICULUM), controller.upsertCategory)

router.get('/questions/export', requirePermission(COURSE_PERMISSIONS.MANAGE_CURRICULUM), controller.exportQuestions)
router.post('/questions/import', requirePermission(COURSE_PERMISSIONS.MANAGE_CURRICULUM), controller.importQuestions)

router.get(
  '/questions',
  requirePermission(COURSE_PERMISSIONS.VIEW_CURRICULUM),
  listRules,
  validate,
  controller.listQuestions
)
router.post(
  '/questions',
  requirePermission(COURSE_PERMISSIONS.MANAGE_CURRICULUM),
  createQuestionRules,
  validate,
  controller.createQuestion
)
router.get(
  '/questions/:id',
  requirePermission(COURSE_PERMISSIONS.VIEW_CURRICULUM),
  mongoId('id'),
  validate,
  controller.getQuestion
)
router.patch(
  '/questions/:id',
  requirePermission(COURSE_PERMISSIONS.MANAGE_CURRICULUM),
  updateQuestionRules,
  validate,
  controller.updateQuestion
)
router.delete(
  '/questions/:id',
  requirePermission(COURSE_PERMISSIONS.MANAGE_CURRICULUM),
  mongoId('id'),
  validate,
  controller.archiveQuestion
)
router.post(
  '/questions/:id/restore',
  requirePermission(COURSE_PERMISSIONS.MANAGE_CURRICULUM),
  mongoId('id'),
  validate,
  controller.restoreQuestion
)
router.post(
  '/questions/:id/clone',
  requirePermission(COURSE_PERMISSIONS.MANAGE_CURRICULUM),
  mongoId('id'),
  validate,
  controller.cloneQuestion
)

router.post(
  '/questions/:id/run',
  requirePermission(COURSE_PERMISSIONS.VIEW_CURRICULUM),
  runSubmitRules,
  validate,
  controller.runCode
)
router.post(
  '/questions/:id/submit',
  requirePermission(COURSE_PERMISSIONS.VIEW_CURRICULUM),
  runSubmitRules,
  validate,
  controller.submitCode
)
router.get(
  '/questions/:id/attempts',
  requirePermission(COURSE_PERMISSIONS.VIEW_CURRICULUM),
  mongoId('id'),
  validate,
  controller.attemptHistory
)
router.post(
  '/questions/:id/bookmark',
  requirePermission(COURSE_PERMISSIONS.BOOKMARK),
  mongoId('id'),
  validate,
  controller.bookmark
)

router.get(
  '/topics/:topicId/questions',
  requirePermission(COURSE_PERMISSIONS.VIEW_CURRICULUM),
  param('topicId').isMongoId(),
  validate,
  controller.listByTopic
)
router.post(
  '/topics/:topicId/assign',
  requirePermission(COURSE_PERMISSIONS.MANAGE_CURRICULUM),
  assignRules,
  validate,
  controller.assignToTopic
)

module.exports = router
