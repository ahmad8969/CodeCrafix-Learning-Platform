const learningService = require('../services/learning.service')
const { asyncHandler, sendSuccess } = require('../utils/helpers')
const { ctxFromReq } = require('../utils/curriculum-access')

const experience = asyncHandler(async (req, res) => {
  const data = await learningService.getLessonExperience(
    req.params.id,
    req.user._id,
    ctxFromReq(req)
  )
  sendSuccess(res, data)
})

const resources = asyncHandler(async (req, res) => {
  const data = await learningService.getLessonResources(req.params.id, ctxFromReq(req))
  sendSuccess(res, data)
})

const related = asyncHandler(async (req, res) => {
  const data = await learningService.getRelatedLessons(req.params.id, ctxFromReq(req))
  sendSuccess(res, data)
})

const search = asyncHandler(async (req, res) => {
  const data = await learningService.searchLessons(req.query, ctxFromReq(req))
  sendSuccess(res, data)
})

const addBookmark = asyncHandler(async (req, res) => {
  const data = await learningService.addBookmark(req.user._id, req.params.id)
  sendSuccess(res, data, 'Bookmarked', 201)
})

const removeBookmark = asyncHandler(async (req, res) => {
  const data = await learningService.removeBookmark(req.user._id, req.params.id)
  sendSuccess(res, data, 'Bookmark removed')
})

const listBookmarks = asyncHandler(async (req, res) => {
  const data = await learningService.listBookmarks(req.user._id, req.query)
  sendSuccess(res, data)
})

const progress = asyncHandler(async (req, res) => {
  const data = await learningService.updateProgress(req.user._id, req.params.id, req.body)
  sendSuccess(res, data, 'Progress updated')
})

const dashboard = asyncHandler(async (req, res) => {
  const data = await learningService.getLearningDashboard(req.user._id)
  sendSuccess(res, data)
})

const getNote = asyncHandler(async (req, res) => {
  const data = await learningService.getNote(req.user._id, req.params.id)
  sendSuccess(res, data)
})

const upsertNote = asyncHandler(async (req, res) => {
  const data = await learningService.upsertNote(req.user._id, req.params.id, req.body.content)
  sendSuccess(res, data, 'Note saved')
})

const deleteNote = asyncHandler(async (req, res) => {
  const data = await learningService.deleteNote(req.user._id, req.params.id)
  sendSuccess(res, data, 'Note deleted')
})

module.exports = {
  experience,
  resources,
  related,
  search,
  addBookmark,
  removeBookmark,
  listBookmarks,
  progress,
  dashboard,
  getNote,
  upsertNote,
  deleteNote,
}
