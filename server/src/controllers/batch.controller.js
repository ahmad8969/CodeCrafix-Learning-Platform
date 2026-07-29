const batchService = require('../services/batch.service')
const auditService = require('../services/audit.service')
const { asyncHandler, sendSuccess } = require('../utils/helpers')

const ctx = (req) => ({
  courseScope: req.courseScope,
  assignedUserId: req.assignedUserId,
  userId: req.user?._id,
  role: req.user?.role,
})

const create = asyncHandler(async (req, res) => {
  const data = await batchService.createBatch(req.body, req.user._id)
  await auditService.record(req, {
    action: 'batch_created',
    resourceType: 'Batch',
    resourceId: data._id,
  })
  sendSuccess(res, data, 'Batch created', 201)
})

const update = asyncHandler(async (req, res) => {
  const data = await batchService.updateBatch(req.params.id, req.body, req.user._id)
  await auditService.record(req, {
    action: 'batch_updated',
    resourceType: 'Batch',
    resourceId: data._id,
  })
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

const archive = asyncHandler(async (req, res) => {
  const data = await batchService.archiveBatch(req.params.id, req.user._id)
  sendSuccess(res, data, 'Batch archived')
})

const clone = asyncHandler(async (req, res) => {
  const data = await batchService.cloneBatch(req.params.id, req.user._id)
  sendSuccess(res, data, 'Batch cloned', 201)
})

const students = asyncHandler(async (req, res) => {
  const items = await batchService.listBatchStudents(req.params.id, ctx(req))
  sendSuccess(res, { items })
})

const analytics = asyncHandler(async (req, res) => {
  const data = await batchService.getBatchAnalytics(req.params.id, ctx(req))
  sendSuccess(res, data)
})

const calendar = asyncHandler(async (req, res) => {
  const data = await batchService.getScheduleCalendar(req.params.id, ctx(req))
  sendSuccess(res, data)
})

module.exports = {
  create,
  update,
  getOne,
  getAll,
  remove,
  restore,
  archive,
  clone,
  students,
  analytics,
  calendar,
}
