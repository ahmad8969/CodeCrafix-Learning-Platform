const quizRepo = require('../repositories/quiz.repository')
const Quiz = require('../models/Quiz')
const QuizAttempt = require('../models/QuizAttempt')
const PracticeQuestion = require('../models/PracticeQuestion')
const User = require('../models/User')
const { ApiError } = require('../utils/helpers')
const { assertCourseAccess } = require('../utils/curriculum-access')
const { ROLES } = require('../constants')
const { QUIZ_STATUS, QUIZ_ATTEMPT_STATUS, QUIZ_NOTIFY } = require('../constants/quiz')
const { selectQuestionsForQuiz, publicQuestion } = require('./quiz-selection.service')
const { gradeAttempt } = require('./quiz-grading.service')
const notificationService = require('./notification.service')
const progressService = require('./progress.service')

function isStaff(role) {
  return [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.TEACHER].includes(role)
}

async function notifyMany(userIds, payload) {
  await Promise.all(
    [...new Set((userIds || []).filter(Boolean).map(String))].map((userId) =>
      notificationService.notifyUser({ userId, ...payload })
    )
  )
}

function recomputeTotals(quizDoc) {
  const itemMarks = (quizDoc.items || []).reduce((s, i) => s + (i.marks || 0), 0)
  const poolMarks = (quizDoc.poolRules || []).reduce(
    (s, r) => s + (r.count || 0) * (r.marksEach || 0),
    0
  )
  quizDoc.totalMarks = itemMarks + poolMarks
  quizDoc.totalQuestions =
    (quizDoc.items || []).length + (quizDoc.poolRules || []).reduce((s, r) => s + (r.count || 0), 0)
}

async function listQuizzes(query, reqContext) {
  if (reqContext.courseScope === 'published') {
    query.status = query.status || QUIZ_STATUS.PUBLISHED
  }
  return quizRepo.list(query)
}

async function getQuiz(id, reqContext) {
  const quiz = await quizRepo.findById(id)
  if (!quiz || (quiz.deletedAt && !isStaff(reqContext.role))) {
    throw new ApiError(404, 'Quiz not found')
  }
  await assertCourseAccess(quiz.course._id || quiz.course, reqContext)
  if (!isStaff(reqContext.role) && quiz.status !== QUIZ_STATUS.PUBLISHED) {
    throw new ApiError(404, 'Quiz not found')
  }
  return quiz
}

async function createQuiz(payload, userId) {
  if (!payload.course) throw new ApiError(400, 'course is required')
  const slug = await quizRepo.uniqueSlug(payload.title, payload.course)
  const doc = await quizRepo.create({
    ...payload,
    slug,
    createdBy: userId,
    updatedBy: userId,
  })
  recomputeTotals(doc)
  await doc.save()
  return doc
}

async function updateQuiz(id, payload, userId) {
  const existing = await quizRepo.findById(id)
  if (!existing || existing.deletedAt) throw new ApiError(404, 'Quiz not found')
  if (payload.title) {
    payload.slug = await quizRepo.uniqueSlug(payload.title, payload.course || existing.course, id)
  }
  const updated = await quizRepo.update(id, { ...payload, updatedBy: userId })
  recomputeTotals(updated)
  await updated.save()
  return updated
}

async function publishQuiz(id, userId, reqContext) {
  const quiz = await getQuiz(id, { ...reqContext, role: reqContext.role || ROLES.ADMIN })
  const updated = await quizRepo.update(id, {
    status: QUIZ_STATUS.PUBLISHED,
    publishAt: new Date(),
    updatedBy: userId,
  })
  const students = await User.find({ role: ROLES.STUDENT, status: 'active' })
    .select('_id')
    .limit(200)
    .lean()
  await notifyMany(
    students.map((s) => s._id),
    {
      templateKey: QUIZ_NOTIFY.PUBLISHED,
      title: 'New quiz published',
      body: `"${quiz.title}" is now available.`,
      link: `/student/quizzes/${quiz._id}`,
      meta: { quizId: quiz._id },
    }
  )
  return updated
}

async function archiveQuiz(id, userId) {
  return quizRepo.update(id, { status: QUIZ_STATUS.ARCHIVED, updatedBy: userId })
}

async function deleteQuiz(id) {
  const doc = await quizRepo.softDelete(id)
  if (!doc) throw new ApiError(404, 'Quiz not found')
  return doc
}

async function restoreQuiz(id) {
  const doc = await quizRepo.restore(id)
  if (!doc) throw new ApiError(404, 'Quiz not found')
  return doc
}

async function duplicateQuiz(id, userId) {
  const src = await quizRepo.findById(id)
  if (!src) throw new ApiError(404, 'Quiz not found')
  const obj = src.toObject()
  delete obj._id
  delete obj.createdAt
  delete obj.updatedAt
  obj.title = `${obj.title} (Copy)`
  obj.slug = await quizRepo.uniqueSlug(obj.title, obj.course._id || obj.course)
  obj.status = QUIZ_STATUS.DRAFT
  obj.attemptCount = 0
  obj.passCount = 0
  obj.createdBy = userId
  obj.updatedBy = userId
  obj.deletedAt = null
  return quizRepo.create(obj)
}

async function startAttempt(userId, quizId, reqContext, { clientFingerprint } = {}) {
  const quiz = await getQuiz(quizId, reqContext)
  const now = new Date()

  if (quiz.startAt && now < new Date(quiz.startAt)) {
    throw new ApiError(403, 'Quiz has not started yet')
  }
  if (quiz.endAt && now > new Date(quiz.endAt)) {
    throw new ApiError(403, 'Quiz window has ended')
  }

  const existingInProgress = await QuizAttempt.findOne({
    student: userId,
    quiz: quizId,
    status: QUIZ_ATTEMPT_STATUS.IN_PROGRESS,
  })
  if (existingInProgress) {
    if (!quiz.resumeSupport) {
      throw new ApiError(409, 'An attempt is already in progress')
    }
    return sanitizeAttemptForStudent(existingInProgress)
  }

  const priorCount = await QuizAttempt.countDocuments({
    student: userId,
    quiz: quizId,
    status: { $ne: QUIZ_ATTEMPT_STATUS.IN_PROGRESS },
  })
  if (quiz.maxAttempts > 0 && priorCount >= quiz.maxAttempts) {
    throw new ApiError(429, 'Maximum attempts reached')
  }

  const questions = await selectQuestionsForQuiz(quiz)
  if (!questions.length) throw new ApiError(400, 'Quiz has no questions configured')

  const endsAt =
    quiz.timeLimitMinutes > 0
      ? new Date(now.getTime() + quiz.timeLimitMinutes * 60 * 1000)
      : null

  const attempt = await QuizAttempt.create({
    student: userId,
    course: quiz.course._id || quiz.course,
    batch: quiz.batch,
    quiz: quiz._id,
    attemptNumber: priorCount + 1,
    status: QUIZ_ATTEMPT_STATUS.IN_PROGRESS,
    startedAt: now,
    endsAt,
    questions,
    answers: [],
    maxMarks: questions.reduce((s, q) => s + (q.marks || 1), 0),
    clientFingerprint: clientFingerprint || '',
  })

  return sanitizeAttemptForStudent(attempt)
}

function sanitizeAttemptForStudent(attempt, { includeAnalysis = false, quiz } = {}) {
  const obj = typeof attempt.toObject === 'function' ? attempt.toObject() : { ...attempt }
  obj.questions = (obj.questions || []).map((q) => publicQuestion(q))
  if (!includeAnalysis || (quiz && !quiz.showCorrectAnswers && !quiz.enableReview)) {
    // strip correctness from answers until allowed
    if (!includeAnalysis) {
      obj.answers = (obj.answers || []).map((a) => ({
        questionKey: a.questionKey,
        type: a.type,
        selectedOptionIds: a.selectedOptionIds,
        textAnswer: a.textAnswer,
        codeSnapshot: a.codeSnapshot,
        stdout: a.stdout,
        bookmarked: a.bookmarked,
        skipped: a.skipped,
        reviewedLater: a.reviewedLater,
      }))
      delete obj.analysis
      obj.marks = undefined
      obj.percentage = undefined
      obj.passed = undefined
    }
  }
  return obj
}

async function saveProgress(userId, attemptId, { answers }, reqContext) {
  const attempt = await QuizAttempt.findById(attemptId)
  if (!attempt) throw new ApiError(404, 'Attempt not found')
  if (String(attempt.student) !== String(userId) && !isStaff(reqContext.role)) {
    throw new ApiError(403, 'Not your attempt')
  }
  if (attempt.status !== QUIZ_ATTEMPT_STATUS.IN_PROGRESS) {
    throw new ApiError(400, 'Attempt is locked')
  }
  if (attempt.endsAt && new Date() > new Date(attempt.endsAt)) {
    return submitAttempt(userId, attemptId, { answers, auto: true }, reqContext)
  }

  const map = Object.fromEntries((attempt.answers || []).map((a) => [a.questionKey, a]))
  for (const a of answers || []) {
    map[a.questionKey] = {
      ...(map[a.questionKey] || {}),
      ...a,
      questionKey: a.questionKey,
      type: a.type || map[a.questionKey]?.type,
    }
  }
  attempt.answers = Object.values(map)
  await attempt.save()
  return sanitizeAttemptForStudent(attempt)
}

async function awardQuizXp(userId, courseId, quiz, result) {
  const badges = []
  let baseXp = 0
  if (result.passed) {
    baseXp = quiz.xpReward || 75
    if (result.percentage >= 100) {
      badges.push('perfect_score')
      baseXp += 25
    }
  }
  if (result.timeTakenSeconds > 0 && quiz.timeLimitMinutes > 0) {
    const limitSec = quiz.timeLimitMinutes * 60
    if (result.timeTakenSeconds <= limitSec * 0.5 && result.passed) {
      badges.push('fast_finisher')
      baseXp += 15
    }
  }

  let xpAwarded = 0
  if (result.passed && courseId) {
    try {
      const gamificationService = require('./gamification.service')
      const awarded = await gamificationService.awardXp({
        userId,
        courseId,
        event: gamificationService.XP_EVENTS.QUIZ_COMPLETION,
        amount: baseXp,
        reason: `Quiz: ${quiz.title || 'completed'}`,
        meta: {
          refId: `quiz-${userId}-${quiz._id}-${result.attemptId || ''}`,
          quizId: quiz._id,
          perfect: result.percentage >= 100,
          percentage: result.percentage,
        },
      })
      xpAwarded = awarded.xpAwarded || 0
      for (const key of badges) {
        await gamificationService.awardBadge({ userId, badgeKey: key, source: 'quiz' })
      }
    } catch {
      /* fallback to legacy course ledger */
      const { StudentGamification } = require('../models/Gamification')
      await StudentGamification.findOneAndUpdate(
        { user: userId, course: courseId },
        {
          $inc: { xp: baseXp, dailyXp: baseXp, weeklyXp: baseXp },
          $addToSet: { badgesUnlocked: { $each: badges } },
          $setOnInsert: { user: userId, course: courseId, level: 1 },
        },
        { upsert: true }
      )
      xpAwarded = baseXp
    }
  }

  return { xpAwarded, badgesEarned: badges }
}

async function submitAttempt(userId, attemptId, { answers, auto = false } = {}, reqContext) {
  const attempt = await QuizAttempt.findById(attemptId).select('+questions.correctOptionIds +questions.acceptedAnswers')
  if (!attempt) throw new ApiError(404, 'Attempt not found')
  if (String(attempt.student) !== String(userId) && !isStaff(reqContext.role)) {
    throw new ApiError(403, 'Not your attempt')
  }
  if (attempt.status !== QUIZ_ATTEMPT_STATUS.IN_PROGRESS) {
    throw new ApiError(400, 'Attempt already submitted')
  }

  if (answers?.length) {
    const map = Object.fromEntries((attempt.answers || []).map((a) => [a.questionKey, a]))
    for (const a of answers) {
      map[a.questionKey] = { ...(map[a.questionKey] || {}), ...a, questionKey: a.questionKey }
    }
    attempt.answers = Object.values(map)
  }

  const quiz = await quizRepo.findById(attempt.quiz)
  const graded = await gradeAttempt(attempt, quiz)
  const now = new Date()
  const timeTaken = Math.max(0, Math.round((now - new Date(attempt.startedAt)) / 1000))

  attempt.answers = graded.answers
  attempt.marks = graded.marks
  attempt.maxMarks = graded.maxMarks
  attempt.percentage = graded.percentage
  attempt.passed = graded.passed
  attempt.analysis = graded.analysis
  attempt.submittedAt = now
  attempt.timeTakenSeconds = timeTaken
  attempt.status = auto ? QUIZ_ATTEMPT_STATUS.AUTO_SUBMITTED : QUIZ_ATTEMPT_STATUS.SUBMITTED
  attempt.locked = Boolean(quiz.lockAfterSubmission)

  const xp = await awardQuizXp(userId, attempt.course, quiz, {
    passed: graded.passed,
    percentage: graded.percentage,
    timeTakenSeconds: timeTaken,
  })
  attempt.xpAwarded = xp.xpAwarded
  attempt.badgesEarned = xp.badgesEarned
  await attempt.save()

  await Quiz.findByIdAndUpdate(quiz._id, {
    $inc: {
      attemptCount: 1,
      passCount: graded.passed ? 1 : 0,
    },
  })
  // rolling average
  const avg =
    ((quiz.averageScore || 0) * (quiz.attemptCount || 0) + graded.percentage) /
    ((quiz.attemptCount || 0) + 1)
  const avgTime =
    ((quiz.averageTimeSeconds || 0) * (quiz.attemptCount || 0) + timeTaken) /
    ((quiz.attemptCount || 0) + 1)
  await Quiz.findByIdAndUpdate(quiz._id, {
    averageScore: Math.round(avg * 10) / 10,
    averageTimeSeconds: Math.round(avgTime),
  })

  await progressService.trackProgress({
    userId,
    courseId: attempt.course,
    eventType: 'quiz_completed',
    value: graded.percentage,
    meta: { quizId: quiz._id, passed: graded.passed, attemptId: attempt._id },
  })

  await notifyMany([userId], {
    templateKey: QUIZ_NOTIFY.SUBMITTED,
    title: auto ? 'Quiz auto-submitted' : 'Quiz submitted',
    body: `"${quiz.title}" — ${graded.percentage}% (${graded.passed ? 'Passed' : 'Failed'})`,
    link: `/student/quizzes/${quiz._id}/attempts/${attempt._id}`,
  })

  if (quiz.showResultImmediately) {
    await notifyMany([userId], {
      templateKey: QUIZ_NOTIFY.RESULT_PUBLISHED,
      title: 'Quiz result ready',
      body: `Your result for "${quiz.title}" is available.`,
      link: `/student/quizzes/${quiz._id}/attempts/${attempt._id}`,
    })
  }

  return buildResultPayload(attempt, quiz)
}

function buildResultPayload(attempt, quiz) {
  const showAnswers = quiz.showCorrectAnswers && (quiz.showResultImmediately || attempt.status !== QUIZ_ATTEMPT_STATUS.IN_PROGRESS)
  const questions = (attempt.questions || []).map((q) => {
    const pub = publicQuestion(q)
    if (showAnswers) {
      pub.correctOptionIds = q.correctOptionIds
      pub.acceptedAnswers = q.acceptedAnswers
    }
    return pub
  })

  return {
    attemptId: attempt._id,
    status: attempt.status,
    marks: attempt.marks,
    maxMarks: attempt.maxMarks,
    percentage: attempt.percentage,
    passed: attempt.passed,
    timeTakenSeconds: attempt.timeTakenSeconds,
    xpAwarded: attempt.xpAwarded,
    badgesEarned: attempt.badgesEarned,
    analysis: attempt.analysis,
    answers: attempt.answers,
    questions: quiz.enableReview ? questions : questions.map(({ correctOptionIds, acceptedAnswers, ...rest }) => rest),
    showCorrectAnswers: showAnswers,
    quiz: {
      _id: quiz._id,
      title: quiz.title,
      passingPercentage: quiz.passingPercentage,
      enableReview: quiz.enableReview,
    },
  }
}

async function getAttempt(userId, attemptId, reqContext) {
  const attempt = await QuizAttempt.findById(attemptId).select(
    '+questions.correctOptionIds +questions.acceptedAnswers'
  )
  if (!attempt) throw new ApiError(404, 'Attempt not found')
  await assertCourseAccess(attempt.course, reqContext)
  if (String(attempt.student) !== String(userId) && !isStaff(reqContext.role)) {
    throw new ApiError(403, 'Not your attempt')
  }

  // Auto-submit if timer expired
  if (
    attempt.status === QUIZ_ATTEMPT_STATUS.IN_PROGRESS &&
    attempt.endsAt &&
    new Date() > new Date(attempt.endsAt)
  ) {
    return submitAttempt(userId, attemptId, { auto: true }, reqContext)
  }

  const quiz = await quizRepo.findById(attempt.quiz)
  if (attempt.status === QUIZ_ATTEMPT_STATUS.IN_PROGRESS) {
    return sanitizeAttemptForStudent(attempt)
  }
  if (!quiz.showResultImmediately && !isStaff(reqContext.role)) {
    return {
      attemptId: attempt._id,
      status: attempt.status,
      message: 'Results will be published by your instructor.',
    }
  }
  return buildResultPayload(attempt, quiz)
}

async function listAttemptsForQuiz(quizId, reqContext) {
  await getQuiz(quizId, reqContext)
  return QuizAttempt.find({ quiz: quizId, status: { $ne: QUIZ_ATTEMPT_STATUS.IN_PROGRESS } })
    .sort({ submittedAt: -1 })
    .populate('student', 'fullName email')
    .select('student attemptNumber marks percentage passed timeTakenSeconds status submittedAt')
    .lean()
}

async function studentQuizHistory(userId, quizId) {
  return QuizAttempt.find({
    student: userId,
    quiz: quizId,
    status: { $ne: QUIZ_ATTEMPT_STATUS.IN_PROGRESS },
  })
    .sort({ attemptNumber: -1 })
    .select('attemptNumber marks percentage passed timeTakenSeconds status submittedAt xpAwarded badgesEarned')
    .lean()
}

async function getLeaderboard(quizId, { limit = 20 } = {}) {
  const mongoose = require('mongoose')
  const oid = new mongoose.Types.ObjectId(String(quizId))
  const rows = await QuizAttempt.aggregate([
    {
      $match: {
        quiz: oid,
        status: { $in: [QUIZ_ATTEMPT_STATUS.SUBMITTED, QUIZ_ATTEMPT_STATUS.AUTO_SUBMITTED] },
      },
    },
    { $sort: { percentage: -1, timeTakenSeconds: 1 } },
    {
      $group: {
        _id: '$student',
        bestPercentage: { $first: '$percentage' },
        bestMarks: { $first: '$marks' },
        fastestTime: { $first: '$timeTakenSeconds' },
        attempts: { $sum: 1 },
      },
    },
    { $sort: { bestPercentage: -1, fastestTime: 1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'student',
      },
    },
    { $unwind: '$student' },
    {
      $project: {
        studentId: '$_id',
        fullName: '$student.fullName',
        bestPercentage: 1,
        bestMarks: 1,
        fastestTime: 1,
        attempts: 1,
      },
    },
  ])

  return { quizId, entries: rows }
}

async function getAnalytics(query = {}) {
  const match = { deletedAt: null }
  if (query.course) match.course = query.course
  const quizzes = await Quiz.find(match)
    .select('title attemptCount passCount averageScore averageTimeSeconds')
    .lean()

  const missed = await QuizAttempt.aggregate([
    { $match: { status: { $in: ['submitted', 'auto_submitted'] } } },
    { $unwind: '$answers' },
    { $match: { 'answers.isCorrect': false, 'answers.skipped': false } },
    { $group: { _id: '$answers.questionKey', misses: { $sum: 1 }, type: { $first: '$answers.type' } } },
    { $sort: { misses: -1 } },
    { $limit: 10 },
  ])

  return {
    totals: {
      quizzes: quizzes.length,
      attempts: quizzes.reduce((s, q) => s + (q.attemptCount || 0), 0),
      passRate:
        quizzes.reduce((s, q) => s + (q.attemptCount || 0), 0) > 0
          ? Math.round(
              (quizzes.reduce((s, q) => s + (q.passCount || 0), 0) /
                quizzes.reduce((s, q) => s + (q.attemptCount || 0), 0)) *
                100
            )
          : 0,
      averageScore:
        quizzes.length > 0
          ? Math.round(
              (quizzes.reduce((s, q) => s + (q.averageScore || 0), 0) / quizzes.length) * 10
            ) / 10
          : 0,
    },
    quizzes,
    mostMissedQuestions: missed,
  }
}

async function questionPool(query = {}) {
  const filter = { deletedAt: null, status: 'published' }
  if (query.category) filter.category = query.category
  if (query.difficulty) filter.difficulty = query.difficulty
  if (query.type) filter.type = query.type
  if (query.language) filter.languageIds = query.language
  const items = await PracticeQuestion.find(filter)
    .select('title type difficulty category tags languageIds xpReward')
    .sort({ updatedAt: -1 })
    .limit(Number(query.limit) || 50)
    .lean()
  return { items }
}

async function studentDashboard(userId) {
  const published = await Quiz.find({ status: QUIZ_STATUS.PUBLISHED, deletedAt: null })
    .sort({ startAt: 1 })
    .limit(30)
    .select('title startAt endAt timeLimitMinutes passingPercentage course totalQuestions totalMarks')
    .lean()
  const attempts = await QuizAttempt.find({ student: userId })
    .sort({ updatedAt: -1 })
    .limit(20)
    .populate('quiz', 'title')
    .lean()
  return {
    availableQuizzes: published,
    recentAttempts: attempts,
    inProgress: attempts.filter((a) => a.status === QUIZ_ATTEMPT_STATUS.IN_PROGRESS),
  }
}

async function teacherDashboard() {
  const [drafts, published, recentAttempts] = await Promise.all([
    Quiz.countDocuments({ status: QUIZ_STATUS.DRAFT, deletedAt: null }),
    Quiz.countDocuments({ status: QUIZ_STATUS.PUBLISHED, deletedAt: null }),
    QuizAttempt.find({
      status: { $in: [QUIZ_ATTEMPT_STATUS.SUBMITTED, QUIZ_ATTEMPT_STATUS.AUTO_SUBMITTED] },
    })
      .sort({ submittedAt: -1 })
      .limit(12)
      .populate('quiz', 'title')
      .populate('student', 'fullName email')
      .select('quiz student marks percentage passed submittedAt status attemptNumber')
      .lean(),
  ])
  return { drafts, published, recentAttempts }
}

module.exports = {
  listQuizzes,
  getQuiz,
  createQuiz,
  updateQuiz,
  publishQuiz,
  archiveQuiz,
  deleteQuiz,
  restoreQuiz,
  duplicateQuiz,
  startAttempt,
  saveProgress,
  submitAttempt,
  getAttempt,
  listAttemptsForQuiz,
  studentQuizHistory,
  getLeaderboard,
  getAnalytics,
  questionPool,
  studentDashboard,
  teacherDashboard,
  buildResultPayload,
}
