const {
  Admission,
  FeePlan,
  Income,
} = require('../models/Finance')
const User = require('../models/User')
const Course = require('../models/Course')
const {
  ADMISSION_STATUS,
  ADMISSION_TYPES,
  INCOME_CATEGORIES,
  RECEIPT_TYPES,
  FINANCE_NOTIFY,
} = require('../constants/finance')
const ledgerService = require('./ledger.service')
const notificationService = require('./notification.service')
const { ApiError } = require('../utils/helpers')
const { ROLES } = require('../constants')

function admissionNumber() {
  const year = new Date().getFullYear()
  const rand = Math.floor(100000 + Math.random() * 900000)
  return `ADM-${year}-${rand}`
}

async function listAdmissions(filters = {}) {
  const q = {}
  if (filters.status) q.status = filters.status
  if (filters.studentId) q.student = filters.studentId
  if (filters.courseId) q.course = filters.courseId
  if (filters.type) q.type = filters.type
  const page = Math.max(1, Number(filters.page) || 1)
  const limit = Math.min(100, Number(filters.limit) || 20)
  const [items, total] = await Promise.all([
    Admission.find(q)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('student', 'fullName email phoneNumber')
      .populate('course', 'title slug')
      .populate('batch', 'name batchCode')
      .populate('feePlan', 'name totalFee currency')
      .populate('counselor', 'fullName')
      .lean(),
    Admission.countDocuments(q),
  ])
  return { items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) }
}

async function getAdmission(id) {
  const doc = await Admission.findById(id)
    .populate('student', 'fullName email phoneNumber guardian')
    .populate('course', 'title slug price')
    .populate('batch', 'name batchCode')
    .populate('feePlan')
    .populate('counselor', 'fullName')
    .populate('feeAccount')
    .lean()
  if (!doc) throw new ApiError(404, 'Admission not found')
  return doc
}

async function createAdmission(payload, actorId) {
  const student = await User.findById(payload.student)
  if (!student || student.role !== ROLES.STUDENT) throw new ApiError(400, 'Valid student required')
  const course = await Course.findById(payload.course)
  if (!course) throw new ApiError(404, 'Course not found')

  if (payload.feePlan) {
    const plan = await FeePlan.findById(payload.feePlan)
    if (!plan || !plan.active) throw new ApiError(400, 'Invalid fee plan')
  }

  const doc = await Admission.create({
    ...payload,
    type: payload.type || ADMISSION_TYPES.NEW,
    onlinePlaceholder: payload.type === ADMISSION_TYPES.ONLINE,
    admissionNumber: admissionNumber(),
    status: ADMISSION_STATUS.PENDING,
    createdBy: actorId,
    counselor: payload.counselor || actorId,
  })

  return getAdmission(doc._id)
}

async function updateAdmission(id, payload) {
  const allowed = [
    'course',
    'batch',
    'feePlan',
    'admissionDate',
    'session',
    'counselor',
    'referralSource',
    'remarks',
    'type',
  ]
  const updates = {}
  for (const k of allowed) {
    if (payload[k] !== undefined) updates[k] = payload[k]
  }
  const doc = await Admission.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
  if (!doc) throw new ApiError(404, 'Admission not found')
  return getAdmission(doc._id)
}

async function approveAdmission(id, actorId) {
  const doc = await Admission.findById(id)
  if (!doc) throw new ApiError(404, 'Admission not found')
  if (doc.status === ADMISSION_STATUS.APPROVED) return getAdmission(id)
  if (doc.status === ADMISSION_STATUS.CANCELLED || doc.status === ADMISSION_STATUS.REJECTED) {
    throw new ApiError(400, `Cannot approve ${doc.status} admission`)
  }
  if (!doc.feePlan) throw new ApiError(400, 'Assign a fee plan before approval')

  // Link enrollment when possible (non-breaking)
  let enrollmentId = doc.enrollment
  try {
    const enrollmentService = require('./enrollment.service')
    const existing = await enrollmentService.findActiveEnrollment(doc.student, doc.course)
    if (existing) {
      enrollmentId = existing._id
      if (existing.status === 'pending') {
        await enrollmentService.approveEnrollment(existing._id, actorId)
      }
    } else {
      const created = await enrollmentService.enrollStudent(
        {
          studentId: doc.student,
          courseId: doc.course,
          batchId: doc.batch,
          source: 'manual',
          notes: `Admission ${doc.admissionNumber}`,
          requireApproval: false,
        },
        actorId
      )
      enrollmentId = created._id
    }
  } catch {
    /* enrollment optional linkage */
  }

  const account = await ledgerService.createFeeAccount({
    studentId: doc.student,
    courseId: doc.course,
    batchId: doc.batch,
    admissionId: doc._id,
    feePlanId: doc.feePlan,
    instituteId: doc.institute,
  })

  doc.status = ADMISSION_STATUS.APPROVED
  doc.approvedBy = actorId
  doc.approvedAt = new Date()
  doc.enrollment = enrollmentId || doc.enrollment
  doc.feeAccount = account._id
  await doc.save()

  const plan = await FeePlan.findById(doc.feePlan)
  if (plan?.admissionFee > 0) {
    await Income.create({
      institute: doc.institute,
      category: INCOME_CATEGORIES.ADMISSIONS,
      title: `Admission fee — ${doc.admissionNumber}`,
      amount: plan.admissionFee,
      currency: plan.currency || 'PKR',
      incomeDate: new Date(),
      sourceRef: doc.admissionNumber,
      createdBy: actorId,
    })
  }

  try {
    await ledgerService.createReceipt({
      type: RECEIPT_TYPES.ADMISSION,
      studentId: doc.student,
      courseId: doc.course,
      batchId: doc.batch,
      admissionId: doc._id,
      amount: plan?.admissionFee || 0,
      currency: plan?.currency || 'PKR',
      issuedBy: actorId,
      snapshot: { admissionNumber: doc.admissionNumber },
    })
  } catch {
    /* receipt optional if zero */
  }

  await notificationService.notifyUser({
    userId: doc.student,
    templateKey: FINANCE_NOTIFY.ADMISSION_APPROVED,
    title: 'Admission approved',
    body: `Your admission ${doc.admissionNumber} has been approved.`,
    link: '/student/fees',
    meta: { admissionId: doc._id },
  })

  return getAdmission(doc._id)
}

async function rejectAdmission(id, reason, actorId) {
  const doc = await Admission.findById(id)
  if (!doc) throw new ApiError(404, 'Admission not found')
  if (doc.status === ADMISSION_STATUS.APPROVED) {
    throw new ApiError(400, 'Cannot reject an approved admission')
  }
  doc.status = ADMISSION_STATUS.REJECTED
  doc.rejectedBy = actorId
  doc.rejectedAt = new Date()
  doc.rejectionReason = reason || ''
  await doc.save()

  await notificationService.notifyUser({
    userId: doc.student,
    templateKey: FINANCE_NOTIFY.ADMISSION_REJECTED,
    title: 'Admission rejected',
    body: reason || `Admission ${doc.admissionNumber} was rejected.`,
    meta: { admissionId: doc._id },
  })

  return getAdmission(doc._id)
}

async function cancelAdmission(id, actorId) {
  const doc = await Admission.findById(id)
  if (!doc) throw new ApiError(404, 'Admission not found')
  doc.status = ADMISSION_STATUS.CANCELLED
  doc.remarks = `${doc.remarks || ''}\nCancelled by ${actorId}`.trim()
  await doc.save()
  return getAdmission(doc._id)
}

module.exports = {
  listAdmissions,
  getAdmission,
  createAdmission,
  updateAdmission,
  approveAdmission,
  rejectAdmission,
  cancelAdmission,
}
