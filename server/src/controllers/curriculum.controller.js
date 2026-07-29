const curriculumService = require('../services/curriculum.service')
const { asyncHandler, sendSuccess } = require('../utils/helpers')
const { ctxFromReq } = require('../utils/curriculum-access')

const tree = asyncHandler(async (req, res) => {
  const data = await curriculumService.getTree(req.params.courseId, ctxFromReq(req))
  sendSuccess(res, data)
})

const search = asyncHandler(async (req, res) => {
  const data = await curriculumService.searchCurriculum(req.params.courseId, req.query, ctxFromReq(req))
  sendSuccess(res, data)
})

const stats = asyncHandler(async (req, res) => {
  const data = await curriculumService.getStats(req.params.courseId, ctxFromReq(req))
  sendSuccess(res, data)
})

module.exports = { tree, search, stats }
