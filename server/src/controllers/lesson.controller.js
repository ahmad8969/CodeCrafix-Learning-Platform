const lessonService = require('../services/lesson.service')
const { asyncHandler, sendSuccess } = require('../utils/helpers')
const { ctxFromReq } = require('../utils/curriculum-access')

const create = asyncHandler(async (req, res) => {
  const data = await lessonService.createLesson(req.body, req.user._id, ctxFromReq(req))
  sendSuccess(res, data, 'Lesson created', 201)
})

const update = asyncHandler(async (req, res) => {
  const data = await lessonService.updateLesson(req.params.id, req.body, req.user._id, ctxFromReq(req))
  sendSuccess(res, data, 'Lesson updated')
})

const getOne = asyncHandler(async (req, res) => {
  const data = await lessonService.getLesson(req.params.id, ctxFromReq(req))
  sendSuccess(res, data)
})

const getAll = asyncHandler(async (req, res) => {
  const data = await lessonService.listLessons(req.query, ctxFromReq(req))
  sendSuccess(res, data)
})

const remove = asyncHandler(async (req, res) => {
  const data = await lessonService.deleteLesson(req.params.id, ctxFromReq(req))
  sendSuccess(res, data, 'Lesson deleted')
})

const restore = asyncHandler(async (req, res) => {
  const data = await lessonService.restoreLesson(req.params.id, ctxFromReq(req))
  sendSuccess(res, data, 'Lesson restored')
})

const reorder = asyncHandler(async (req, res) => {
  const data = await lessonService.reorderLessons(req.body.topic, req.body.items, ctxFromReq(req))
  sendSuccess(res, data, 'Lessons reordered')
})

module.exports = { create, update, getOne, getAll, remove, restore, reorder }
