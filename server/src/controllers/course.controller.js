const courseService = require('../services/course.service')
const { asyncHandler, sendSuccess } = require('../utils/helpers')

const ctx = (req) => ({
  courseScope: req.courseScope,
  assignedUserId: req.assignedUserId,
})

const create = asyncHandler(async (req, res) => {
  const data = await courseService.createCourse(req.body, req.user._id)
  sendSuccess(res, data, 'Course created', 201)
})

const update = asyncHandler(async (req, res) => {
  const data = await courseService.updateCourse(req.params.id, req.body, req.user._id, ctx(req))
  sendSuccess(res, data, 'Course updated')
})

const getOne = asyncHandler(async (req, res) => {
  const data = await courseService.getCourse(req.params.id, ctx(req))
  sendSuccess(res, data)
})

const getAll = asyncHandler(async (req, res) => {
  const data = await courseService.listCourses(req.query, ctx(req))
  sendSuccess(res, data)
})

const remove = asyncHandler(async (req, res) => {
  const data = await courseService.deleteCourse(req.params.id)
  sendSuccess(res, data, 'Course deleted')
})

const restore = asyncHandler(async (req, res) => {
  const data = await courseService.restoreCourse(req.params.id)
  sendSuccess(res, data, 'Course restored')
})

const publish = asyncHandler(async (req, res) => {
  const data = await courseService.publishCourse(req.params.id, req.user._id)
  sendSuccess(res, data, 'Course published')
})

const archive = asyncHandler(async (req, res) => {
  const data = await courseService.archiveCourse(req.params.id, req.user._id)
  sendSuccess(res, data, 'Course archived')
})

const feature = asyncHandler(async (req, res) => {
  const data = await courseService.featureCourse(
    req.params.id,
    req.body.featured !== false,
    req.user._id
  )
  sendSuccess(res, data, 'Course feature updated')
})

const bulkStatus = asyncHandler(async (req, res) => {
  const data = await courseService.bulkUpdateStatus(req.body.ids, req.body.status, req.user._id)
  sendSuccess(res, data, 'Bulk status updated')
})

const bulkDelete = asyncHandler(async (req, res) => {
  const data = await courseService.bulkSoftDelete(req.body.ids)
  sendSuccess(res, data, 'Bulk delete completed')
})

const stats = asyncHandler(async (req, res) => {
  const data = await courseService.getDashboardStats(ctx(req))
  sendSuccess(res, data)
})

module.exports = {
  create,
  update,
  getOne,
  getAll,
  remove,
  restore,
  publish,
  archive,
  feature,
  bulkStatus,
  bulkDelete,
  stats,
}
