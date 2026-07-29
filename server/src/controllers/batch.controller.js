const batchService = require('../services/batch.service')
const { asyncHandler, sendSuccess } = require('../utils/helpers')

const ctx = (req) => ({
  courseScope: req.courseScope,
  assignedUserId: req.assignedUserId,
})

const create = asyncHandler(async (req, res) => {
  const data = await batchService.createBatch(req.body, req.user._id)
  sendSuccess(res, data, 'Batch created', 201)
})

const update = asyncHandler(async (req, res) => {
  const data = await batchService.updateBatch(req.params.id, req.body, req.user._id)
  sendSuccess(res, data, 'Batch updated')
})

const getOne = asyncHandler(async (req, res) => {
  const data = await batchService.getBatch(req.params.id, ctx(req))
  sendSuccess(res, data)
})

const getAll = asyncHandler(async (req, res) => {
  const data = await batchService.listBatches(req.query, ctx(req))
  sendSuccess(res, data)
})

const remove = asyncHandler(async (req, res) => {
  const data = await batchService.deleteBatch(req.params.id)
  sendSuccess(res, data, 'Batch deleted')
})

const restore = asyncHandler(async (req, res) => {
  const data = await batchService.restoreBatch(req.params.id)
  sendSuccess(res, data, 'Batch restored')
})

module.exports = { create, update, getOne, getAll, remove, restore }
