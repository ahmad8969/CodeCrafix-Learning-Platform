const express = require('express')
const controller = require('../../controllers/assignment.controller')
const { protect } = require('../../middlewares/auth.middleware')
const { requirePermission, COURSE_PERMISSIONS } = require('../../middlewares/permission.middleware')
const { validate } = require('../../middlewares/validate.middleware')
const { param } = require('express-validator')
const { createAssignmentUpload } = require('../../middlewares/upload.middleware')
const {
  createRules,
  updateRules,
  gradeRules,
  listRules,
  mongoId,
} = require('../../validators/assignment.validator')

const router = express.Router()
router.use(protect)

const upload = createAssignmentUpload()

router.get('/dashboard/student', requirePermission(COURSE_PERMISSIONS.VIEW_CURRICULUM), controller.studentDash)
router.get('/dashboard/teacher', requirePermission(COURSE_PERMISSIONS.MANAGE_CURRICULUM), controller.teacherDash)
router.get('/dashboard/admin', requirePermission(COURSE_PERMISSIONS.MANAGE_CURRICULUM), controller.adminDash)
router.get('/analytics', requirePermission(COURSE_PERMISSIONS.MANAGE_CURRICULUM), controller.analytics)

router.post(
  '/upload',
  requirePermission(COURSE_PERMISSIONS.VIEW_CURRICULUM),
  upload.array('files', 10),
  controller.uploadOnly
)

router.get(
  '/submissions/:submissionId',
  requirePermission(COURSE_PERMISSIONS.VIEW_CURRICULUM),
  param('submissionId').isMongoId(),
  validate,
  controller.getSubmission
)
router.post(
  '/submissions/:submissionId/grade',
  requirePermission(COURSE_PERMISSIONS.MANAGE_CURRICULUM),
  gradeRules,
  validate,
  controller.grade
)

router.get(
  '/',
  requirePermission(COURSE_PERMISSIONS.VIEW_CURRICULUM),
  listRules,
  validate,
  controller.list
)
router.post(
  '/',
  requirePermission(COURSE_PERMISSIONS.MANAGE_CURRICULUM),
  createRules,
  validate,
  controller.create
)

router.get(
  '/:id/history',
  requirePermission(COURSE_PERMISSIONS.VIEW_CURRICULUM),
  mongoId('id'),
  validate,
  controller.history
)
router.get(
  '/:id/submissions',
  requirePermission(COURSE_PERMISSIONS.MANAGE_CURRICULUM),
  mongoId('id'),
  validate,
  controller.listSubmissions
)
router.post(
  '/:id/draft',
  requirePermission(COURSE_PERMISSIONS.VIEW_CURRICULUM),
  mongoId('id'),
  validate,
  controller.draft
)
router.post(
  '/:id/submit',
  requirePermission(COURSE_PERMISSIONS.VIEW_CURRICULUM),
  mongoId('id'),
  upload.array('files', 10),
  validate,
  controller.submit
)
router.post(
  '/:id/resubmit',
  requirePermission(COURSE_PERMISSIONS.VIEW_CURRICULUM),
  mongoId('id'),
  upload.array('files', 10),
  validate,
  controller.resubmit
)
router.post(
  '/:id/publish',
  requirePermission(COURSE_PERMISSIONS.MANAGE_CURRICULUM),
  mongoId('id'),
  validate,
  controller.publish
)
router.post(
  '/:id/archive',
  requirePermission(COURSE_PERMISSIONS.MANAGE_CURRICULUM),
  mongoId('id'),
  validate,
  controller.archive
)
router.post(
  '/:id/restore',
  requirePermission(COURSE_PERMISSIONS.MANAGE_CURRICULUM),
  mongoId('id'),
  validate,
  controller.restore
)
router.patch(
  '/:id/rubrics',
  requirePermission(COURSE_PERMISSIONS.MANAGE_CURRICULUM),
  mongoId('id'),
  validate,
  controller.updateRubrics
)

router.get(
  '/:id',
  requirePermission(COURSE_PERMISSIONS.VIEW_CURRICULUM),
  mongoId('id'),
  validate,
  controller.get
)
router.patch(
  '/:id',
  requirePermission(COURSE_PERMISSIONS.MANAGE_CURRICULUM),
  updateRules,
  validate,
  controller.update
)
router.delete(
  '/:id',
  requirePermission(COURSE_PERMISSIONS.MANAGE_CURRICULUM),
  mongoId('id'),
  validate,
  controller.remove
)

module.exports = router
