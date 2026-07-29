const express = require('express')
const controller = require('../../controllers/enrollment.controller')
const { protect } = require('../../middlewares/auth.middleware')
const { requirePermission, COURSE_PERMISSIONS } = require('../../middlewares/permission.middleware')
const { validate } = require('../../middlewares/validate.middleware')
const {
  createRules,
  bulkRules,
  transferBatchRules,
  codeRules,
  unlockRules,
  listRules,
  mongoId,
} = require('../../validators/enrollment.validator')

const router = express.Router()
router.use(protect)

router.get('/analytics', requirePermission(COURSE_PERMISSIONS.ENROLLMENT_MANAGE), controller.analytics)
router.get('/continue', requirePermission(COURSE_PERMISSIONS.ENROLLMENT_VIEW), controller.myContinue)
router.get('/timeline', requirePermission(COURSE_PERMISSIONS.ENROLLMENT_VIEW), controller.timeline)
router.get('/profile/me', requirePermission(COURSE_PERMISSIONS.ENROLLMENT_VIEW), controller.studentProfile)
router.patch('/profile/me', requirePermission(COURSE_PERMISSIONS.ENROLLMENT_VIEW), controller.updateProfile)
router.get(
  '/profile/:studentId',
  requirePermission(COURSE_PERMISSIONS.ENROLLMENT_MANAGE),
  mongoId('studentId'),
  validate,
  controller.studentProfile
)

router.get(
  '/reports/batch/:batchId',
  requirePermission(COURSE_PERMISSIONS.ENROLLMENT_MANAGE),
  mongoId('batchId'),
  validate,
  controller.batchReport
)
router.get(
  '/reports/course/:courseId',
  requirePermission(COURSE_PERMISSIONS.ENROLLMENT_MANAGE),
  mongoId('courseId'),
  validate,
  controller.courseReport
)
router.get('/reports/teacher', requirePermission(COURSE_PERMISSIONS.ENROLLMENT_MANAGE), controller.teacherReport)
router.get(
  '/reports/teacher/:teacherId',
  requirePermission(COURSE_PERMISSIONS.ENROLLMENT_MANAGE),
  mongoId('teacherId'),
  validate,
  controller.teacherReport
)
router.get(
  '/progress/:studentId/:courseId',
  requirePermission(COURSE_PERMISSIONS.ENROLLMENT_VIEW),
  mongoId('studentId'),
  mongoId('courseId'),
  validate,
  controller.progressReport
)
router.get(
  '/learning-path/:courseId',
  requirePermission(COURSE_PERMISSIONS.ENROLLMENT_VIEW),
  mongoId('courseId'),
  validate,
  controller.learningPathGet
)
router.get(
  '/topics/:topicId/access',
  requirePermission(COURSE_PERMISSIONS.ENROLLMENT_VIEW),
  mongoId('topicId'),
  validate,
  controller.evaluateTopic
)
router.post(
  '/topics/unlock',
  requirePermission(COURSE_PERMISSIONS.ENROLLMENT_MANAGE),
  unlockRules,
  validate,
  controller.unlockTopic
)

router.post(
  '/self',
  requirePermission(COURSE_PERMISSIONS.ENROLLMENT_VIEW),
  createRules,
  validate,
  controller.selfEnroll
)
router.post(
  '/code',
  requirePermission(COURSE_PERMISSIONS.ENROLLMENT_VIEW),
  codeRules,
  validate,
  controller.enrollByCode
)
router.post(
  '/bulk',
  requirePermission(COURSE_PERMISSIONS.ENROLLMENT_MANAGE),
  bulkRules,
  validate,
  controller.bulk
)

router.get('/', requirePermission(COURSE_PERMISSIONS.ENROLLMENT_VIEW), listRules, validate, controller.list)
router.post('/', requirePermission(COURSE_PERMISSIONS.ENROLLMENT_MANAGE), createRules, validate, controller.create)

router.post('/:id/approve', requirePermission(COURSE_PERMISSIONS.ENROLLMENT_MANAGE), mongoId('id'), validate, controller.approve)
router.post('/:id/reject', requirePermission(COURSE_PERMISSIONS.ENROLLMENT_MANAGE), mongoId('id'), validate, controller.reject)
router.post('/:id/withdraw', requirePermission(COURSE_PERMISSIONS.ENROLLMENT_MANAGE), mongoId('id'), validate, controller.withdraw)
router.post(
  '/:id/transfer-batch',
  requirePermission(COURSE_PERMISSIONS.ENROLLMENT_MANAGE),
  transferBatchRules,
  validate,
  controller.transferBatch
)
router.post(
  '/:id/transfer-course',
  requirePermission(COURSE_PERMISSIONS.ENROLLMENT_MANAGE),
  mongoId('id'),
  validate,
  controller.transferCourse
)

router.get('/:id', requirePermission(COURSE_PERMISSIONS.ENROLLMENT_VIEW), mongoId('id'), validate, controller.get)

module.exports = router
