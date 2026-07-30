const crypto = require('crypto')
const questionRepo = require('../repositories/practice-question.repository')
const attemptRepo = require('../repositories/practice-attempt.repository')
const PracticeQuestion = require('../models/PracticeQuestion')
const PracticeProgress = require('../models/PracticeProgress')
const QuestionCategory = require('../models/QuestionCategory')
const { ApiError } = require('../utils/helpers')
const { slugify, parseListQuery, buildPagedResult } = require('../utils/query')
const { evaluateQuestion } = require('./practice-evaluation.service')
const { createPracticeProvider } = require('../config/practice-providers')
const {
  QUESTION_TYPES,
  QUESTION_STATUS,
  ATTEMPT_KIND,
  ATTEMPT_STATUS,
  IMPLEMENTED_QUESTION_TYPES,
} = require('../constants/practice')
const { ROLES } = require('../constants')
const progressService = require('./progress.service')
const { assertCourseAccess } = require('../utils/curriculum-access')

function stripSecrets(question, { forStudent = true } = {}) {
  if (!question) return question
  const q = typeof question.toObject === 'function' ? question.toObject() : { ...question }
  delete q.referenceSolution
  delete q.teacherNotes
  if (forStudent) {
    q.options = (q.options || []).map(({ id, label }) => ({ id, label }))
    q.testCases = (q.testCases || [])
      .filter((t) => t.visibility !== 'hidden')
      .map((t) => ({
        id: t.id,
        label: t.label,
        visibility: t.visibility,
        assertion: t.assertion,
        sampleInput: t.sampleInput,
        sampleOutput: t.sampleOutput,
        expectedOutput: t.visibility === 'public' ? t.expectedOutput : undefined,
        targetPath: t.targetPath,
        pattern: t.visibility === 'public' ? t.pattern : undefined,
        weight: t.weight,
      }))
    q.hiddenTestCount = (question.testCases || []).filter((t) => t.visibility === 'hidden').length
  }
  return q
}

async function ensureUniqueSlug(base, courseId, excludeId) {
  let slug = slugify(base) || `q-${Date.now()}`
  let n = 0
  for (;;) {
    const candidate = n === 0 ? slug : `${slug}-${n}`
    const existing = await PracticeQuestion.findOne({
      slug: candidate,
      course: courseId || null,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    }).lean()
    if (!existing) return candidate
    n += 1
  }
}

async function listQuestions(query, reqContext) {
  const result = await questionRepo.list(query)
  const isStaff = [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.TEACHER].includes(reqContext?.role)
  result.items = result.items.map((q) => stripSecrets(q, { forStudent: !isStaff }))
  return result
}

async function getQuestion(id, reqContext) {
  const isStaff = [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.TEACHER].includes(reqContext?.role)
  const question = await questionRepo.findById(id, { withSecrets: isStaff })
  if (!question || (question.deletedAt && !isStaff)) throw new ApiError(404, 'Question not found')
  if (question.course) await assertCourseAccess(question.course, reqContext)
  if (!isStaff && question.status !== QUESTION_STATUS.PUBLISHED) {
    throw new ApiError(404, 'Question not found')
  }
  return stripSecrets(question, { forStudent: !isStaff })
}

async function createQuestion(payload, userId) {
  if (!IMPLEMENTED_QUESTION_TYPES.includes(payload.type) && payload.type) {
    // allow create for architecture types but mark draft
  }
  const slug = await ensureUniqueSlug(payload.slug || payload.title, payload.course)
  const options = (payload.options || []).map((o) => ({
    id: o.id || crypto.randomBytes(4).toString('hex'),
    label: o.label,
    isCorrect: Boolean(o.isCorrect),
  }))
  const testCases = (payload.testCases || []).map((t, i) => ({
    ...t,
    id: t.id || `t${i + 1}`,
  }))

  const doc = await questionRepo.create({
    ...payload,
    slug,
    options,
    testCases,
    createdBy: userId,
    updatedBy: userId,
  })
  return stripSecrets(doc, { forStudent: false })
}

async function updateQuestion(id, payload, userId) {
  const existing = await questionRepo.findById(id, { withSecrets: true })
  if (!existing || existing.deletedAt) throw new ApiError(404, 'Question not found')

  if (payload.title || payload.slug) {
    payload.slug = await ensureUniqueSlug(payload.slug || payload.title || existing.title, payload.course || existing.course, id)
  }
  if (payload.options) {
    payload.options = payload.options.map((o) => ({
      id: o.id || crypto.randomBytes(4).toString('hex'),
      label: o.label,
      isCorrect: Boolean(o.isCorrect),
    }))
  }
  if (payload.testCases) {
    payload.testCases = payload.testCases.map((t, i) => ({ ...t, id: t.id || `t${i + 1}` }))
  }

  const updated = await questionRepo.update(id, { ...payload, updatedBy: userId })
  return stripSecrets(updated, { forStudent: false })
}

async function archiveQuestion(id) {
  const doc = await questionRepo.softDelete(id)
  if (!doc) throw new ApiError(404, 'Question not found')
  return doc
}

async function restoreQuestion(id) {
  const doc = await questionRepo.restore(id)
  if (!doc) throw new ApiError(404, 'Question not found')
  return doc
}

async function cloneQuestion(id, userId) {
  const src = await questionRepo.findById(id, { withSecrets: true })
  if (!src) throw new ApiError(404, 'Question not found')
  const obj = src.toObject()
  delete obj._id
  delete obj.createdAt
  delete obj.updatedAt
  obj.title = `${obj.title} (Copy)`
  obj.slug = await ensureUniqueSlug(obj.title, obj.course)
  obj.status = QUESTION_STATUS.DRAFT
  obj.attemptCount = 0
  obj.successCount = 0
  obj.createdBy = userId
  obj.updatedBy = userId
  obj.deletedAt = null
  const created = await questionRepo.create(obj)
  return stripSecrets(created, { forStudent: false })
}

async function assignToTopic(topicId, questionIds, { courseId, moduleId, weekId } = {}) {
  if (!Array.isArray(questionIds) || !questionIds.length) {
    throw new ApiError(400, 'questionIds required')
  }
  await PracticeQuestion.updateMany(
    { _id: { $in: questionIds } },
    {
      $set: {
        topic: topicId,
        ...(courseId ? { course: courseId } : {}),
        ...(moduleId ? { module: moduleId } : {}),
        ...(weekId ? { week: weekId } : {}),
      },
    }
  )
  return { topicId, assigned: questionIds.length }
}

async function listByTopic(topicId, reqContext) {
  const isStaff = [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.TEACHER].includes(reqContext?.role)
  const filter = { topic: topicId, deletedAt: null }
  if (!isStaff) filter.status = QUESTION_STATUS.PUBLISHED
  const items = await PracticeQuestion.find(filter).sort({ displayOrder: 1, createdAt: 1 }).lean()
  return items.map((q) => stripSecrets(q, { forStudent: !isStaff }))
}

async function updateProgressAfterAttempt(userId, question, attempt) {
  const prev = (await attemptRepo.getProgress(userId, question._id)) || {
    attempts: 0,
    runCount: 0,
    submissionCount: 0,
    bestScore: 0,
    totalTimeSeconds: 0,
  }

  const isSubmit = attempt.kind === ATTEMPT_KIND.SUBMIT
  const attempts = prev.attempts + (isSubmit ? 1 : 0)
  const runCount = prev.runCount + (attempt.kind === ATTEMPT_KIND.RUN ? 1 : 0)
  const submissionCount = prev.submissionCount + (isSubmit ? 1 : 0)
  const bestScore = Math.max(prev.bestScore || 0, attempt.score || 0)
  const completed = Boolean(prev.completed) || attempt.status === ATTEMPT_STATUS.PASSED
  const elapsed = Math.max(0, Math.round((attempt.executionTimeMs || 0) / 1000))
  const totalTimeSeconds = (prev.totalTimeSeconds || 0) + elapsed
  const successRate =
    submissionCount > 0
      ? Math.round(((prev.successRate * (submissionCount - 1)) / 100 + (attempt.status === ATTEMPT_STATUS.PASSED ? 1 : 0)) * (100 / submissionCount))
      : prev.successRate || 0

  // simpler success rate
  const passedSubs = completed && attempt.status === ATTEMPT_STATUS.PASSED ? 1 : 0
  const rate =
    submissionCount > 0
      ? Math.round(((bestScore >= 100 ? Math.max(1, submissionCount - attempts + attempts) : 0) / submissionCount) * 100)
      : 0

  return attemptRepo.upsertProgress(userId, question._id, {
    course: question.course,
    topic: question.topic,
    attempts,
    runCount,
    submissionCount,
    bestScore,
    latestScore: isSubmit ? attempt.score : prev.latestScore || 0,
    completed,
    totalTimeSeconds,
    codingTimeSeconds: (prev.codingTimeSeconds || 0) + (question.type === QUESTION_TYPES.CODING ? elapsed : 0),
    averageTimeSeconds: attempts > 0 ? Math.round(totalTimeSeconds / Math.max(attempts, 1)) : 0,
    successRate: submissionCount > 0 ? Math.round((bestScore >= 100 ? 1 : attempt.status === ATTEMPT_STATUS.PASSED ? 1 : 0) * (100 / submissionCount) * submissionCount) : 0,
    lastAttemptAt: new Date(),
  })
}

async function awardXp(userId, question, score, hintsUsed = []) {
  if (score < 100) return { xpAwarded: 0, xpPenalty: 0 }
  const penalty = (question.hints || [])
    .filter((h) => hintsUsed.includes(h.order))
    .reduce((s, h) => s + (h.xpPenalty || 0), 0)
  const xpAwarded = Math.max(0, (question.xpReward || 0) - penalty)
  return { xpAwarded, xpPenalty: penalty }
}

async function runQuestion(userId, questionId, payload, reqContext) {
  const question = await questionRepo.findById(questionId, { withSecrets: true })
  if (!question || question.deletedAt) throw new ApiError(404, 'Question not found')
  if (question.course) await assertCourseAccess(question.course, reqContext)
  if (question.status !== QUESTION_STATUS.PUBLISHED && reqContext.role === ROLES.STUDENT) {
    throw new ApiError(403, 'Question is not published')
  }

  const provider = createPracticeProvider(question.executionEngine || 'browser')
  const exec = await provider.run({
    files: payload.files,
    stdout: payload.stdout,
    consoleLogs: payload.consoleLogs,
    timeLimitMs: question.timeLimitMs,
  })

  const evaluation = evaluateQuestion(
    question,
    {
      files: payload.files,
      stdout: exec.stdout || payload.stdout,
      consoleLogs: payload.consoleLogs,
      selectedOptionIds: payload.selectedOptionIds,
    },
    { mode: 'run' }
  )

  const attempt = await attemptRepo.createAttempt({
    user: userId,
    question: question._id,
    course: question.course,
    topic: question.topic,
    kind: ATTEMPT_KIND.RUN,
    status: ATTEMPT_STATUS.RUN,
    files: payload.files || [],
    selectedOptionIds: payload.selectedOptionIds || [],
    stdout: exec.stdout || '',
    stderr: exec.stderr || '',
    consoleLogs: payload.consoleLogs || [],
    publicResults: evaluation.publicResults,
    score: evaluation.score,
    maxScore: evaluation.maxScore,
    executionTimeMs: exec.executionTimeMs || payload.executionTimeMs || 0,
    memoryKb: exec.memoryKb || payload.memoryKb || 0,
    feedback: evaluation.feedback,
    provider: provider.id,
    completedAt: new Date(),
  })

  await updateProgressAfterAttempt(userId, question, attempt)

  return {
    attemptId: attempt._id,
    kind: 'run',
    status: evaluation.status,
    score: evaluation.score,
    maxScore: evaluation.maxScore,
    publicResults: evaluation.publicResults,
    stdout: exec.stdout,
    stderr: exec.stderr,
    executionTimeMs: attempt.executionTimeMs,
    memoryKb: attempt.memoryKb,
    feedback: evaluation.feedback,
    provider: provider.id,
  }
}

async function submitQuestion(userId, questionId, payload, reqContext) {
  const question = await questionRepo.findById(questionId, { withSecrets: true })
  if (!question || question.deletedAt) throw new ApiError(404, 'Question not found')
  if (question.course) await assertCourseAccess(question.course, reqContext)
  if (question.status !== QUESTION_STATUS.PUBLISHED && reqContext.role === ROLES.STUDENT) {
    throw new ApiError(403, 'Question is not published')
  }

  const progress = await attemptRepo.getProgress(userId, questionId)
  if (question.maxAttempts > 0 && (progress?.submissionCount || 0) >= question.maxAttempts) {
    throw new ApiError(429, 'Maximum attempts reached')
  }

  const provider = createPracticeProvider(question.executionEngine || 'browser')
  const exec = await provider.run({
    files: payload.files,
    stdout: payload.stdout,
    consoleLogs: payload.consoleLogs,
    timeLimitMs: question.timeLimitMs,
  })

  const evaluation = evaluateQuestion(
    question,
    {
      files: payload.files,
      stdout: exec.stdout || payload.stdout,
      consoleLogs: payload.consoleLogs,
      selectedOptionIds: payload.selectedOptionIds,
      answerPayload: payload.answerPayload,
    },
    { mode: 'submit' }
  )

  const hintsUsed = payload.hintsUsed || []
  const xp = await awardXp(userId, question, evaluation.score, hintsUsed)

  const attempt = await attemptRepo.createAttempt({
    user: userId,
    question: question._id,
    course: question.course,
    topic: question.topic,
    kind: ATTEMPT_KIND.SUBMIT,
    status: evaluation.status,
    files: payload.files || [],
    selectedOptionIds: payload.selectedOptionIds || [],
    answerPayload: payload.answerPayload || {},
    stdout: exec.stdout || '',
    stderr: exec.stderr || '',
    consoleLogs: payload.consoleLogs || [],
    publicResults: evaluation.publicResults,
    hiddenResults: evaluation.hiddenResults || [],
    hiddenSummary: evaluation.hiddenSummary,
    score: evaluation.score,
    maxScore: evaluation.maxScore,
    executionTimeMs: exec.executionTimeMs || payload.executionTimeMs || 0,
    memoryKb: exec.memoryKb || payload.memoryKb || 0,
    feedback: evaluation.feedback,
    hintsUsed,
    xpAwarded: xp.xpAwarded,
    xpPenalty: xp.xpPenalty,
    provider: provider.id,
    completedAt: new Date(),
  })

  await updateProgressAfterAttempt(userId, question, attempt)

  await PracticeQuestion.findByIdAndUpdate(question._id, {
    $inc: {
      attemptCount: 1,
      successCount: evaluation.status === ATTEMPT_STATUS.PASSED ? 1 : 0,
    },
  })

  if (evaluation.status === ATTEMPT_STATUS.PASSED) {
    await progressService.trackProgress({
      userId,
      courseId: question.course,
      lessonId: null,
      eventType: 'practice_completed',
      value: evaluation.score,
      meta: { questionId: question._id, xp: xp.xpAwarded },
    })
    try {
      const gamificationService = require('./gamification.service')
      const awarded = await gamificationService.awardXp({
        userId,
        courseId: question.course,
        event: gamificationService.XP_EVENTS.PRACTICE_COMPLETION,
        amount: xp.xpAwarded || undefined,
        reason: 'Practice challenge passed',
        meta: { refId: `practice-${userId}-${question._id}`, questionId: question._id },
      })
      xp.xpAwarded = awarded.xpAwarded || xp.xpAwarded
    } catch {
      /* non-blocking */
    }
  }

  return {
    attemptId: attempt._id,
    kind: 'submit',
    status: evaluation.status,
    score: evaluation.score,
    maxScore: evaluation.maxScore,
    publicResults: evaluation.publicResults,
    // Never expose hidden test details
    hiddenSummary: evaluation.hiddenSummary,
    executionTimeMs: attempt.executionTimeMs,
    memoryKb: attempt.memoryKb,
    feedback: evaluation.feedback,
    xpAwarded: xp.xpAwarded,
    xpPenalty: xp.xpPenalty,
    provider: provider.id,
  }
}

async function getAttemptHistory(userId, questionId, reqContext) {
  const question = await questionRepo.findById(questionId)
  if (!question) throw new ApiError(404, 'Question not found')
  if (question.course) await assertCourseAccess(question.course, reqContext)
  const attempts = await attemptRepo.listAttempts(userId, questionId)
  const progress = await attemptRepo.getProgress(userId, questionId)
  return { attempts, progress }
}

async function toggleBookmark(userId, questionId) {
  const progress = await PracticeProgress.findOneAndUpdate(
    { user: userId, question: questionId },
    [
      {
        $set: {
          user: userId,
          question: questionId,
          bookmarked: { $not: [{ $ifNull: ['$bookmarked', false] }] },
        },
      },
    ],
    { upsert: true, new: true }
  )
  return { bookmarked: progress.bookmarked }
}

async function getStudentDashboard(userId) {
  const progress = await attemptRepo.listProgressForUser(userId)
  const completed = progress.filter((p) => p.completed).length
  const bookmarked = progress.filter((p) => p.bookmarked)
  const continueItem = progress.find((p) => !p.completed && p.submissionCount > 0) || progress[0]
  return {
    totalAttempted: progress.length,
    completed,
    bookmarkedCount: bookmarked.length,
    continuePractice: continueItem || null,
    recent: progress.slice(0, 8),
  }
}

async function getAnalytics(query = {}) {
  const match = { deletedAt: null }
  if (query.course) match.course = query.course
  if (query.topic) match.topic = query.topic

  const questions = await PracticeQuestion.find(match).select(
    'title type difficulty attemptCount successCount averageScore averageTimeSeconds'
  ).lean()

  const items = questions.map((q) => {
    const successRate = q.attemptCount ? Math.round((q.successCount / q.attemptCount) * 100) : 0
    return {
      ...q,
      successRate,
      failureRate: 100 - successRate,
    }
  })

  const mostDifficult = [...items].sort((a, b) => a.successRate - b.successRate).slice(0, 10)
  const mostSolved = [...items].sort((a, b) => b.successCount - a.successCount).slice(0, 10)

  return {
    totals: {
      questions: items.length,
      attempts: items.reduce((s, q) => s + (q.attemptCount || 0), 0),
      successes: items.reduce((s, q) => s + (q.successCount || 0), 0),
    },
    mostDifficult,
    mostSolved,
    items,
  }
}

async function exportQuestions(query = {}) {
  const filter = { deletedAt: null }
  if (query.course) filter.course = query.course
  const items = await PracticeQuestion.find(filter).select('+referenceSolution +options.isCorrect').lean()
  return { exportedAt: new Date().toISOString(), count: items.length, items }
}

async function importQuestions(items = [], userId) {
  if (!Array.isArray(items) || !items.length) throw new ApiError(400, 'items required')
  const created = []
  for (const raw of items) {
    const slug = await ensureUniqueSlug(raw.slug || raw.title, raw.course)
    const doc = await questionRepo.create({
      ...raw,
      _id: undefined,
      slug,
      status: raw.status || QUESTION_STATUS.DRAFT,
      createdBy: userId,
      updatedBy: userId,
      deletedAt: null,
      attemptCount: 0,
      successCount: 0,
    })
    created.push(doc._id)
  }
  return { imported: created.length, ids: created }
}

async function listCategories() {
  return QuestionCategory.find({ active: true }).sort({ name: 1 }).lean()
}

async function upsertCategory(payload) {
  const slug = slugify(payload.slug || payload.name)
  return QuestionCategory.findOneAndUpdate(
    { slug },
    { ...payload, slug, name: payload.name },
    { upsert: true, new: true }
  )
}

/** Leaderboard architecture stub */
async function getLeaderboard({ courseId, period = 'weekly' } = {}) {
  return {
    period,
    courseId: courseId || null,
    metrics: ['top_score', 'fastest_time', 'least_attempts'],
    entries: [],
    message: 'Leaderboard aggregation architecture ready — populate in a later prompt.',
  }
}

module.exports = {
  listQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  archiveQuestion,
  restoreQuestion,
  cloneQuestion,
  assignToTopic,
  listByTopic,
  runQuestion,
  submitQuestion,
  getAttemptHistory,
  toggleBookmark,
  getStudentDashboard,
  getAnalytics,
  exportQuestions,
  importQuestions,
  listCategories,
  upsertCategory,
  getLeaderboard,
  stripSecrets,
  IMPLEMENTED_QUESTION_TYPES,
}
