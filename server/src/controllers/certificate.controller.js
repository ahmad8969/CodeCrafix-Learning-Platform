const certificateService = require('../services/certificate.service')
const verificationService = require('../services/verification.service')
const auditService = require('../services/audit.service')
const { asyncHandler, sendSuccess, ApiError } = require('../utils/helpers')
const { ctxFromReq } = require('../utils/curriculum-access')
const { ROLES } = require('../constants')
const Course = require('../models/Course')

const listTemplates = asyncHandler(async (req, res) => {
  const data = await certificateService.listTemplates(req.query)
  sendSuccess(res, data)
})

const getTemplate = asyncHandler(async (req, res) => {
  sendSuccess(res, await certificateService.getTemplate(req.params.id))
})

const createTemplate = asyncHandler(async (req, res) => {
  const data = await certificateService.createTemplate(req.body, req.user._id)
  await auditService.record(req, {
    action: 'certificate_template_created',
    resourceType: 'CertificateTemplate',
    resourceId: data._id,
  })
  sendSuccess(res, data, 'Template created', 201)
})

const updateTemplate = asyncHandler(async (req, res) => {
  const data = await certificateService.updateTemplate(req.params.id, req.body)
  await auditService.record(req, {
    action: 'certificate_template_updated',
    resourceType: 'CertificateTemplate',
    resourceId: data._id,
  })
  sendSuccess(res, data, 'Template updated')
})

const deleteTemplate = asyncHandler(async (req, res) => {
  const data = await certificateService.deleteTemplate(req.params.id)
  await auditService.record(req, {
    action: 'certificate_template_deleted',
    resourceType: 'CertificateTemplate',
    resourceId: req.params.id,
  })
  sendSuccess(res, data, 'Template deleted')
})

const getRule = asyncHandler(async (req, res) => {
  const data = await certificateService.getOrCreateRule(req.params.courseId, {
    moduleId: req.query.moduleId || null,
    type: req.query.type,
  })
  sendSuccess(res, data)
})

const saveRule = asyncHandler(async (req, res) => {
  const data = await certificateService.saveRule(req.params.courseId, req.body, req.user._id)
  await auditService.record(req, {
    action: 'certificate_rule_updated',
    resourceType: 'CertificateRule',
    resourceId: data._id,
    newValue: req.body,
  })
  sendSuccess(res, data, 'Rules saved')
})

const checkEligibility = asyncHandler(async (req, res) => {
  const isStaff = [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.TEACHER].includes(req.user.role)
  const studentId = isStaff && req.query.studentId ? req.query.studentId : req.user._id
  if (!isStaff && req.query.studentId && String(req.query.studentId) !== String(req.user._id)) {
    throw new ApiError(403, 'You can only check your own eligibility')
  }
  const rule = await certificateService.getOrCreateRule(req.params.courseId, {
    moduleId: req.query.moduleId,
    type: req.query.type,
  })
  const data = await certificateService.evaluateEligibility(studentId, req.params.courseId, rule)
  sendSuccess(res, data)
})

const listCertificates = asyncHandler(async (req, res) => {
  const ctx = ctxFromReq(req)
  const data = await certificateService.listCertificates(
    {
      ...req.query,
      userId: req.query.userId || (req.user.role === 'student' ? req.user._id : undefined),
    },
    { ...ctx, userId: req.user._id, role: req.user.role }
  )
  sendSuccess(res, data)
})

const getCertificate = asyncHandler(async (req, res) => {
  const data = await certificateService.getCertificate(req.params.id, {
    userId: req.user._id,
    role: req.user.role,
  })
  sendSuccess(res, data)
})

const issueCertificate = asyncHandler(async (req, res) => {
  const isAdmin = [ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(req.user.role)
  const isTeacher = req.user.role === ROLES.TEACHER
  const isStudent = req.user.role === ROLES.STUDENT

  let studentId = req.user._id
  if (isAdmin || isTeacher) {
    studentId = req.body.studentId || req.user._id
  } else if (isStudent && req.body.studentId && String(req.body.studentId) !== String(req.user._id)) {
    throw new ApiError(403, 'Students can only request their own certificates')
  }

  if (isTeacher && String(studentId) !== String(req.user._id)) {
    const course = await Course.findById(req.body.courseId).select('instructor')
    if (!course || String(course.instructor) !== String(req.user._id)) {
      throw new ApiError(403, 'Teachers may only issue certificates for assigned courses')
    }
  }

  const data = await certificateService.issueCertificate({
    studentId,
    courseId: req.body.courseId,
    moduleId: req.body.moduleId,
    type: req.body.type,
    actorId: req.user._id,
    force: Boolean(req.body.force) && isAdmin,
  })
  await auditService.record(req, {
    action: 'certificate_issued_or_requested',
    resourceType: 'Certificate',
    resourceId: data._id,
    newValue: { status: data.status, number: data.certificateNumber },
  })
  sendSuccess(res, data, 'Certificate processed', 201)
})

const approveCertificate = asyncHandler(async (req, res) => {
  if (req.user.role === ROLES.TEACHER) {
    const Certificate = require('../models/Certificate').Certificate
    const pending = await Certificate.findById(req.params.id).select('course')
    if (!pending) throw new ApiError(404, 'Certificate not found')
    const course = await Course.findById(pending.course).select('instructor')
    if (!course || String(course.instructor) !== String(req.user._id)) {
      throw new ApiError(403, 'Teachers may only approve certificates for assigned courses')
    }
  }
  const data = await certificateService.approveCertificate(req.params.id, req.user._id)
  await auditService.record(req, {
    action: 'certificate_approved',
    resourceType: 'Certificate',
    resourceId: data._id,
  })
  sendSuccess(res, data, 'Certificate approved')
})

const revokeCertificate = asyncHandler(async (req, res) => {
  const data = await certificateService.revokeCertificate(
    req.params.id,
    req.body.reason,
    req.user._id
  )
  await auditService.record(req, {
    action: 'certificate_revoked',
    resourceType: 'Certificate',
    resourceId: data._id,
    newValue: { reason: req.body.reason },
  })
  sendSuccess(res, data, 'Certificate revoked')
})

const pendingApprovals = asyncHandler(async (req, res) => {
  sendSuccess(res, await certificateService.pendingApprovals(req.query))
})

const adminStats = asyncHandler(async (req, res) => {
  sendSuccess(res, await certificateService.adminStats())
})

const verifyPublic = asyncHandler(async (req, res) => {
  const token = req.params.token || req.query.token
  const number = req.query.number || req.body?.number
  const data = number
    ? await verificationService.verifyByNumber(number)
    : await verificationService.verifyByToken(token)
  sendSuccess(res, data)
})

module.exports = {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getRule,
  saveRule,
  checkEligibility,
  listCertificates,
  getCertificate,
  issueCertificate,
  approveCertificate,
  revokeCertificate,
  pendingApprovals,
  adminStats,
  verifyPublic,
}
