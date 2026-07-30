const crypto = require('crypto')
const { Certificate, CertificateTemplate, CertificateRule } = require('../models/Certificate')
const User = require('../models/User')
const Course = require('../models/Course')
const Module = require('../models/Module')
const Enrollment = require('../models/Enrollment')
const { StudentProgress } = require('../models/StudentProgress')
const QuizAttempt = require('../models/QuizAttempt')
const AssignmentSubmission = require('../models/AssignmentSubmission')
const PracticeAttempt = require('../models/PracticeAttempt')
const { QUIZ_ATTEMPT_STATUS } = require('../constants/quiz')
const {
  CERTIFICATE_TYPES,
  CERTIFICATE_STATUS,
  APPROVAL_MODE,
  CERTIFICATE_NOTIFY,
} = require('../constants/certificate')
const config = require('../config')
const notificationService = require('./notification.service')
const { ApiError } = require('../utils/helpers')
const { ROLES } = require('../constants')

function newToken() {
  return crypto.randomBytes(24).toString('hex')
}

function certificateNumber(courseSlug = 'GEN') {
  const year = new Date().getFullYear()
  const slug = String(courseSlug || 'GEN')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8)
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase()
  return `CC-${year}-${slug}-${rand}`
}

async function listTemplates({ active } = {}) {
  const q = {}
  if (active != null) q.active = active === true || active === 'true'
  return CertificateTemplate.find(q).sort({ isDefault: -1, name: 1 }).lean()
}

async function getTemplate(id) {
  const t = await CertificateTemplate.findById(id).lean()
  if (!t) throw new ApiError(404, 'Template not found')
  return t
}

async function createTemplate(payload, userId) {
  if (payload.isDefault) {
    await CertificateTemplate.updateMany({}, { $set: { isDefault: false } })
  }
  return CertificateTemplate.create({ ...payload, createdBy: userId })
}

async function updateTemplate(id, payload) {
  if (payload.isDefault) {
    await CertificateTemplate.updateMany({ _id: { $ne: id } }, { $set: { isDefault: false } })
  }
  const t = await CertificateTemplate.findByIdAndUpdate(id, payload, { new: true, runValidators: true })
  if (!t) throw new ApiError(404, 'Template not found')
  return t
}

async function deleteTemplate(id) {
  const t = await CertificateTemplate.findByIdAndDelete(id)
  if (!t) throw new ApiError(404, 'Template not found')
  return { deleted: true }
}

async function getOrCreateRule(courseId, { moduleId = null, type = CERTIFICATE_TYPES.COURSE } = {}) {
  let rule = await CertificateRule.findOne({
    course: courseId,
    module: moduleId || null,
    certificateType: type,
  })
  if (!rule) {
    const defaultTpl = await CertificateTemplate.findOne({ active: true, isDefault: true })
    rule = await CertificateRule.create({
      course: courseId,
      module: moduleId || null,
      certificateType: type,
      template: defaultTpl?._id || null,
      enabled: true,
      minCourseCompletionPercent: 100,
      approvalMode: APPROVAL_MODE.AUTOMATIC,
    })
  }
  return rule
}

async function saveRule(courseId, payload, userId) {
  const type = payload.certificateType || CERTIFICATE_TYPES.COURSE
  const moduleId = payload.module || null
  return CertificateRule.findOneAndUpdate(
    { course: courseId, module: moduleId, certificateType: type },
    {
      $set: {
        ...payload,
        course: courseId,
        module: moduleId,
        certificateType: type,
        createdBy: userId,
      },
    },
    { upsert: true, new: true, runValidators: true }
  )
}

async function evaluateEligibility(studentId, courseId, rule) {
  const checks = {}
  const progress = await StudentProgress.findOne({ student: studentId, course: courseId }).lean()
  const enrollment = await Enrollment.findOne({ student: studentId, course: courseId }).lean()

  const completion = progress?.overallCompletion ?? enrollment?.overallProgress ?? 0
  checks.courseCompletion = {
    required: rule.minCourseCompletionPercent || 0,
    actual: completion,
    pass: completion >= (rule.minCourseCompletionPercent || 0),
  }

  if (rule.minAttendancePercent > 0) {
    try {
      const attendanceService = require('./attendance.service')
      const summary = await attendanceService.studentAttendanceSummary(studentId, { courseId })
      const pct = summary?.totals?.percentage ?? 0
      checks.attendance = {
        required: rule.minAttendancePercent,
        actual: pct,
        pass: pct >= rule.minAttendancePercent,
      }
    } catch {
      checks.attendance = { required: rule.minAttendancePercent, actual: 0, pass: false }
    }
  } else {
    checks.attendance = { required: 0, actual: 100, pass: true }
  }

  if (rule.minQuizScore > 0) {
    const attempts = await QuizAttempt.find({
      student: studentId,
      course: courseId,
      status: { $in: [QUIZ_ATTEMPT_STATUS.SUBMITTED, QUIZ_ATTEMPT_STATUS.AUTO_SUBMITTED] },
    })
      .select('percentage passed')
      .lean()
    const best = attempts.reduce((m, a) => Math.max(m, a.percentage || 0), 0)
    checks.quiz = {
      required: rule.minQuizScore,
      actual: best,
      pass: best >= rule.minQuizScore,
    }
  } else {
    checks.quiz = { required: 0, actual: 100, pass: true }
  }

  if (rule.minAssignmentMarksPercent > 0) {
    const subs = await AssignmentSubmission.find({
      student: studentId,
      course: courseId,
      status: 'approved',
    })
      .select('percentage')
      .lean()
    const avg =
      subs.length > 0 ? subs.reduce((s, x) => s + (x.percentage || 0), 0) / subs.length : 0
    checks.assignment = {
      required: rule.minAssignmentMarksPercent,
      actual: Math.round(avg * 10) / 10,
      pass: avg >= rule.minAssignmentMarksPercent,
    }
  } else {
    checks.assignment = { required: 0, actual: 100, pass: true }
  }

  if (rule.minPracticeScore > 0) {
    const attempts = await PracticeAttempt.find({
      user: studentId,
      status: 'passed',
    })
      .select('score question')
      .populate({ path: 'question', select: 'course' })
      .lean()
    const courseAttempts = attempts.filter(
      (a) => String(a.question?.course) === String(courseId)
    )
    const best = courseAttempts.reduce((m, a) => Math.max(m, a.score || 0), 0)
    checks.practice = {
      required: rule.minPracticeScore,
      actual: best,
      pass: best >= rule.minPracticeScore,
    }
  } else {
    checks.practice = { required: 0, actual: 100, pass: true }
  }

  const eligible = Object.values(checks).every((c) => c.pass)
  return { eligible, checks, progress, enrollment }
}

async function resolveTemplate(rule, type) {
  if (rule.template) {
    const t = await CertificateTemplate.findById(rule.template)
    if (t) return t
  }
  return (
    (await CertificateTemplate.findOne({ type, active: true, isDefault: true })) ||
    (await CertificateTemplate.findOne({ active: true }).sort({ isDefault: -1 }))
  )
}

async function issueCertificate({
  studentId,
  courseId,
  moduleId = null,
  type = CERTIFICATE_TYPES.COURSE,
  actorId = null,
  force = false,
  skipEligibility = false,
} = {}) {
  const existing = await Certificate.findOne({
    user: studentId,
    course: courseId,
    module: moduleId || null,
    type,
    status: { $in: [CERTIFICATE_STATUS.ISSUED, CERTIFICATE_STATUS.PENDING_APPROVAL] },
  })
  if (existing && !force) {
    if (existing.status === CERTIFICATE_STATUS.ISSUED) {
      const err = new ApiError(409, 'Certificate already issued')
      err.details = { certificateId: existing._id }
      throw err
    }
    return existing
  }

  const rule = await getOrCreateRule(courseId, { moduleId, type })
  if (!rule.enabled && !force) throw new ApiError(400, 'Certificates are disabled for this course')

  const eligibility = skipEligibility
    ? { eligible: true, checks: {} }
    : await evaluateEligibility(studentId, courseId, rule)

  if (!eligibility.eligible && !force) {
    const err = new ApiError(400, 'Eligibility requirements not met')
    err.details = { checks: eligibility.checks }
    throw err
  }

  const [student, course, moduleDoc] = await Promise.all([
    User.findById(studentId).select('fullName email institute'),
    Course.findById(courseId).select('title slug instructor enableCertificate'),
    moduleId ? Module.findById(moduleId).select('title') : null,
  ])
  if (!student || !course) throw new ApiError(404, 'Student or course not found')

  const needsApproval =
    rule.approvalMode === APPROVAL_MODE.MANUAL ||
    rule.approvalMode === APPROVAL_MODE.TEACHER ||
    rule.teacherApprovalRequired

  const template = await resolveTemplate(rule, type)
  const token = newToken()
  const number = certificateNumber(course.slug)
  const verificationUrl = `${config.clientUrl}/verify/certificate/${token}`

  const instructor = course.instructor
    ? await User.findById(course.instructor).select('fullName')
    : null

  const status = needsApproval && !force ? CERTIFICATE_STATUS.PENDING_APPROVAL : CERTIFICATE_STATUS.ISSUED
  const now = new Date()

  const doc = await Certificate.create({
    institute: student.institute || null,
    user: studentId,
    course: courseId,
    module: moduleId || null,
    batch: eligibility.enrollment?.batch || null,
    template: template?._id || null,
    type,
    status,
    title: template?.titleText || 'Certificate of Completion',
    studentName: student.fullName,
    courseName: moduleDoc ? `${course.title} — ${moduleDoc.title}` : course.title,
    instructorName: instructor?.fullName || '',
    completionDate: eligibility.enrollment?.completedAt || now,
    certificateNumber: number,
    qrPayload: verificationUrl,
    verificationToken: token,
    verificationUrl,
    issuedAt: status === CERTIFICATE_STATUS.ISSUED ? now : null,
    requestedBy: actorId || studentId,
    issuedBy: status === CERTIFICATE_STATUS.ISSUED ? actorId || studentId : null,
    eligibilitySnapshot: eligibility.checks,
    snapshot: {
      logoUrl: template?.logoUrl,
      backgroundUrl: template?.backgroundUrl,
      sealUrl: template?.sealUrl,
      primaryColor: template?.primaryColor,
      accentColor: template?.accentColor,
      bodyText: template?.bodyText,
      signatures: template?.signatures || [],
      showQr: template?.showQr !== false,
      showSeal: template?.showSeal !== false,
    },
  })

  if (status === CERTIFICATE_STATUS.ISSUED) {
    await notificationService.notifyUser({
      userId: studentId,
      templateKey: CERTIFICATE_NOTIFY.ISSUED,
      title: 'Certificate issued',
      body: `Your certificate for ${course.title} is ready.`,
      link: `/student/certificates/${doc._id}`,
      meta: { certificateId: doc._id, number },
    })
  } else {
    await notificationService.notifyUser({
      userId: studentId,
      templateKey: CERTIFICATE_NOTIFY.REQUESTED,
      title: 'Certificate pending approval',
      body: `Your certificate request for ${course.title} is awaiting approval.`,
      link: `/student/certificates`,
      meta: { certificateId: doc._id },
    })
  }

  return doc
}

async function approveCertificate(id, actorId) {
  const doc = await Certificate.findById(id)
  if (!doc) throw new ApiError(404, 'Certificate not found')
  if (doc.status === CERTIFICATE_STATUS.ISSUED) return doc
  if (doc.status === CERTIFICATE_STATUS.REVOKED) throw new ApiError(400, 'Certificate was revoked')

  doc.status = CERTIFICATE_STATUS.ISSUED
  doc.issuedAt = new Date()
  doc.approvedBy = actorId
  doc.issuedBy = actorId
  await doc.save()

  await notificationService.notifyUser({
    userId: doc.user,
    templateKey: CERTIFICATE_NOTIFY.APPROVED,
    title: 'Certificate approved',
    body: `Your certificate ${doc.certificateNumber} has been approved.`,
    link: `/student/certificates/${doc._id}`,
    meta: { certificateId: doc._id },
  })

  return doc
}

async function revokeCertificate(id, reason, actorId) {
  const doc = await Certificate.findById(id)
  if (!doc) throw new ApiError(404, 'Certificate not found')
  doc.status = CERTIFICATE_STATUS.REVOKED
  doc.revokedAt = new Date()
  doc.revokeReason = reason || ''
  doc.issuedBy = actorId
  await doc.save()
  await notificationService.notifyUser({
    userId: doc.user,
    templateKey: CERTIFICATE_NOTIFY.REVOKED,
    title: 'Certificate revoked',
    body: reason || 'Your certificate was revoked by an administrator.',
    meta: { certificateId: doc._id },
  })
  return doc
}

async function listCertificates(filters = {}, reqContext = {}) {
  const q = {}
  if (filters.userId) q.user = filters.userId
  if (filters.courseId) q.course = filters.courseId
  if (filters.status) q.status = filters.status
  if (filters.type) q.type = filters.type
  if (reqContext.role === ROLES.STUDENT) q.user = reqContext.userId

  const page = Math.max(1, Number(filters.page) || 1)
  const limit = Math.min(100, Number(filters.limit) || 20)
  const [items, total] = await Promise.all([
    Certificate.find(q)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'fullName email')
      .populate('course', 'title slug')
      .populate('template', 'name type')
      .lean(),
    Certificate.countDocuments(q),
  ])
  return { items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) }
}

async function getCertificate(id, reqContext = {}) {
  const doc = await Certificate.findById(id)
    .populate('user', 'fullName email')
    .populate('course', 'title slug')
    .populate('template')
    .lean()
  if (!doc) throw new ApiError(404, 'Certificate not found')
  if (
    reqContext.role === ROLES.STUDENT &&
    String(doc.user._id || doc.user) !== String(reqContext.userId)
  ) {
    throw new ApiError(403, 'Forbidden')
  }
  return doc
}

async function tryAutoIssueOnCourseComplete(studentId, courseId) {
  try {
    const rule = await getOrCreateRule(courseId, { type: CERTIFICATE_TYPES.COURSE })
    if (!rule.enabled) return null
    if (rule.approvalMode !== APPROVAL_MODE.AUTOMATIC && !rule.teacherApprovalRequired) {
      // still try — automatic only
    }
    if (rule.approvalMode !== APPROVAL_MODE.AUTOMATIC) return null
    const eligibility = await evaluateEligibility(studentId, courseId, rule)
    if (!eligibility.eligible) return null
    return issueCertificate({
      studentId,
      courseId,
      type: CERTIFICATE_TYPES.COURSE,
      actorId: studentId,
    })
  } catch (err) {
    if (err.statusCode === 409) return null
    return null
  }
}

async function pendingApprovals(filters = {}) {
  return listCertificates({ ...filters, status: CERTIFICATE_STATUS.PENDING_APPROVAL })
}

async function adminStats() {
  const [issued, pending, revoked, byType] = await Promise.all([
    Certificate.countDocuments({ status: CERTIFICATE_STATUS.ISSUED }),
    Certificate.countDocuments({ status: CERTIFICATE_STATUS.PENDING_APPROVAL }),
    Certificate.countDocuments({ status: CERTIFICATE_STATUS.REVOKED }),
    Certificate.aggregate([
      { $match: { status: CERTIFICATE_STATUS.ISSUED } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]),
  ])
  return { issued, pending, revoked, byType }
}

module.exports = {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getOrCreateRule,
  saveRule,
  evaluateEligibility,
  issueCertificate,
  approveCertificate,
  revokeCertificate,
  listCertificates,
  getCertificate,
  tryAutoIssueOnCourseComplete,
  pendingApprovals,
  adminStats,
  CERTIFICATE_TYPES,
  CERTIFICATE_STATUS,
}
