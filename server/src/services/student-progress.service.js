const mongoose = require('mongoose')
const Lesson = require('../models/Lesson')
const LessonView = require('../models/LessonView')
const ProgressEvent = require('../models/ProgressEvent')
const QuizAttempt = require('../models/QuizAttempt')
const PracticeProgress = require('../models/PracticeProgress')
const AssignmentSubmission = require('../models/AssignmentSubmission')
const Enrollment = require('../models/Enrollment')
const Module = require('../models/Module')
const Topic = require('../models/Topic')
const Week = require('../models/Week')
const User = require('../models/User')
const Batch = require('../models/Batch')
const Course = require('../models/Course')
const { StudentProgress } = require('../models/StudentProgress')
const { ENROLLMENT_STATUS } = require('../constants/enrollment')
const learningPath = require('./learning-path.service')
const { trackProgress, summaryForUser, trackAnalytics } = require('./progress.service')

async function recomputeStudentProgress(studentId, courseId) {
  const lessons = await Lesson.find({ course: courseId, deletedAt: null }).select('_id topic module week').lean()
  const lessonIds = lessons.map((l) => l._id)
  const completedViews = await LessonView.find({
    user: studentId,
    lesson: { $in: lessonIds },
    completed: true,
  }).lean()

  const practiceCompleted = await PracticeProgress.countDocuments({
    user: studentId,
    course: courseId,
    completed: true,
  })
  const assignmentsCompleted = await AssignmentSubmission.countDocuments({
    student: studentId,
    status: 'approved',
  })
  const quizAttempts = await QuizAttempt.find({
    student: studentId,
    course: courseId,
    status: { $in: ['submitted', 'auto_submitted'] },
  }).lean()
  const quizzesCompleted = quizAttempts.length
  const quizzesPassed = quizAttempts.filter((q) => q.passed).length

  const codingEvents = await ProgressEvent.find({
    user: studentId,
    course: courseId,
    eventType: 'coding_time',
  })
    .select('value')
    .lean()
  const readingEvents = await ProgressEvent.find({
    user: studentId,
    course: courseId,
    eventType: { $in: ['active_time', 'lesson_completed'] },
  })
    .select('value eventType')
    .lean()

  const codingTimeSeconds = codingEvents.reduce((s, e) => s + (e.value || 0), 0)
  const readingTimeSeconds = readingEvents
    .filter((e) => e.eventType === 'active_time')
    .reduce((s, e) => s + (e.value || 0), 0)

  const lessonsCompleted = completedViews.length
  const lessonsTotal = lessons.length || 1
  const overallCompletion = Math.min(100, Math.round((lessonsCompleted / lessonsTotal) * 100))

  // Current position: first incomplete lesson in order
  const ordered = await Lesson.find({ course: courseId, deletedAt: null, status: 'published' })
    .sort({ displayOrder: 1 })
    .select('_id topic module week')
    .lean()
  const doneSet = new Set(completedViews.map((v) => String(v.lesson)))
  const current = ordered.find((l) => !doneSet.has(String(l._id))) || ordered[ordered.length - 1] || null

  const completedTopicIds = []
  const topicIds = [...new Set(lessons.map((l) => String(l.topic)))]
  for (const tid of topicIds) {
    if (await learningPath.isTopicCompleted(studentId, tid)) {
      completedTopicIds.push(tid)
    }
  }

  const lastActivity = await ProgressEvent.findOne({ user: studentId, course: courseId })
    .sort({ occurredAt: -1 })
    .lean()
  const lastView = await LessonView.findOne({ user: studentId, course: courseId })
    .sort({ lastViewedAt: -1 })
    .lean()

  const enrollment = await Enrollment.findOne({
    student: studentId,
    course: courseId,
    status: ENROLLMENT_STATUS.ACTIVE,
    deletedAt: null,
  })

  const streakSummary = await summaryForUser(studentId)
  const learningStreak = streakSummary.byType?.daily_streak?.total || 0

  const doc = await StudentProgress.findOneAndUpdate(
    { student: studentId, course: courseId },
    {
      student: studentId,
      course: courseId,
      enrollment: enrollment?._id || null,
      batch: enrollment?.batch || null,
      currentModule: current?.module || null,
      currentWeek: current?.week || null,
      currentTopic: current?.topic || null,
      currentLesson: current?._id || null,
      lessonsCompleted,
      lessonsTotal: lessons.length,
      practiceCompleted,
      assignmentsCompleted,
      quizzesCompleted,
      quizzesPassed,
      codingTimeSeconds,
      readingTimeSeconds,
      overallCompletion,
      learningStreak,
      lastActivityAt: lastActivity?.occurredAt || lastView?.lastViewedAt || null,
      completedTopicIds,
    },
    { upsert: true, new: true }
  )
    .populate('currentModule', 'name')
    .populate('currentWeek', 'name')
    .populate('currentTopic', 'name')
    .populate('currentLesson', 'title')

  if (enrollment) {
    enrollment.overallProgress = overallCompletion
    if (overallCompletion >= 100 && enrollment.status === ENROLLMENT_STATUS.ACTIVE) {
      enrollment.status = ENROLLMENT_STATUS.COMPLETED
      enrollment.completedAt = new Date()
      await trackProgress({
        userId: studentId,
        courseId,
        eventType: 'course_completed',
        value: 100,
      })
    }
    await enrollment.save()
  }

  return doc
}

async function getContinueLearning(studentId) {
  // Prefer incomplete lesson on enrolled course
  const enrollments = await Enrollment.find({
    student: studentId,
    status: ENROLLMENT_STATUS.ACTIVE,
    deletedAt: null,
  })
    .select('course')
    .lean()
  const courseIds = enrollments.map((e) => e.course)

  if (!courseIds.length) {
    const fallback = await LessonView.find({ user: studentId, completed: false })
      .sort({ lastViewedAt: -1 })
      .limit(1)
      .populate('lesson', 'title course')
      .populate('course', 'title')
      .lean()
    return fallback[0] || null
  }

  const incomplete = await LessonView.find({
    user: studentId,
    course: { $in: courseIds },
    completed: false,
  })
    .sort({ lastViewedAt: -1 })
    .limit(1)
    .populate('lesson', 'title course estimatedReadingTime')
    .populate('course', 'title slug')
    .lean()

  if (incomplete[0]) return incomplete[0]

  // Next unfinished published lesson across enrollments
  for (const courseId of courseIds) {
    const progress = await recomputeStudentProgress(studentId, courseId)
    if (progress.currentLesson) {
      const lesson = await Lesson.findById(progress.currentLesson).select('title course estimatedReadingTime')
      const course = await Course.findById(courseId).select('title slug')
      return {
        lesson,
        course,
        lastViewedAt: progress.lastActivityAt,
        completed: false,
        fromPath: true,
      }
    }
  }
  return null
}

async function getProgressTimeline(studentId, courseId, { limit = 40 } = {}) {
  const events = await ProgressEvent.find({
    user: studentId,
    ...(courseId ? { course: courseId } : {}),
    eventType: {
      $in: [
        'enrollment_started',
        'lesson_completed',
        'practice_completed',
        'assignment_submitted',
        'quiz_completed',
        'topic_completed',
        'topic_unlocked',
        'course_completed',
      ],
    },
  })
    .sort({ occurredAt: -1 })
    .limit(limit)
    .lean()

  return {
    items: events.map((e) => ({
      id: e._id,
      type: e.eventType,
      value: e.value,
      meta: e.meta,
      at: e.occurredAt,
      label: timelineLabel(e.eventType),
    })),
  }
}

function timelineLabel(type) {
  const map = {
    enrollment_started: 'Started',
    lesson_completed: 'Lesson Completed',
    practice_completed: 'Practice Completed',
    assignment_submitted: 'Assignment Submitted',
    quiz_completed: 'Quiz Passed',
    topic_completed: 'Topic Completed',
    topic_unlocked: 'Next Topic Unlocked',
    course_completed: 'Course Completed',
  }
  return map[type] || type
}

async function studentProgressReport(studentId, courseId) {
  const progress = await recomputeStudentProgress(studentId, courseId)
  const path = await learningPath.getCourseLearningPath(studentId, courseId)
  const timeline = await getProgressTimeline(studentId, courseId)
  const student = await User.findById(studentId).select(
    'fullName email phoneNumber profileImage bio guardian address'
  )
  const enrollment = await Enrollment.findOne({
    student: studentId,
    course: courseId,
    deletedAt: null,
  })
    .sort({ createdAt: -1 })
    .populate('batch', 'name batchCode weeklySchedule')
    .populate('course', 'title')

  return { student, enrollment, progress, learningPath: path, timeline }
}

async function batchPerformanceReport(batchId) {
  const batch = await Batch.findById(batchId)
    .populate('course', 'title')
    .populate('teacher', 'fullName email')
  if (!batch) return null
  const enrollments = await Enrollment.find({
    batch: batchId,
    status: { $in: [ENROLLMENT_STATUS.ACTIVE, ENROLLMENT_STATUS.COMPLETED] },
    deletedAt: null,
  })
    .populate('student', 'fullName email')
    .lean()

  const rows = []
  for (const e of enrollments) {
    const p = await StudentProgress.findOne({ student: e.student._id || e.student, course: batch.course._id || batch.course }).lean()
    rows.push({
      student: e.student,
      enrollmentStatus: e.status,
      overallProgress: p?.overallCompletion ?? e.overallProgress ?? 0,
      lessonsCompleted: p?.lessonsCompleted ?? 0,
      quizzesPassed: p?.quizzesPassed ?? 0,
      lastActivityAt: p?.lastActivityAt,
    })
  }

  const avg =
    rows.length > 0 ? Math.round(rows.reduce((s, r) => s + r.overallProgress, 0) / rows.length) : 0
  const weak = rows.filter((r) => r.overallProgress < 40).sort((a, b) => a.overallProgress - b.overallProgress)

  return {
    batch,
    totals: {
      students: rows.length,
      averageProgress: avg,
      completed: rows.filter((r) => r.overallProgress >= 100).length,
      weakCount: weak.length,
    },
    students: rows.sort((a, b) => b.overallProgress - a.overallProgress),
    weakStudents: weak.slice(0, 20),
  }
}

async function courseCompletionReport(courseId) {
  const enrollments = await Enrollment.find({
    course: courseId,
    deletedAt: null,
    status: { $in: [ENROLLMENT_STATUS.ACTIVE, ENROLLMENT_STATUS.COMPLETED] },
  }).lean()
  const completed = enrollments.filter((e) => e.status === ENROLLMENT_STATUS.COMPLETED || e.overallProgress >= 100)
  return {
    courseId,
    enrolled: enrollments.length,
    completed: completed.length,
    completionRate: enrollments.length
      ? Math.round((completed.length / enrollments.length) * 100)
      : 0,
    averageProgress: enrollments.length
      ? Math.round(enrollments.reduce((s, e) => s + (e.overallProgress || 0), 0) / enrollments.length)
      : 0,
  }
}

async function teacherPerformanceReport(teacherId) {
  const batches = await Batch.find({ teacher: teacherId, deletedAt: null }).lean()
  const batchIds = batches.map((b) => b._id)
  const enrollments = await Enrollment.find({
    batch: { $in: batchIds },
    deletedAt: null,
    status: { $in: [ENROLLMENT_STATUS.ACTIVE, ENROLLMENT_STATUS.COMPLETED] },
  }).lean()
  const avg = enrollments.length
    ? Math.round(enrollments.reduce((s, e) => s + (e.overallProgress || 0), 0) / enrollments.length)
    : 0
  return {
    teacherId,
    batches: batches.length,
    students: enrollments.length,
    averageStudentProgress: avg,
    completedStudents: enrollments.filter((e) => e.status === ENROLLMENT_STATUS.COMPLETED).length,
  }
}

async function platformEnrollmentAnalytics() {
  const [
    totalStudents,
    activeBatches,
    newEnrollments,
    enrollments,
    courses,
  ] = await Promise.all([
    User.countDocuments({ role: 'student', status: 'active' }),
    Batch.countDocuments({ deletedAt: null, status: { $in: ['upcoming', 'active'] } }),
    Enrollment.countDocuments({
      deletedAt: null,
      enrolledAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    }),
    Enrollment.find({
      deletedAt: null,
      status: { $in: [ENROLLMENT_STATUS.ACTIVE, ENROLLMENT_STATUS.COMPLETED] },
    })
      .select('overallProgress course teacher status')
      .lean(),
    Course.find({ deletedAt: null, status: 'published' }).select('title').lean(),
  ])

  const completionRate = enrollments.length
    ? Math.round(
        (enrollments.filter((e) => e.status === ENROLLMENT_STATUS.COMPLETED || e.overallProgress >= 100)
          .length /
          enrollments.length) *
          100
      )
    : 0

  const byCourse = {}
  for (const e of enrollments) {
    const id = String(e.course)
    byCourse[id] = byCourse[id] || { courseId: id, count: 0, progressSum: 0 }
    byCourse[id].count += 1
    byCourse[id].progressSum += e.overallProgress || 0
  }
  const topCourses = Object.values(byCourse)
    .map((c) => ({
      ...c,
      averageProgress: c.count ? Math.round(c.progressSum / c.count) : 0,
      title: courses.find((x) => String(x._id) === c.courseId)?.title || 'Course',
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  const byTeacher = {}
  for (const e of enrollments) {
    if (!e.teacher) continue
    const id = String(e.teacher)
    byTeacher[id] = byTeacher[id] || { teacherId: id, students: 0, progressSum: 0 }
    byTeacher[id].students += 1
    byTeacher[id].progressSum += e.overallProgress || 0
  }
  const teacherIds = Object.keys(byTeacher)
  const teachers = await User.find({ _id: { $in: teacherIds } }).select('fullName').lean()
  const topTeachers = Object.values(byTeacher)
    .map((t) => ({
      ...t,
      fullName: teachers.find((u) => String(u._id) === t.teacherId)?.fullName || 'Teacher',
      averageProgress: t.students ? Math.round(t.progressSum / t.students) : 0,
    }))
    .sort((a, b) => b.students - a.students)
    .slice(0, 8)

  // Retention proxy: active enrollments older than 14 days still active
  const older = await Enrollment.countDocuments({
    deletedAt: null,
    status: ENROLLMENT_STATUS.ACTIVE,
    enrolledAt: { $lte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
  })
  const withdrawn = await Enrollment.countDocuments({
    deletedAt: null,
    status: ENROLLMENT_STATUS.WITHDRAWN,
    enrolledAt: { $lte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
  })
  const retention = older + withdrawn > 0 ? Math.round((older / (older + withdrawn)) * 100) : 100

  return {
    totals: {
      totalStudents,
      activeBatches,
      newEnrollments,
      courseCompletionRate: completionRate,
      studentRetention: retention,
    },
    topCourses,
    topTeachers,
    batchPerformance: await Promise.all(
      (
        await Batch.find({ deletedAt: null, status: { $in: ['active', 'upcoming'] } })
          .limit(10)
          .select('name batchCode currentStudents maximumStudents course')
          .lean()
      ).map(async (b) => {
        const avgProg = await Enrollment.aggregate([
          { $match: { batch: b._id, status: ENROLLMENT_STATUS.ACTIVE, deletedAt: null } },
          { $group: { _id: null, avg: { $avg: '$overallProgress' } } },
        ])
        return {
          ...b,
          averageProgress: Math.round(avgProg[0]?.avg || 0),
        }
      })
    ),
  }
}

module.exports = {
  trackProgress,
  summaryForUser,
  trackAnalytics,
  recomputeStudentProgress,
  getContinueLearning,
  getProgressTimeline,
  studentProgressReport,
  batchPerformanceReport,
  courseCompletionReport,
  teacherPerformanceReport,
  platformEnrollmentAnalytics,
}
