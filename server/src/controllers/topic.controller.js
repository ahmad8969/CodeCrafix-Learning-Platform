const topicService = require('../services/topic.service')
const { asyncHandler, sendSuccess } = require('../utils/helpers')
const { ctxFromReq } = require('../utils/curriculum-access')

const create = asyncHandler(async (req, res) => {
  const data = await topicService.createTopic(req.body, req.user._id, ctxFromReq(req))
  sendSuccess(res, data, 'Topic created', 201)
})

const update = asyncHandler(async (req, res) => {
  const data = await topicService.updateTopic(req.params.id, req.body, req.user._id, ctxFromReq(req))
  sendSuccess(res, data, 'Topic updated')
})

const getOne = asyncHandler(async (req, res) => {
  const data = await topicService.getTopic(req.params.id, ctxFromReq(req))
  sendSuccess(res, data)
})

const getAll = asyncHandler(async (req, res) => {
  const data = await topicService.listTopics(req.query, ctxFromReq(req))
  sendSuccess(res, data)
})

const remove = asyncHandler(async (req, res) => {
  const data = await topicService.deleteTopic(req.params.id, ctxFromReq(req))
  sendSuccess(res, data, 'Topic deleted')
})

const restore = asyncHandler(async (req, res) => {
  const data = await topicService.restoreTopic(req.params.id, ctxFromReq(req))
  sendSuccess(res, data, 'Topic restored')
})

const reorder = asyncHandler(async (req, res) => {
  const data = await topicService.reorderTopics(req.body.week, req.body.items, ctxFromReq(req))
  sendSuccess(res, data, 'Topics reordered')
})

module.exports = { create, update, getOne, getAll, remove, restore, reorder }
