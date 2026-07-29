const enrollmentService = require('../services/enrollment.service')
const studentProgress = require('../services/student-progress.service')
const learningPath = require('../services/learning-path.service')
const auditService = require('../services/audit.service')
const User = require('../models/User')
const { asyncHandler, sendSuccess, ApiError } = require('../utils/helpers')
const { ctxFromReq } = require('../utils/curriculum-access')
const { ROLES } = require('../constants')

const list = asyncHandler(async (req, res) => {
  const data = await enrollmentService.listEnrollments(req.query, ctxFromReq(req))
  sendSuccess(res, data)
})

const get = asyncHandler(async (req, res) => {
  const data = await enrollmentService.getEnrollment(req.params.id, ctxFromReq(req))
  sendSuccess(res, data)
})

const create = asyncHandler(async (req, res) => {
  const data = await enrollmentService.enrollStudent(
    {
      studentId: req.body.studentId || req.body.student,
      courseId: req.body.courseId || req.body.course,
      batchId: req.body.batchId || req.body.batch,
      source: req.body.source,
      notes: req.body.notes,
      requireApproval: req.body.requireApproval,
    },
    req.user._id
  )
  await auditService.record(req, {
    action: 'enrollment_created',
    resourceType: 'Enrollment',
    resourceId: data._id,
    newValue: { student: data.student, course: data.course, batch: data.batch },
  })
  sendSuccess(res, data, 'Student enrolled', 201)
})

const bulk = asyncHandler(async (req, res) => {
  const rows = req.body.rows || req.body.enrollments || []
  const data = await enrollmentService.bulkEnroll(rows, req.user._id)
  await auditService.record(req, {
    action: 'enrollment_bulk',
    resourceType: 'Enrollment',
    meta: { created: data.created.length, errors: data.errors.length },
  })
  sendSuccess(res, data, 'Bulk enrollment processed')
})

const selfEnroll = asyncHandler(async (req, res) => {
  const data = await enrollmentService.selfEnroll(req.user._id, {
    courseId: req.body.courseId || req.body.course,
    batchId: req.body.batchId || req.body.batch,
  })
  sendSuccess(res, data, 'Self-enrollment submitted', 201)
})

const enrollByCode = asyncHandler(async (req, res) => {
  const data = await enrollmentService.enrollByCode(req.user._id, req.body.code)
  sendSuccess(res, data, 'Enrolled via code', 201)
})

const approve = asyncHandler(async (req, res) => {
  const data = await enrollmentService.approveEnrollment(req.params.id, req.user._id)
  await auditService.record(req, {
    action: 'enrollment_approved',
    resourceType: 'Enrollment',
    resourceId: data._id,
  })
  sendSuccess(res, data, 'Enrollment approved')
})

const reject = asyncHandler(async (req, res) => {
  const data = await enrollmentService.rejectEnrollment(req.params.id, req.user._id, req.body.notes)
  sendSuccess(res, data, 'Enrollment rejected')
})

const withdraw = asyncHandler(async (req, res) => {
  const data = await enrollmentService.withdrawEnrollment(req.params.id, req.user._id)
  await auditService.record(req, {
    action: 'enrollment_withdrawn',
    resourceType: 'Enrollment',
    resourceId: data._id,
  })
  sendSuccess(res, data, 'Enrollment withdrawn')
})

const transferBatch = asyncHandler(async (req, res) => {
  const data = await enrollmentService.transferBatch(
    req.params.id,
    req.body.batchId || req.body.toBatchId,
    req.user._id
  )
  await auditService.record(req, {
    action: 'enrollment_batch_transfer',
    resourceType: 'Enrollment',
    resourceId: data._id,
    newValue: { batch: data.batch },
  })
  sendSuccess(res, data, 'Student transferred')
})

const transferCourse = asyncHandler(async (req, res) => {
  const data = await enrollmentService.transferCourse(
    req.params.id,
    req.body.courseId || req.body.toCourseId,
    req.body.batchId || req.body.toBatchId,
    req.user._id
  )
  await auditService.record(req, {
    action: 'enrollment_course_transfer',
    resourceType: 'Enrollment',
    resourceId: data._id,
  })
  sendSuccess(res, data, 'Course transfer completed', 201)
})

const progressReport = asyncHandler(async (req, res) => {
  const studentId = req.params.studentId || req.user._id
  if (
    String(studentId) !== String(req.user._id) &&
    ![ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.TEACHER].includes(req.user.role)
  ) {
    throw new ApiError(403, 'Forbidden')
  }
  const data = await studentProgress.studentProgressReport(studentId, req.params.courseId)
  sendSuccess(res, data)
})

const timeline = asyncHandler(async (req, res) => {
  const studentId = req.query.studentId || req.user._id
  const data = await studentProgress.getProgressTimeline(studentId, req.query.course)
  sendSuccess(res, data)
})

const learningPathGet = asyncHandler(async (req, res) => {
  const studentId = req.query.studentId || req.user._id
  const data = await learningPath.getCourseLearningPath(studentId, req.params.courseId)
  sendSuccess(res, data)
})

const evaluateTopic = asyncHandler(async (req, res) => {
  const studentId = req.query.studentId || req.user._id
  const data = await learningPath.evaluateTopicAccess(studentId, req.params.topicId)
  sendSuccess(res, data)
})

const unlockTopic = asyncHandler(async (req, res) => {
  const { studentId, topicId, courseId, lock = false, notes } = req.body
  const { TOPIC_LOCK_STATE } = require('../constants/enrollment')
  const data = await learningPath.setTopicLock(
    studentId,
    topicId,
    courseId,
    lock ? TOPIC_LOCK_STATE.FORCED_LOCK : TOPIC_LOCK_STATE.FORCED_UNLOCK,
    req.user._id,
    notes
  )
  await auditService.record(req, {
    action: lock ? 'topic_locked' : 'topic_unlocked',
    resourceType: 'TopicAccess',
    resourceId: data._id,
    meta: { studentId, topicId },
  })
  sendSuccess(res, data, lock ? 'Topic locked' : 'Topic unlocked')
})

const analytics = asyncHandler(async (req, res) => {
  const data = await studentProgress.platformEnrollmentAnalytics()
  sendSuccess(res, data)
})

const batchReport = asyncHandler(async (req, res) => {
  const data = await studentProgress.batchPerformanceReport(req.params.batchId)
  sendSuccess(res, data)
})

const courseReport = asyncHandler(async (req, res) => {
  const data = await studentProgress.courseCompletionReport(req.params.courseId)
  sendSuccess(res, data)
})

const teacherReport = asyncHandler(async (req, res) => {
  const data = await studentProgress.teacherPerformanceReport(req.params.teacherId || req.user._id)
  sendSuccess(res, data)
})

const studentProfile = asyncHandler(async (req, res) => {
  const studentId = req.params.studentId || req.user._id
  if (
    String(studentId) !== String(req.user._id) &&
    ![ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.TEACHER].includes(req.user.role)
  ) {
    throw new ApiError(403, 'Forbidden')
  }
  const student = await User.findById(studentId)
  if (!student) throw new ApiError(404, 'Student not found')
  const enrollments = await enrollmentService.listEnrollments(
    { student: studentId, limit: 50 },
    { courseScope: 'all', userId: req.user._id, role: req.user.role }
  )
  const continueLearning = await studentProgress.getContinueLearning(studentId)
  sendSuccess(res, {
    student: student.toSafeObject(),
    enrollments: enrollments.items,
    continueLearning,
    attendancePlaceholder: null,
    certificatesPlaceholder: [],
  })
})

const updateProfile = asyncHandler(async (req, res) => {
  const studentId = req.user._id
  const allowed = ['fullName', 'phoneNumber', 'profileImage', 'bio', 'address', 'dateOfBirth', 'guardian']
  const updates = {}
  for (const k of allowed) {
    if (req.body[k] !== undefined) updates[k] = req.body[k]
  }
  const user = await User.findByIdAndUpdate(studentId, updates, { new: true, runValidators: true })
  sendSuccess(res, user.toSafeObject(), 'Profile updated')
})

const myContinue = asyncHandler(async (req, res) => {
  const data = await studentProgress.getContinueLearning(req.user._id)
  sendSuccess(res, { continueLearning: data })
})

module.exports = {
  list,
  get,
  create,
  bulk,
  selfEnroll,
  enrollByCode,
  approve,
  reject,
  withdraw,
  transferBatch,
  transferCourse,
  progressReport,
  timeline,
  learningPathGet,
  evaluateTopic,
  unlockTopic,
  analytics,
  batchReport,
  courseReport,
  teacherReport,
  studentProfile,
  updateProfile,
  myContinue,
}
