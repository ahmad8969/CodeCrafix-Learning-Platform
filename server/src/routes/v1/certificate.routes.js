const express = require('express')
const controller = require('../../controllers/certificate.controller')
const { protect } = require('../../middlewares/auth.middleware')
const { requirePermission, COURSE_PERMISSIONS } = require('../../middlewares/permission.middleware')
const { validate } = require('../../middlewares/validate.middleware')
const { publicVerifyLimiter } = require('../../middlewares/rate-limit.middleware')
const {
  mongoId,
  templateRules,
  ruleRules,
  issueRules,
  listRules,
} = require('../../validators/certificate.validator')

const router = express.Router()

// Public verification (no auth)
router.get('/verify/:token', publicVerifyLimiter, controller.verifyPublic)
router.get('/verify', publicVerifyLimiter, controller.verifyPublic)
router.post('/verify', publicVerifyLimiter, controller.verifyPublic)

router.use(protect)

router.get('/admin/stats', requirePermission(COURSE_PERMISSIONS.CERTIFICATE_MANAGE), controller.adminStats)
router.get(
  '/pending',
  requirePermission(COURSE_PERMISSIONS.CERTIFICATE_APPROVE),
  controller.pendingApprovals
)

router.get('/templates', requirePermission(COURSE_PERMISSIONS.CERTIFICATE_VIEW), controller.listTemplates)
router.post(
  '/templates',
  requirePermission(COURSE_PERMISSIONS.CERTIFICATE_MANAGE),
  templateRules,
  validate,
  controller.createTemplate
)
router.get(
  '/templates/:id',
  requirePermission(COURSE_PERMISSIONS.CERTIFICATE_VIEW),
  mongoId('id'),
  validate,
  controller.getTemplate
)
router.patch(
  '/templates/:id',
  requirePermission(COURSE_PERMISSIONS.CERTIFICATE_MANAGE),
  mongoId('id'),
  validate,
  controller.updateTemplate
)
router.delete(
  '/templates/:id',
  requirePermission(COURSE_PERMISSIONS.CERTIFICATE_MANAGE),
  mongoId('id'),
  validate,
  controller.deleteTemplate
)

router.get(
  '/rules/:courseId',
  requirePermission(COURSE_PERMISSIONS.CERTIFICATE_VIEW),
  mongoId('courseId'),
  validate,
  controller.getRule
)
router.put(
  '/rules/:courseId',
  requirePermission(COURSE_PERMISSIONS.CERTIFICATE_MANAGE),
  mongoId('courseId'),
  ruleRules,
  validate,
  controller.saveRule
)
router.get(
  '/eligibility/:courseId',
  requirePermission(COURSE_PERMISSIONS.CERTIFICATE_VIEW),
  mongoId('courseId'),
  validate,
  controller.checkEligibility
)

router.get('/', requirePermission(COURSE_PERMISSIONS.CERTIFICATE_VIEW), listRules, validate, controller.listCertificates)
router.post(
  '/issue',
  requirePermission(COURSE_PERMISSIONS.CERTIFICATE_ISSUE),
  issueRules,
  validate,
  controller.issueCertificate
)
router.post(
  '/:id/approve',
  requirePermission(COURSE_PERMISSIONS.CERTIFICATE_APPROVE),
  mongoId('id'),
  validate,
  controller.approveCertificate
)
router.post(
  '/:id/revoke',
  requirePermission(COURSE_PERMISSIONS.CERTIFICATE_MANAGE),
  mongoId('id'),
  validate,
  controller.revokeCertificate
)
router.get(
  '/:id',
  requirePermission(COURSE_PERMISSIONS.CERTIFICATE_VIEW),
  mongoId('id'),
  validate,
  controller.getCertificate
)

module.exports = router
