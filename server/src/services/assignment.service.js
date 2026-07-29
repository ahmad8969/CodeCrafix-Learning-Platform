const assignmentRepo = require('../repositories/assignment.repository')
const submissionRepo = require('../repositories/assignment-submission.repository')
const Assignment = require('../models/Assignment')
const AssignmentSubmission = require('../models/AssignmentSubmission')
const User = require('../models/User')
const { ApiError } = require('../utils/helpers')
const { assertCourseAccess } = require('../utils/curriculum-access')
const { ROLES } = require('../constants')
const {
  ASSIGNMENT_STATUS,
  SUBMISSION_STATUS,
  ASSIGNMENT_TYPES,
  ASSIGNMENT_NOTIFY,
  DEFAULT_RUBRIC,
} = require('../constants/assignment')
const notificationService = require('./notification.service')
const progressService = require('./progress.service')

function isStaff(role) {
  return [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.TEACHER].includes(role)
}

function pushTimeline(submission, status, userId, note = '') {
  submission.timeline = submission.timeline || []
  submission.timeline.push({ status, at: new Date(), by: userId || null, note })
}

function computeIsLate(assignment, now = new Date()) {
  if (!assignment.dueAt) return false
  return now > new Date(assignment.dueAt)
}

function applyLatePenalty(marks, assignment, isLate) {
  if (!isLate || !assignment.latePenaltyPercent) return marks
  const penalty = (Number(marks) * Number(assignment.latePenaltyPercent)) / 100
  return Math.max(0, Math.round((Number(marks) - penalty) * 100) / 100)
}

async function notifyAssignmentEvent({ userIds, title, body, link, templateKey, meta }) {
  const ids = [...new Set((userIds || []).filter(Boolean).map(String))]
  await Promise.all(
    ids.map((userId) =>
      notificationService.notifyUser({
        userId,
        templateKey,
        title,
        body,
        link,
        meta: meta || {},
      })
    )
  )
}

async function listAssignments(query, reqContext) {
  if (reqContext.courseScope === 'published') {
    query.status = query.status || ASSIGNMENT_STATUS.PUBLISHED
  }
  return assignmentRepo.list(query)
}

async function getAssignment(id, reqContext) {
  const assignment = await assignmentRepo.findById(id)
  if (!assignment || (assignment.deletedAt && !isStaff(reqContext.role))) {
    throw new ApiError(404, 'Assignment not found')
  }
  await assertCourseAccess(assignment.course._id || assignment.course, reqContext)
  if (
    !isStaff(reqContext.role) &&
    assignment.status !== ASSIGNMENT_STATUS.PUBLISHED
  ) {
    throw new ApiError(404, 'Assignment not found')
  }
  return assignment
}

async function createAssignment(payload, userId) {
  if (!payload.course) throw new ApiError(400, 'course is required')
  const slug = await assignmentRepo.uniqueSlug(payload.title, payload.course)
  const rubrics =
    Array.isArray(payload.rubrics) && payload.rubrics.length
      ? payload.rubrics
      : [...DEFAULT_RUBRIC]

  return assignmentRepo.create({
    ...payload,
    slug,
    rubrics,
    createdBy: userId,
    updatedBy: userId,
  })
}

async function updateAssignment(id, payload, userId) {
  const existing = await assignmentRepo.findById(id)
  if (!existing || existing.deletedAt) throw new ApiError(404, 'Assignment not found')
  if (payload.title) {
    payload.slug = await assignmentRepo.uniqueSlug(
      payload.title,
      payload.course || existing.course,
      id
    )
  }
  return assignmentRepo.update(id, { ...payload, updatedBy: userId })
}

async function publishAssignment(id, userId, reqContext) {
  const assignment = await getAssignment(id, { ...reqContext, role: reqContext.role || ROLES.ADMIN })
  const updated = await assignmentRepo.update(id, {
    status: ASSIGNMENT_STATUS.PUBLISHED,
    publishAt: new Date(),
    updatedBy: userId,
  })

  // Notify course instructor + students placeholder (all active students with role)
  const students = await User.find({ role: ROLES.STUDENT, status: 'active' })
    .select('_id')
    .limit(200)
    .lean()
  await notifyAssignmentEvent({
    userIds: students.map((s) => s._id),
    templateKey: ASSIGNMENT_NOTIFY.PUBLISHED,
    title: 'New assignment published',
    body: `"${assignment.title}" is now available.`,
    link: `/student/assignments/${assignment._id}`,
    meta: { assignmentId: assignment._id },
  })

  return updated
}

async function archiveAssignment(id, userId) {
  return assignmentRepo.update(id, {
    status: ASSIGNMENT_STATUS.ARCHIVED,
    updatedBy: userId,
  })
}

async function deleteAssignment(id) {
  const doc = await assignmentRepo.softDelete(id)
  if (!doc) throw new ApiError(404, 'Assignment not found')
  return doc
}

async function restoreAssignment(id) {
  const doc = await assignmentRepo.restore(id)
  if (!doc) throw new ApiError(404, 'Assignment not found')
  return doc
}

function validateSubmissionPayload(assignment, payload) {
  const type = assignment.type
  if (type === ASSIGNMENT_TYPES.CODING && !(payload.codeSnapshot || []).length) {
    throw new ApiError(400, 'codeSnapshot is required for coding assignments')
  }
  if (
    [ASSIGNMENT_TYPES.GITHUB].includes(type) &&
    !payload.githubUrl
  ) {
    throw new ApiError(400, 'githubUrl is required')
  }
  if (
    [ASSIGNMENT_TYPES.EXTERNAL_LINK, ASSIGNMENT_TYPES.GOOGLE_DRIVE].includes(type) &&
    !payload.externalUrl
  ) {
    throw new ApiError(400, 'externalUrl is required')
  }
  if (type === ASSIGNMENT_TYPES.RICH_TEXT && !payload.richText) {
    throw new ApiError(400, 'richText is required')
  }
  if (
    [
      ASSIGNMENT_TYPES.FILE_UPLOAD,
      ASSIGNMENT_TYPES.MULTI_FILE,
      ASSIGNMENT_TYPES.PDF,
      ASSIGNMENT_TYPES.ZIP,
      ASSIGNMENT_TYPES.IMAGE,
      ASSIGNMENT_TYPES.VIDEO,
      ASSIGNMENT_TYPES.PROJECT,
    ].includes(type) &&
    !(payload.files || []).length
  ) {
    throw new ApiError(400, 'At least one file is required')
  }
}

async function saveDraft(userId, assignmentId, payload, reqContext) {
  const assignment = await getAssignment(assignmentId, reqContext)
  const latest = await submissionRepo.findLatest(userId, assignmentId)
  if (latest && latest.status === SUBMISSION_STATUS.DRAFT) {
    Object.assign(latest, {
      files: payload.files || latest.files,
      githubUrl: payload.githubUrl ?? latest.githubUrl,
      externalUrl: payload.externalUrl ?? latest.externalUrl,
      richText: payload.richText ?? latest.richText,
      codeSnapshot: payload.codeSnapshot || latest.codeSnapshot,
      submissionType: assignment.type,
    })
    await latest.save()
    return latest
  }

  const attemptNumber = latest ? latest.attemptNumber + (latest.status === SUBMISSION_STATUS.DRAFT ? 0 : 0) : 1
  // if latest is not draft, draft creates new only when resubmit allowed after revision
  const nextAttempt =
    !latest || latest.status === SUBMISSION_STATUS.DRAFT
      ? latest?.attemptNumber || 1
      : latest.attemptNumber + 1

  if (latest && latest.status === SUBMISSION_STATUS.DRAFT) {
    return latest
  }

  const doc = await submissionRepo.create({
    student: userId,
    course: assignment.course._id || assignment.course,
    batch: assignment.batch,
    assignment: assignment._id,
    submissionType: assignment.type,
    files: payload.files || [],
    githubUrl: payload.githubUrl || '',
    externalUrl: payload.externalUrl || '',
    richText: payload.richText || '',
    codeSnapshot: payload.codeSnapshot || [],
    attemptNumber: latest ? nextAttempt : 1,
    status: SUBMISSION_STATUS.DRAFT,
    timeline: [{ status: SUBMISSION_STATUS.DRAFT, at: new Date(), by: userId }],
  })
  return doc
}

async function submitAssignment(userId, assignmentId, payload, reqContext) {
  const assignment = await getAssignment(assignmentId, reqContext)
  const now = new Date()

  if (assignment.startAt && now < new Date(assignment.startAt)) {
    throw new ApiError(403, 'Assignment has not started yet')
  }
  if (assignment.endAt && now > new Date(assignment.endAt)) {
    throw new ApiError(403, 'Assignment window has ended')
  }

  const isLate = computeIsLate(assignment, now)
  if (isLate && !assignment.lateSubmissionAllowed) {
    throw new ApiError(403, 'Late submissions are not allowed')
  }

  validateSubmissionPayload(assignment, payload)

  let latest = await submissionRepo.findLatest(userId, assignmentId)
  const nonDraftCount = await AssignmentSubmission.countDocuments({
    student: userId,
    assignment: assignmentId,
    status: { $ne: SUBMISSION_STATUS.DRAFT },
  })

  if (assignment.maxAttempts > 0 && nonDraftCount >= assignment.maxAttempts) {
    const canResubmit =
      assignment.allowResubmission &&
      latest &&
      latest.status === SUBMISSION_STATUS.NEEDS_REVISION
    if (!canResubmit) throw new ApiError(429, 'Maximum attempts reached')
  }

  if (
    latest &&
    [SUBMISSION_STATUS.SUBMITTED, SUBMISSION_STATUS.UNDER_REVIEW, SUBMISSION_STATUS.APPROVED].includes(
      latest.status
    )
  ) {
    if (!(assignment.allowResubmission && latest.status === SUBMISSION_STATUS.NEEDS_REVISION)) {
      // allow new attempt only after needs_revision or if never submitted properly
      if (latest.status === SUBMISSION_STATUS.APPROVED) {
        throw new ApiError(400, 'Assignment already approved')
      }
      if (latest.status !== SUBMISSION_STATUS.NEEDS_REVISION) {
        throw new ApiError(400, 'Already submitted — wait for review or revision request')
      }
    }
  }

  const attemptNumber = latest
    ? latest.status === SUBMISSION_STATUS.DRAFT
      ? latest.attemptNumber
      : latest.attemptNumber + 1
    : 1

  const body = {
    student: userId,
    course: assignment.course._id || assignment.course,
    batch: assignment.batch,
    assignment: assignment._id,
    submissionType: assignment.type,
    files: payload.files || [],
    githubUrl: payload.githubUrl || '',
    externalUrl: payload.externalUrl || '',
    richText: payload.richText || '',
    codeSnapshot: payload.codeSnapshot || [],
    attemptNumber,
    isLate,
    submittedAt: now,
    status: SUBMISSION_STATUS.SUBMITTED,
    virusScanStatus: 'skipped',
  }

  let submission
  if (latest && latest.status === SUBMISSION_STATUS.DRAFT) {
    Object.assign(latest, body)
    pushTimeline(latest, SUBMISSION_STATUS.SUBMITTED, userId, isLate ? 'Late submission' : '')
    await latest.save()
    submission = latest
  } else {
    submission = await submissionRepo.create({
      ...body,
      timeline: [
        { status: SUBMISSION_STATUS.SUBMITTED, at: now, by: userId, note: isLate ? 'Late' : '' },
      ],
    })
  }

  await Assignment.findByIdAndUpdate(assignment._id, { $inc: { submissionCount: 1 } })

  const instructorId = assignment.course?.instructor || null
  await notifyAssignmentEvent({
    userIds: [instructorId].filter(Boolean),
    templateKey: ASSIGNMENT_NOTIFY.SUBMISSION_RECEIVED,
    title: 'Assignment submission received',
    body: `A student submitted "${assignment.title}"${isLate ? ' (late)' : ''}.`,
    link: `/teacher/assignments/${assignment._id}/submissions/${submission._id}`,
    meta: { assignmentId: assignment._id, submissionId: submission._id },
  })

  if (isLate) {
    await notifyAssignmentEvent({
      userIds: [userId],
      templateKey: ASSIGNMENT_NOTIFY.LATE_SUBMISSION,
      title: 'Late submission recorded',
      body: `Your submission for "${assignment.title}" was marked late.`,
      link: `/student/assignments/${assignment._id}`,
    })
  }

  await progressService.trackProgress({
    userId,
    courseId: assignment.course._id || assignment.course,
    eventType: 'assignment_submitted',
    value: 1,
    meta: { assignmentId: assignment._id, attemptNumber },
  })

  return submission
}

async function resubmitAssignment(userId, assignmentId, payload, reqContext) {
  const latest = await submissionRepo.findLatest(userId, assignmentId)
  if (!latest || latest.status !== SUBMISSION_STATUS.NEEDS_REVISION) {
    throw new ApiError(400, 'Resubmission is only allowed after a revision request')
  }
  const assignment = await getAssignment(assignmentId, reqContext)
  if (!assignment.allowResubmission) {
    throw new ApiError(403, 'Resubmission is disabled for this assignment')
  }
  // Force new attempt path
  latest.status = SUBMISSION_STATUS.NEEDS_REVISION
  await latest.save()
  return submitAssignment(userId, assignmentId, payload, reqContext)
}

async function getSubmission(id, reqContext) {
  const submission = await submissionRepo.findById(id)
  if (!submission) throw new ApiError(404, 'Submission not found')
  const assignment = submission.assignment
  await assertCourseAccess(submission.course, reqContext)

  if (
    reqContext.role === ROLES.STUDENT &&
    String(submission.student._id || submission.student) !== String(reqContext.userId)
  ) {
    throw new ApiError(403, 'You can only view your own submissions')
  }
  return submission
}

async function listSubmissions(assignmentId, query, reqContext) {
  await getAssignment(assignmentId, reqContext)
  return submissionRepo.listForAssignment(assignmentId, query)
}

async function studentHistory(userId, assignmentId, reqContext) {
  await getAssignment(assignmentId, reqContext)
  return submissionRepo.history(userId, assignmentId)
}

async function gradeSubmission(submissionId, payload, reviewerId, reqContext) {
  const submission = await submissionRepo.findById(submissionId)
  if (!submission) throw new ApiError(404, 'Submission not found')
  await assertCourseAccess(submission.course, reqContext)

  const assignment =
    typeof submission.assignment === 'object' && submission.assignment?.maxMarks
      ? submission.assignment
      : await assignmentRepo.findById(submission.assignment)

  const status = payload.status || SUBMISSION_STATUS.APPROVED
  if (
    ![
      SUBMISSION_STATUS.APPROVED,
      SUBMISSION_STATUS.REJECTED,
      SUBMISSION_STATUS.NEEDS_REVISION,
      SUBMISSION_STATUS.UNDER_REVIEW,
    ].includes(status)
  ) {
    throw new ApiError(400, 'Invalid review status')
  }

  let marks = payload.marks
  if (Array.isArray(payload.rubricScores) && payload.rubricScores.length) {
    marks = payload.rubricScores.reduce((s, r) => s + (Number(r.awarded) || 0), 0)
  }
  if (marks == null) throw new ApiError(400, 'marks or rubricScores required')

  marks = applyLatePenalty(marks, assignment, submission.isLate)
  const percentage = assignment.maxMarks
    ? Math.round((marks / assignment.maxMarks) * 1000) / 10
    : 0

  submission.marks = marks
  submission.percentage = percentage
  submission.status = status
  submission.teacherFeedback = payload.teacherFeedback || ''
  submission.rubricScores = payload.rubricScores || submission.rubricScores
  submission.aiReviewPlaceholder = payload.aiReviewPlaceholder || ''
  submission.reviewedBy = reviewerId
  submission.reviewedAt = new Date()
  pushTimeline(submission, status, reviewerId, payload.teacherFeedback || '')
  await submission.save()

  if (status === SUBMISSION_STATUS.APPROVED) {
    await Assignment.findByIdAndUpdate(assignment._id, {
      $inc: { approvedCount: 1 },
    })
    // recompute average
    const approved = await AssignmentSubmission.find({
      assignment: assignment._id,
      status: SUBMISSION_STATUS.APPROVED,
      marks: { $ne: null },
    }).select('marks')
    const avg =
      approved.length > 0
        ? approved.reduce((s, x) => s + x.marks, 0) / approved.length
        : 0
    await Assignment.findByIdAndUpdate(assignment._id, { averageMarks: Math.round(avg * 10) / 10 })
  }

  const studentId = submission.student._id || submission.student
  await notifyAssignmentEvent({
    userIds: [studentId],
    templateKey:
      status === SUBMISSION_STATUS.NEEDS_REVISION
        ? ASSIGNMENT_NOTIFY.REVISION_REQUESTED
        : status === SUBMISSION_STATUS.APPROVED
          ? ASSIGNMENT_NOTIFY.MARKS_PUBLISHED
          : ASSIGNMENT_NOTIFY.REVIEW_COMPLETED,
    title:
      status === SUBMISSION_STATUS.NEEDS_REVISION
        ? 'Revision requested'
        : 'Assignment reviewed',
    body:
      status === SUBMISSION_STATUS.NEEDS_REVISION
        ? `Please revise "${assignment.title}".`
        : `"${assignment.title}" was graded: ${marks}/${assignment.maxMarks}.`,
    link: `/student/assignments/${assignment._id}`,
    meta: { submissionId, marks, status },
  })

  // Learning path unlock placeholder
  if (
    status === SUBMISSION_STATUS.APPROVED &&
    assignment.unlockNextTopicOnPass &&
    marks >= assignment.passingMarks
  ) {
    // Future: unlock nextTopic for student enrollment path
  }

  return submission
}

async function studentDashboard(userId) {
  const submissions = await submissionRepo.listForStudent(userId)
  const now = new Date()
  const published = await Assignment.find({
    status: ASSIGNMENT_STATUS.PUBLISHED,
    deletedAt: null,
  })
    .sort({ dueAt: 1 })
    .limit(50)
    .select('title dueAt course type maxMarks')
    .lean()

  const byAssignment = new Map(submissions.map((s) => [String(s.assignment?._id || s.assignment), s]))
  const pending = published.filter((a) => {
    const sub = byAssignment.get(String(a._id))
    return !sub || ![SUBMISSION_STATUS.APPROVED, SUBMISSION_STATUS.SUBMITTED, SUBMISSION_STATUS.UNDER_REVIEW].includes(sub.status)
  })
  const upcoming = published
    .filter((a) => a.dueAt && new Date(a.dueAt) > now)
    .slice(0, 8)
  const recentFeedback = submissions
    .filter((s) => s.teacherFeedback && s.reviewedAt)
    .slice(0, 5)

  return {
    pendingAssignments: pending.slice(0, 10),
    submitted: submissions.filter((s) => s.status !== SUBMISSION_STATUS.DRAFT).slice(0, 10),
    upcomingDeadlines: upcoming,
    recentFeedback,
  }
}

async function teacherDashboard(userId) {
  const toReview = await AssignmentSubmission.find({
    status: { $in: [SUBMISSION_STATUS.SUBMITTED, SUBMISSION_STATUS.UNDER_REVIEW] },
  })
    .sort({ submittedAt: 1 })
    .limit(20)
    .populate('assignment', 'title')
    .populate('student', 'fullName email')
    .lean()

  const recent = await AssignmentSubmission.find({
    status: { $in: [SUBMISSION_STATUS.SUBMITTED, SUBMISSION_STATUS.APPROVED, SUBMISSION_STATUS.NEEDS_REVISION] },
  })
    .sort({ submittedAt: -1 })
    .limit(10)
    .populate('assignment', 'title')
    .populate('student', 'fullName')
    .lean()

  const reviewed = await AssignmentSubmission.find({
    reviewedBy: userId,
    reviewedAt: { $ne: null },
    submittedAt: { $ne: null },
  })
    .select('submittedAt reviewedAt')
    .limit(100)
    .lean()

  const avgReviewMs =
    reviewed.length > 0
      ? reviewed.reduce((s, r) => s + (new Date(r.reviewedAt) - new Date(r.submittedAt)), 0) /
        reviewed.length
      : 0

  return {
    assignmentsToReview: toReview,
    recentlySubmitted: recent,
    averageReviewTimeHours: Math.round((avgReviewMs / 3600000) * 10) / 10,
  }
}

async function adminDashboard() {
  const [total, submissions, approved] = await Promise.all([
    Assignment.countDocuments({ deletedAt: null }),
    AssignmentSubmission.countDocuments({ status: { $ne: SUBMISSION_STATUS.DRAFT } }),
    AssignmentSubmission.countDocuments({ status: SUBMISSION_STATUS.APPROVED }),
  ])
  return {
    totalAssignments: total,
    totalSubmissions: submissions,
    approvedSubmissions: approved,
    approvalRate: submissions ? Math.round((approved / submissions) * 100) : 0,
  }
}

async function getAnalytics(query = {}) {
  const match = { deletedAt: null }
  if (query.course) match.course = query.course

  const assignments = await Assignment.find(match)
    .select('title type submissionCount approvedCount averageMarks dueAt')
    .lean()

  const late = await AssignmentSubmission.countDocuments({ isLate: true })
  const totalSubs = await AssignmentSubmission.countDocuments({
    status: { $ne: SUBMISSION_STATUS.DRAFT },
  })

  const mostDifficult = [...assignments]
    .sort((a, b) => (a.averageMarks || 0) - (b.averageMarks || 0))
    .slice(0, 10)

  return {
    totals: {
      assignments: assignments.length,
      submissions: totalSubs,
      lateSubmissionRate: totalSubs ? Math.round((late / totalSubs) * 100) : 0,
      averageMarks:
        assignments.length > 0
          ? Math.round(
              (assignments.reduce((s, a) => s + (a.averageMarks || 0), 0) / assignments.length) * 10
            ) / 10
          : 0,
    },
    mostDifficult,
    items: assignments.map((a) => ({
      ...a,
      submissionRate: a.submissionCount || 0,
      approvalRate: a.submissionCount
        ? Math.round(((a.approvedCount || 0) / a.submissionCount) * 100)
        : 0,
    })),
  }
}

async function updateRubrics(assignmentId, rubrics, userId) {
  if (!Array.isArray(rubrics) || !rubrics.length) {
    throw new ApiError(400, 'rubrics array required')
  }
  return assignmentRepo.update(assignmentId, { rubrics, updatedBy: userId })
}

module.exports = {
  listAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  publishAssignment,
  archiveAssignment,
  deleteAssignment,
  restoreAssignment,
  saveDraft,
  submitAssignment,
  resubmitAssignment,
  getSubmission,
  listSubmissions,
  studentHistory,
  gradeSubmission,
  studentDashboard,
  teacherDashboard,
  adminDashboard,
  getAnalytics,
  updateRubrics,
}
