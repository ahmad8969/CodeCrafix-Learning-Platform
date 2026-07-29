const express = require('express')
const { param } = require('express-validator')
const controller = require('../../controllers/quiz.controller')
const { protect } = require('../../middlewares/auth.middleware')
const { requirePermission, COURSE_PERMISSIONS } = require('../../middlewares/permission.middleware')
const { validate } = require('../../middlewares/validate.middleware')
const {
  createRules,
  updateRules,
  attemptProgressRules,
  listRules,
  mongoId,
} = require('../../validators/quiz.validator')

const router = express.Router()
router.use(protect)

router.get('/dashboard/student', requirePermission(COURSE_PERMISSIONS.QUIZ_TAKE), controller.studentDash)
router.get('/dashboard/teacher', requirePermission(COURSE_PERMISSIONS.QUIZ_MANAGE), controller.teacherDash)
router.get('/analytics', requirePermission(COURSE_PERMISSIONS.QUIZ_MANAGE), controller.analytics)
router.get('/pool', requirePermission(COURSE_PERMISSIONS.QUIZ_MANAGE), controller.pool)

router.get(
  '/attempts/:attemptId',
  requirePermission(COURSE_PERMISSIONS.QUIZ_TAKE),
  param('attemptId').isMongoId(),
  validate,
  controller.getAttempt
)
router.post(
  '/attempts/:attemptId/progress',
  requirePermission(COURSE_PERMISSIONS.QUIZ_TAKE),
  attemptProgressRules,
  validate,
  controller.saveProgress
)
router.post(
  '/attempts/:attemptId/submit',
  requirePermission(COURSE_PERMISSIONS.QUIZ_TAKE),
  attemptProgressRules,
  validate,
  controller.submit
)

router.get('/', requirePermission(COURSE_PERMISSIONS.QUIZ_TAKE), listRules, validate, controller.list)
router.post('/', requirePermission(COURSE_PERMISSIONS.QUIZ_MANAGE), createRules, validate, controller.create)

router.post('/:id/publish', requirePermission(COURSE_PERMISSIONS.QUIZ_MANAGE), mongoId('id'), validate, controller.publish)
router.post('/:id/archive', requirePermission(COURSE_PERMISSIONS.QUIZ_MANAGE), mongoId('id'), validate, controller.archive)
router.post('/:id/restore', requirePermission(COURSE_PERMISSIONS.QUIZ_MANAGE), mongoId('id'), validate, controller.restore)
router.post('/:id/duplicate', requirePermission(COURSE_PERMISSIONS.QUIZ_MANAGE), mongoId('id'), validate, controller.duplicate)
router.post('/:id/start', requirePermission(COURSE_PERMISSIONS.QUIZ_TAKE), mongoId('id'), validate, controller.start)
router.get('/:id/attempts', requirePermission(COURSE_PERMISSIONS.QUIZ_MANAGE), mongoId('id'), validate, controller.listAttempts)
router.get('/:id/history', requirePermission(COURSE_PERMISSIONS.QUIZ_TAKE), mongoId('id'), validate, controller.myHistory)
router.get('/:id/leaderboard', requirePermission(COURSE_PERMISSIONS.QUIZ_TAKE), mongoId('id'), validate, controller.leaderboard)

router.get('/:id', requirePermission(COURSE_PERMISSIONS.QUIZ_TAKE), mongoId('id'), validate, controller.get)
router.patch('/:id', requirePermission(COURSE_PERMISSIONS.QUIZ_MANAGE), updateRules, validate, controller.update)
router.delete('/:id', requirePermission(COURSE_PERMISSIONS.QUIZ_MANAGE), mongoId('id'), validate, controller.remove)

module.exports = router
