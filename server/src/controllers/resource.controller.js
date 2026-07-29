const resourceService = require('../services/resource.service')
const { asyncHandler, sendSuccess } = require('../utils/helpers')
const { ctxFromReq } = require('../utils/curriculum-access')

const create = asyncHandler(async (req, res) => {
  const data = await resourceService.createResource(req.body, req.user._id, ctxFromReq(req))
  sendSuccess(res, data, 'Resource created', 201)
})

const update = asyncHandler(async (req, res) => {
  const data = await resourceService.updateResource(req.params.id, req.body, req.user._id, ctxFromReq(req))
  sendSuccess(res, data, 'Resource updated')
})

const getOne = asyncHandler(async (req, res) => {
  const data = await resourceService.getResource(req.params.id, ctxFromReq(req))
  sendSuccess(res, data)
})

const getAll = asyncHandler(async (req, res) => {
  const data = await resourceService.listResources(req.query, ctxFromReq(req))
  sendSuccess(res, data)
})

const remove = asyncHandler(async (req, res) => {
  const data = await resourceService.deleteResource(req.params.id, ctxFromReq(req))
  sendSuccess(res, data, 'Resource deleted')
})

const restore = asyncHandler(async (req, res) => {
  const data = await resourceService.restoreResource(req.params.id, ctxFromReq(req))
  sendSuccess(res, data, 'Resource restored')
})

const reorder = asyncHandler(async (req, res) => {
  const data = await resourceService.reorderResources(req.body.lesson, req.body.items, ctxFromReq(req))
  sendSuccess(res, data, 'Resources reordered')
})

module.exports = { create, update, getOne, getAll, remove, restore, reorder }
