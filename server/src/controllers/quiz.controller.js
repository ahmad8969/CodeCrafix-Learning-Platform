const quizService = require('../services/quiz.service')
const auditService = require('../services/audit.service')
const { asyncHandler, sendSuccess } = require('../utils/helpers')
const { ctxFromReq } = require('../utils/curriculum-access')

const list = asyncHandler(async (req, res) => {
  const data = await quizService.listQuizzes(req.query, ctxFromReq(req))
  sendSuccess(res, data)
})

const get = asyncHandler(async (req, res) => {
  const data = await quizService.getQuiz(req.params.id, ctxFromReq(req))
  sendSuccess(res, data)
})

const create = asyncHandler(async (req, res) => {
  const data = await quizService.createQuiz(req.body, req.user._id)
  await auditService.record(req, {
    action: 'quiz_created',
    resourceType: 'Quiz',
    resourceId: data._id,
  })
  sendSuccess(res, data, 'Quiz created', 201)
})

const update = asyncHandler(async (req, res) => {
  const data = await quizService.updateQuiz(req.params.id, req.body, req.user._id)
  sendSuccess(res, data, 'Quiz updated')
})

const publish = asyncHandler(async (req, res) => {
  const data = await quizService.publishQuiz(req.params.id, req.user._id, ctxFromReq(req))
  sendSuccess(res, data, 'Quiz published')
})

const archive = asyncHandler(async (req, res) => {
  const data = await quizService.archiveQuiz(req.params.id, req.user._id)
  sendSuccess(res, data, 'Quiz archived')
})

const remove = asyncHandler(async (req, res) => {
  const data = await quizService.deleteQuiz(req.params.id)
  sendSuccess(res, data, 'Quiz deleted')
})

const restore = asyncHandler(async (req, res) => {
  const data = await quizService.restoreQuiz(req.params.id)
  sendSuccess(res, data, 'Quiz restored')
})

const duplicate = asyncHandler(async (req, res) => {
  const data = await quizService.duplicateQuiz(req.params.id, req.user._id)
  sendSuccess(res, data, 'Quiz duplicated', 201)
})

const start = asyncHandler(async (req, res) => {
  const data = await quizService.startAttempt(req.user._id, req.params.id, ctxFromReq(req), {
    clientFingerprint: req.body.clientFingerprint,
  })
  sendSuccess(res, data, 'Attempt started', 201)
})

const saveProgress = asyncHandler(async (req, res) => {
  const data = await quizService.saveProgress(
    req.user._id,
    req.params.attemptId,
    req.body,
    ctxFromReq(req)
  )
  sendSuccess(res, data, 'Progress saved')
})

const submit = asyncHandler(async (req, res) => {
  const data = await quizService.submitAttempt(
    req.user._id,
    req.params.attemptId,
    req.body,
    ctxFromReq(req)
  )
  sendSuccess(res, data, 'Quiz submitted')
})

const getAttempt = asyncHandler(async (req, res) => {
  const data = await quizService.getAttempt(req.user._id, req.params.attemptId, ctxFromReq(req))
  sendSuccess(res, data)
})

const listAttempts = asyncHandler(async (req, res) => {
  const items = await quizService.listAttemptsForQuiz(req.params.id, ctxFromReq(req))
  sendSuccess(res, { items })
})

const myHistory = asyncHandler(async (req, res) => {
  const items = await quizService.studentQuizHistory(req.user._id, req.params.id)
  sendSuccess(res, { items })
})

const leaderboard = asyncHandler(async (req, res) => {
  const data = await quizService.getLeaderboard(req.params.id, req.query)
  sendSuccess(res, data)
})

const analytics = asyncHandler(async (req, res) => {
  const data = await quizService.getAnalytics(req.query)
  sendSuccess(res, data)
})

const pool = asyncHandler(async (req, res) => {
  const data = await quizService.questionPool(req.query)
  sendSuccess(res, data)
})

const studentDash = asyncHandler(async (req, res) => {
  const data = await quizService.studentDashboard(req.user._id)
  sendSuccess(res, data)
})

const teacherDash = asyncHandler(async (req, res) => {
  const data = await quizService.teacherDashboard()
  sendSuccess(res, data)
})

module.exports = {
  list,
  get,
  create,
  update,
  publish,
  archive,
  remove,
  restore,
  duplicate,
  start,
  saveProgress,
  submit,
  getAttempt,
  listAttempts,
  myHistory,
  leaderboard,
  analytics,
  pool,
  studentDash,
  teacherDash,
}
