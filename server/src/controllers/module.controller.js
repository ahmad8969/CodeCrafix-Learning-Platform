const moduleService = require('../services/module.service')
const { asyncHandler, sendSuccess } = require('../utils/helpers')
const { ctxFromReq } = require('../utils/curriculum-access')

const create = asyncHandler(async (req, res) => {
  const data = await moduleService.createModule(req.body, req.user._id, ctxFromReq(req))
  sendSuccess(res, data, 'Module created', 201)
})

const update = asyncHandler(async (req, res) => {
  const data = await moduleService.updateModule(req.params.id, req.body, req.user._id, ctxFromReq(req))
  sendSuccess(res, data, 'Module updated')
})

const getOne = asyncHandler(async (req, res) => {
  const data = await moduleService.getModule(req.params.id, ctxFromReq(req))
  sendSuccess(res, data)
})

const getAll = asyncHandler(async (req, res) => {
  const data = await moduleService.listModules(req.query, ctxFromReq(req))
  sendSuccess(res, data)
})

const remove = asyncHandler(async (req, res) => {
  const data = await moduleService.deleteModule(req.params.id, ctxFromReq(req))
  sendSuccess(res, data, 'Module deleted')
})

const restore = asyncHandler(async (req, res) => {
  const data = await moduleService.restoreModule(req.params.id, ctxFromReq(req))
  sendSuccess(res, data, 'Module restored')
})

const reorder = asyncHandler(async (req, res) => {
  const data = await moduleService.reorderModules(req.body.course || req.query.course, req.body.items, ctxFromReq(req))
  sendSuccess(res, data, 'Modules reordered')
})

module.exports = { create, update, getOne, getAll, remove, restore, reorder }
