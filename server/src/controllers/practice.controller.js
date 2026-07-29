const practiceService = require('../services/practice.service')
const auditService = require('../services/audit.service')
const { asyncHandler, sendSuccess } = require('../utils/helpers')
const { ctxFromReq } = require('../utils/curriculum-access')

const listQuestions = asyncHandler(async (req, res) => {
  const data = await practiceService.listQuestions(req.query, ctxFromReq(req))
  sendSuccess(res, data)
})

const getQuestion = asyncHandler(async (req, res) => {
  const data = await practiceService.getQuestion(req.params.id, ctxFromReq(req))
  sendSuccess(res, data)
})

const createQuestion = asyncHandler(async (req, res) => {
  const data = await practiceService.createQuestion(req.body, req.user._id)
  await auditService.record(req, {
    action: 'practice_question_created',
    resourceType: 'PracticeQuestion',
    resourceId: data._id,
  })
  sendSuccess(res, data, 'Question created', 201)
})

const updateQuestion = asyncHandler(async (req, res) => {
  const data = await practiceService.updateQuestion(req.params.id, req.body, req.user._id)
  await auditService.record(req, {
    action: 'practice_question_updated',
    resourceType: 'PracticeQuestion',
    resourceId: data._id,
  })
  sendSuccess(res, data, 'Question updated')
})

const archiveQuestion = asyncHandler(async (req, res) => {
  const data = await practiceService.archiveQuestion(req.params.id)
  sendSuccess(res, data, 'Question archived')
})

const restoreQuestion = asyncHandler(async (req, res) => {
  const data = await practiceService.restoreQuestion(req.params.id)
  sendSuccess(res, data, 'Question restored')
})

const cloneQuestion = asyncHandler(async (req, res) => {
  const data = await practiceService.cloneQuestion(req.params.id, req.user._id)
  sendSuccess(res, data, 'Question cloned', 201)
})

const assignToTopic = asyncHandler(async (req, res) => {
  const data = await practiceService.assignToTopic(req.params.topicId, req.body.questionIds, {
    courseId: req.body.courseId,
    moduleId: req.body.moduleId,
    weekId: req.body.weekId,
  })
  sendSuccess(res, data, 'Questions assigned')
})

const listByTopic = asyncHandler(async (req, res) => {
  const items = await practiceService.listByTopic(req.params.topicId, ctxFromReq(req))
  sendSuccess(res, { items })
})

const runCode = asyncHandler(async (req, res) => {
  const data = await practiceService.runQuestion(
    req.user._id,
    req.params.id,
    req.body,
    ctxFromReq(req)
  )
  sendSuccess(res, data, 'Run complete')
})

const submitCode = asyncHandler(async (req, res) => {
  const data = await practiceService.submitQuestion(
    req.user._id,
    req.params.id,
    req.body,
    ctxFromReq(req)
  )
  sendSuccess(res, data, 'Submission evaluated')
})

const attemptHistory = asyncHandler(async (req, res) => {
  const data = await practiceService.getAttemptHistory(
    req.user._id,
    req.params.id,
    ctxFromReq(req)
  )
  sendSuccess(res, data)
})

const bookmark = asyncHandler(async (req, res) => {
  const data = await practiceService.toggleBookmark(req.user._id, req.params.id)
  sendSuccess(res, data)
})

const studentDashboard = asyncHandler(async (req, res) => {
  const data = await practiceService.getStudentDashboard(req.user._id)
  sendSuccess(res, data)
})

const analytics = asyncHandler(async (req, res) => {
  const data = await practiceService.getAnalytics(req.query)
  sendSuccess(res, data)
})

const exportQuestions = asyncHandler(async (req, res) => {
  const data = await practiceService.exportQuestions(req.query)
  sendSuccess(res, data)
})

const importQuestions = asyncHandler(async (req, res) => {
  const data = await practiceService.importQuestions(req.body.items, req.user._id)
  sendSuccess(res, data, 'Import complete', 201)
})

const listCategories = asyncHandler(async (_req, res) => {
  const items = await practiceService.listCategories()
  sendSuccess(res, { items })
})

const upsertCategory = asyncHandler(async (req, res) => {
  const data = await practiceService.upsertCategory(req.body)
  sendSuccess(res, data, 'Category saved')
})

const leaderboard = asyncHandler(async (req, res) => {
  const data = await practiceService.getLeaderboard(req.query)
  sendSuccess(res, data)
})

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
  runCode,
  submitCode,
  attemptHistory,
  bookmark,
  studentDashboard,
  analytics,
  exportQuestions,
  importQuestions,
  listCategories,
  upsertCategory,
  leaderboard,
}
