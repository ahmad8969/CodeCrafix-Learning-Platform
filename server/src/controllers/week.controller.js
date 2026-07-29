const weekService = require('../services/week.service')
const { asyncHandler, sendSuccess } = require('../utils/helpers')
const { ctxFromReq } = require('../utils/curriculum-access')

const create = asyncHandler(async (req, res) => {
  const data = await weekService.createWeek(req.body, req.user._id, ctxFromReq(req))
  sendSuccess(res, data, 'Week created', 201)
})

const update = asyncHandler(async (req, res) => {
  const data = await weekService.updateWeek(req.params.id, req.body, req.user._id, ctxFromReq(req))
  sendSuccess(res, data, 'Week updated')
})

const getOne = asyncHandler(async (req, res) => {
  const data = await weekService.getWeek(req.params.id, ctxFromReq(req))
  sendSuccess(res, data)
})

const getAll = asyncHandler(async (req, res) => {
  const data = await weekService.listWeeks(req.query, ctxFromReq(req))
  sendSuccess(res, data)
})

const remove = asyncHandler(async (req, res) => {
  const data = await weekService.deleteWeek(req.params.id, ctxFromReq(req))
  sendSuccess(res, data, 'Week deleted')
})

const restore = asyncHandler(async (req, res) => {
  const data = await weekService.restoreWeek(req.params.id, ctxFromReq(req))
  sendSuccess(res, data, 'Week restored')
})

const reorder = asyncHandler(async (req, res) => {
  const data = await weekService.reorderWeeks(req.body.module, req.body.items, ctxFromReq(req))
  sendSuccess(res, data, 'Weeks reordered')
})

module.exports = { create, update, getOne, getAll, remove, restore, reorder }
