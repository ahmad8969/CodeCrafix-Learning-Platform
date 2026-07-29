const Enrollment = require('../models/Enrollment')
const Batch = require('../models/Batch')
const Course = require('../models/Course')
const User = require('../models/User')
const { StudentProgress } = require('../models/StudentProgress')
const { ApiError } = require('../utils/helpers')
const { parseListQuery, buildPagedResult } = require('../utils/query')
const { ROLES } = require('../constants')
const {
  ENROLLMENT_STATUS,
  ENROLLMENT_SOURCE,
  ENROLL_NOTIFY,
} = require('../constants/enrollment')
const notificationService = require('./notification.service')
const progressService = require('./progress.service')

const POPULATE = [
  { path: 'student', select: 'fullName email phoneNumber profileImage status' },
  { path: 'course', select: 'title slug status thumbnail' },
  { path: 'batch', select: 'name batchCode status teacher weeklySchedule' },
  { path: 'teacher', select: 'fullName email' },
]

async function syncBatchCount(batchId) {
  if (!batchId) return
  const count = await Enrollment.countDocuments({
    batch: batchId,
    status: ENROLLMENT_STATUS.ACTIVE,
    deletedAt: null,
  })
  await Batch.findByIdAndUpdate(batchId, { currentStudents: count })
}

async function findActiveEnrollment(studentId, courseId) {
  return Enrollment.findOne({
    student: studentId,
    course: courseId,
    status: { $in: [ENROLLMENT_STATUS.ACTIVE, ENROLLMENT_STATUS.PENDING] },
    deletedAt: null,
  })
}

async function isEnrolled(studentId, courseId) {
  const e = await Enrollment.findOne({
    student: studentId,
    course: courseId,
    status: ENROLLMENT_STATUS.ACTIVE,
    deletedAt: null,
  }).lean()
  return Boolean(e)
}

async function enrollStudent(
  {
    studentId,
    courseId,
    batchId,
    source = ENROLLMENT_SOURCE.MANUAL,
    enrollmentCodeUsed = '',
    notes = '',
    requireApproval = false,
  },
  actorId
) {
  const student = await User.findById(studentId)
  if (!student || student.role !== ROLES.STUDENT) {
    throw new ApiError(400, 'Valid student account required')
  }
  const course = await Course.findOne({ _id: courseId, deletedAt: null })
  if (!course) throw new ApiError(404, 'Course not found')

  const existing = await findActiveEnrollment(studentId, courseId)
  if (existing) throw new ApiError(409, 'Student is already enrolled in this course')

  let batch = null
  let teacher = null
  if (batchId) {
    batch = await Batch.findOne({ _id: batchId, deletedAt: null })
    if (!batch) throw new ApiError(404, 'Batch not found')
    if (String(batch.course) !== String(courseId)) {
      throw new ApiError(400, 'Batch does not belong to this course')
    }
    if (batch.currentStudents >= batch.maximumStudents) {
      throw new ApiError(409, 'Batch is at maximum capacity')
    }
    teacher = batch.teacher
  }

  const status =
    requireApproval || batch?.requireApproval
      ? ENROLLMENT_STATUS.PENDING
      : ENROLLMENT_STATUS.ACTIVE

  let enrollment
  try {
    enrollment = await Enrollment.create({
      student: studentId,
      course: courseId,
      batch: batchId || null,
      teacher,
      status,
      source,
      enrollmentCodeUsed,
      notes,
      enrolledAt: new Date(),
      approvedAt: status === ENROLLMENT_STATUS.ACTIVE ? new Date() : null,
      approvedBy: status === ENROLLMENT_STATUS.ACTIVE ? actorId : null,
      createdBy: actorId,
      updatedBy: actorId,
    })
  } catch (err) {
    if (err.code === 11000) throw new ApiError(409, 'Duplicate enrollment')
    throw err
  }

  if (status === ENROLLMENT_STATUS.ACTIVE && batchId) {
    await syncBatchCount(batchId)
  }

  await StudentProgress.findOneAndUpdate(
    { student: studentId, course: courseId },
    {
      student: studentId,
      course: courseId,
      enrollment: enrollment._id,
      batch: batchId || null,
      lastActivityAt: new Date(),
    },
    { upsert: true }
  )

  await progressService.trackProgress({
    userId: studentId,
    courseId,
    eventType: 'enrollment_started',
    value: 1,
    meta: { enrollmentId: enrollment._id, batchId },
  })

  await notificationService.notifyUser({
    userId: studentId,
    templateKey: ENROLL_NOTIFY.ENROLLED,
    title: status === ENROLLMENT_STATUS.PENDING ? 'Enrollment pending approval' : 'Enrollment successful',
    body: `You are ${status === ENROLLMENT_STATUS.PENDING ? 'pending for' : 'enrolled in'} "${course.title}".`,
    link: `/student/courses`,
    meta: { courseId, enrollmentId: enrollment._id },
  })

  if (batchId && teacher) {
    await notificationService.notifyUser({
      userId: teacher,
      templateKey: ENROLL_NOTIFY.BATCH_ASSIGNED,
      title: 'New batch enrollment',
      body: `${student.fullName} joined batch ${batch.batchCode}`,
      link: `/teacher/batches/${batchId}`,
      meta: { batchId, studentId },
    })
  }

  return Enrollment.findById(enrollment._id).populate(POPULATE)
}

async function approveEnrollment(id, actorId) {
  const enrollment = await Enrollment.findById(id)
  if (!enrollment || enrollment.deletedAt) throw new ApiError(404, 'Enrollment not found')
  if (enrollment.status !== ENROLLMENT_STATUS.PENDING) {
    throw new ApiError(400, 'Only pending enrollments can be approved')
  }
  if (enrollment.batch) {
    const batch = await Batch.findById(enrollment.batch)
    if (batch && batch.currentStudents >= batch.maximumStudents) {
      throw new ApiError(409, 'Batch is at maximum capacity')
    }
  }
  enrollment.status = ENROLLMENT_STATUS.ACTIVE
  enrollment.approvedAt = new Date()
  enrollment.approvedBy = actorId
  enrollment.updatedBy = actorId
  await enrollment.save()
  if (enrollment.batch) await syncBatchCount(enrollment.batch)

  await notificationService.notifyUser({
    userId: enrollment.student,
    templateKey: ENROLL_NOTIFY.ENROLLED,
    title: 'Enrollment approved',
    body: 'Your enrollment request was approved.',
    link: `/student/courses`,
  })
  return Enrollment.findById(id).populate(POPULATE)
}

async function rejectEnrollment(id, actorId, notes = '') {
  const enrollment = await Enrollment.findById(id)
  if (!enrollment || enrollment.deletedAt) throw new ApiError(404, 'Enrollment not found')
  enrollment.status = ENROLLMENT_STATUS.REJECTED
  enrollment.notes = notes || enrollment.notes
  enrollment.updatedBy = actorId
  await enrollment.save()
  return enrollment
}

async function withdrawEnrollment(id, actorId) {
  const enrollment = await Enrollment.findById(id)
  if (!enrollment || enrollment.deletedAt) throw new ApiError(404, 'Enrollment not found')
  const prevBatch = enrollment.batch
  enrollment.status = ENROLLMENT_STATUS.WITHDRAWN
  enrollment.withdrawnAt = new Date()
  enrollment.updatedBy = actorId
  await enrollment.save()
  if (prevBatch) await syncBatchCount(prevBatch)
  return enrollment
}

async function transferBatch(enrollmentId, toBatchId, actorId) {
  const enrollment = await Enrollment.findById(enrollmentId)
  if (!enrollment || enrollment.deletedAt) throw new ApiError(404, 'Enrollment not found')
  if (enrollment.status !== ENROLLMENT_STATUS.ACTIVE) {
    throw new ApiError(400, 'Only active enrollments can be transferred')
  }
  const toBatch = await Batch.findOne({ _id: toBatchId, deletedAt: null })
  if (!toBatch) throw new ApiError(404, 'Target batch not found')
  if (String(toBatch.course) !== String(enrollment.course)) {
    throw new ApiError(400, 'Target batch must belong to the same course')
  }
  if (toBatch.currentStudents >= toBatch.maximumStudents) {
    throw new ApiError(409, 'Target batch is full')
  }

  const fromBatch = enrollment.batch
  enrollment.transferredFromBatch = fromBatch
  enrollment.batch = toBatchId
  enrollment.teacher = toBatch.teacher
  enrollment.updatedBy = actorId
  await enrollment.save()

  await syncBatchCount(fromBatch)
  await syncBatchCount(toBatchId)

  await StudentProgress.findOneAndUpdate(
    { student: enrollment.student, course: enrollment.course },
    { batch: toBatchId }
  )

  await notificationService.notifyUser({
    userId: enrollment.student,
    templateKey: ENROLL_NOTIFY.BATCH_ASSIGNED,
    title: 'Batch transferred',
    body: `You were moved to batch ${toBatch.name} (${toBatch.batchCode}).`,
    link: `/student/batches`,
  })

  return Enrollment.findById(enrollmentId).populate(POPULATE)
}

async function transferCourse(enrollmentId, toCourseId, toBatchId, actorId) {
  const enrollment = await Enrollment.findById(enrollmentId)
  if (!enrollment || enrollment.deletedAt) throw new ApiError(404, 'Enrollment not found')
  if (enrollment.status !== ENROLLMENT_STATUS.ACTIVE) {
    throw new ApiError(400, 'Only active enrollments can be transferred')
  }
  const toCourse = await Course.findOne({ _id: toCourseId, deletedAt: null })
  if (!toCourse) throw new ApiError(404, 'Target course not found')

  const dup = await findActiveEnrollment(enrollment.student, toCourseId)
  if (dup) throw new ApiError(409, 'Already enrolled in target course')

  const fromBatch = enrollment.batch
  enrollment.status = ENROLLMENT_STATUS.TRANSFERRED
  enrollment.transferredFromCourse = enrollment.course
  enrollment.updatedBy = actorId
  await enrollment.save()
  if (fromBatch) await syncBatchCount(fromBatch)

  return enrollStudent(
    {
      studentId: enrollment.student,
      courseId: toCourseId,
      batchId: toBatchId,
      source: ENROLLMENT_SOURCE.MANUAL,
      notes: `Transferred from enrollment ${enrollmentId}`,
    },
    actorId
  )
}

async function enrollByCode(studentId, code) {
  const enrollmentCode = String(code || '').trim().toUpperCase()
  if (!enrollmentCode) throw new ApiError(400, 'Enrollment code required')
  const batch = await Batch.findOne({
    enrollmentCode,
    deletedAt: null,
    status: { $in: ['upcoming', 'active'] },
  })
  if (!batch) throw new ApiError(404, 'Invalid enrollment code')
  return enrollStudent(
    {
      studentId,
      courseId: batch.course,
      batchId: batch._id,
      source: ENROLLMENT_SOURCE.CODE,
      enrollmentCodeUsed: enrollmentCode,
      requireApproval: batch.requireApproval,
    },
    studentId
  )
}

async function selfEnroll(studentId, { courseId, batchId }) {
  let batch = null
  if (batchId) {
    batch = await Batch.findOne({ _id: batchId, deletedAt: null })
    if (!batch || !batch.allowSelfEnroll) {
      throw new ApiError(403, 'Self-enrollment is not enabled for this batch')
    }
    courseId = batch.course
  }
  const course = await Course.findById(courseId)
  if (!course) throw new ApiError(404, 'Course not found')
  // Course-level: allow if any self-enroll batch exists or explicit batch
  if (!batch) {
    batch = await Batch.findOne({
      course: courseId,
      allowSelfEnroll: true,
      deletedAt: null,
      status: { $in: ['upcoming', 'active'] },
    })
    if (!batch) throw new ApiError(403, 'Self-enrollment is not available for this course')
  }
  return enrollStudent(
    {
      studentId,
      courseId: batch.course,
      batchId: batch._id,
      source: ENROLLMENT_SOURCE.SELF,
      requireApproval: batch.requireApproval,
    },
    studentId
  )
}

async function bulkEnroll(rows, actorId) {
  const results = { created: [], errors: [] }
  for (const row of rows || []) {
    try {
      const student =
        (row.email && (await User.findOne({ email: String(row.email).toLowerCase(), role: ROLES.STUDENT }))) ||
        (row.studentId && (await User.findById(row.studentId)))
      if (!student) {
        results.errors.push({ row, error: 'Student not found' })
        continue
      }
      const enrollment = await enrollStudent(
        {
          studentId: student._id,
          courseId: row.courseId,
          batchId: row.batchId,
          source: ENROLLMENT_SOURCE.BULK,
          notes: row.notes || '',
        },
        actorId
      )
      results.created.push(enrollment)
    } catch (e) {
      results.errors.push({ row, error: e.message || 'Failed' })
    }
  }
  return results
}

async function listEnrollments(query, reqContext = {}) {
  const { page, limit, search, sortBy, sortOrder, skip, filters } = parseListQuery(query)
  const filter = { deletedAt: null }
  if (filters.course) filter.course = filters.course
  if (filters.batch) filter.batch = filters.batch
  if (filters.status) filter.status = filters.status
  if (filters.student) filter.student = filters.student
  if (filters.teacher) filter.teacher = filters.teacher
  if (reqContext.courseScope === 'assigned') {
    filter.teacher = reqContext.assignedUserId
  }
  if (reqContext.courseScope === 'published') {
    filter.student = reqContext.userId
  }

  let studentIds = null
  if (search) {
    const users = await User.find({
      role: ROLES.STUDENT,
      $or: [
        { fullName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { phoneNumber: new RegExp(search, 'i') },
      ],
    })
      .select('_id')
      .lean()
    studentIds = users.map((u) => u._id)
    filter.student = filter.student
      ? filter.student
      : { $in: studentIds.length ? studentIds : [null] }
  }

  if (filters.from || filters.to) {
    filter.enrolledAt = {}
    if (filters.from) filter.enrolledAt.$gte = new Date(filters.from)
    if (filters.to) filter.enrolledAt.$lte = new Date(filters.to)
  }

  const [items, total] = await Promise.all([
    Enrollment.find(filter)
      .sort({ [sortBy || 'enrolledAt']: sortOrder || -1 })
      .skip(skip)
      .limit(limit)
      .populate(POPULATE)
      .lean(),
    Enrollment.countDocuments(filter),
  ])
  return buildPagedResult({ items, total, page, limit })
}

async function getEnrollment(id, reqContext = {}) {
  const enrollment = await Enrollment.findOne({ _id: id, deletedAt: null }).populate(POPULATE)
  if (!enrollment) throw new ApiError(404, 'Enrollment not found')
  if (reqContext.courseScope === 'published' && String(enrollment.student._id || enrollment.student) !== String(reqContext.userId)) {
    throw new ApiError(403, 'Not your enrollment')
  }
  if (
    reqContext.courseScope === 'assigned' &&
    String(enrollment.teacher?._id || enrollment.teacher) !== String(reqContext.assignedUserId)
  ) {
    throw new ApiError(403, 'Not your batch enrollment')
  }
  return enrollment
}

module.exports = {
  enrollStudent,
  approveEnrollment,
  rejectEnrollment,
  withdrawEnrollment,
  transferBatch,
  transferCourse,
  enrollByCode,
  selfEnroll,
  bulkEnroll,
  listEnrollments,
  getEnrollment,
  isEnrolled,
  findActiveEnrollment,
  syncBatchCount,
  POPULATE,
}
