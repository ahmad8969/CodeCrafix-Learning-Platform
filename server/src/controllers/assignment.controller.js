const assignmentService = require('../services/assignment.service')
const auditService = require('../services/audit.service')
const { asyncHandler, sendSuccess } = require('../utils/helpers')
const { ctxFromReq } = require('../utils/curriculum-access')
const { mapUploadedFiles } = require('../middlewares/upload.middleware')

const list = asyncHandler(async (req, res) => {
  const data = await assignmentService.listAssignments(req.query, ctxFromReq(req))
  sendSuccess(res, data)
})

const get = asyncHandler(async (req, res) => {
  const data = await assignmentService.getAssignment(req.params.id, ctxFromReq(req))
  sendSuccess(res, data)
})

const create = asyncHandler(async (req, res) => {
  const data = await assignmentService.createAssignment(req.body, req.user._id)
  await auditService.record(req, {
    action: 'assignment_created',
    resourceType: 'Assignment',
    resourceId: data._id,
  })
  sendSuccess(res, data, 'Assignment created', 201)
})

const update = asyncHandler(async (req, res) => {
  const data = await assignmentService.updateAssignment(req.params.id, req.body, req.user._id)
  await auditService.record(req, {
    action: 'assignment_updated',
    resourceType: 'Assignment',
    resourceId: data._id,
  })
  sendSuccess(res, data, 'Assignment updated')
})

const publish = asyncHandler(async (req, res) => {
  const data = await assignmentService.publishAssignment(req.params.id, req.user._id, ctxFromReq(req))
  sendSuccess(res, data, 'Assignment published')
})

const archive = asyncHandler(async (req, res) => {
  const data = await assignmentService.archiveAssignment(req.params.id, req.user._id)
  sendSuccess(res, data, 'Assignment archived')
})

const remove = asyncHandler(async (req, res) => {
  const data = await assignmentService.deleteAssignment(req.params.id)
  sendSuccess(res, data, 'Assignment deleted')
})

const restore = asyncHandler(async (req, res) => {
  const data = await assignmentService.restoreAssignment(req.params.id)
  sendSuccess(res, data, 'Assignment restored')
})

const submit = asyncHandler(async (req, res) => {
  const uploaded = mapUploadedFiles(req)
  let files = uploaded
  if (!files.length && req.body.filesJson) {
    files = typeof req.body.filesJson === 'string' ? JSON.parse(req.body.filesJson) : req.body.filesJson
  }
  if (!files.length && Array.isArray(req.body.files)) files = req.body.files

  let codeSnapshot = req.body.codeSnapshot || []
  if (typeof codeSnapshot === 'string') {
    try {
      codeSnapshot = JSON.parse(codeSnapshot)
    } catch {
      codeSnapshot = []
    }
  }

  const payload = {
    ...req.body,
    files,
    codeSnapshot,
  }
  const data = await assignmentService.submitAssignment(
    req.user._id,
    req.params.id,
    payload,
    ctxFromReq(req)
  )
  sendSuccess(res, data, 'Assignment submitted', 201)
})

const draft = asyncHandler(async (req, res) => {
  const data = await assignmentService.saveDraft(
    req.user._id,
    req.params.id,
    req.body,
    ctxFromReq(req)
  )
  sendSuccess(res, data, 'Draft saved')
})

const resubmit = asyncHandler(async (req, res) => {
  const uploaded = mapUploadedFiles(req)
  let files = uploaded
  if (!files.length && req.body.filesJson) {
    files = typeof req.body.filesJson === 'string' ? JSON.parse(req.body.filesJson) : req.body.filesJson
  }
  if (!files.length && Array.isArray(req.body.files)) files = req.body.files
  let codeSnapshot = req.body.codeSnapshot || []
  if (typeof codeSnapshot === 'string') {
    try {
      codeSnapshot = JSON.parse(codeSnapshot)
    } catch {
      codeSnapshot = []
    }
  }
  const payload = { ...req.body, files, codeSnapshot }
  const data = await assignmentService.resubmitAssignment(
    req.user._id,
    req.params.id,
    payload,
    ctxFromReq(req)
  )
  sendSuccess(res, data, 'Assignment resubmitted')
})

const listSubmissions = asyncHandler(async (req, res) => {
  const data = await assignmentService.listSubmissions(req.params.id, req.query, ctxFromReq(req))
  sendSuccess(res, data)
})

const getSubmission = asyncHandler(async (req, res) => {
  const data = await assignmentService.getSubmission(req.params.submissionId, ctxFromReq(req))
  sendSuccess(res, data)
})

const grade = asyncHandler(async (req, res) => {
  const data = await assignmentService.gradeSubmission(
    req.params.submissionId,
    req.body,
    req.user._id,
    ctxFromReq(req)
  )
  await auditService.record(req, {
    action: 'assignment_graded',
    resourceType: 'AssignmentSubmission',
    resourceId: data._id,
    newValue: { marks: data.marks, status: data.status },
  })
  sendSuccess(res, data, 'Submission graded')
})

const history = asyncHandler(async (req, res) => {
  const data = await assignmentService.studentHistory(req.user._id, req.params.id, ctxFromReq(req))
  sendSuccess(res, { items: data })
})

const updateRubrics = asyncHandler(async (req, res) => {
  const data = await assignmentService.updateRubrics(req.params.id, req.body.rubrics, req.user._id)
  sendSuccess(res, data, 'Rubrics updated')
})

const analytics = asyncHandler(async (req, res) => {
  const data = await assignmentService.getAnalytics(req.query)
  sendSuccess(res, data)
})

const studentDash = asyncHandler(async (req, res) => {
  const data = await assignmentService.studentDashboard(req.user._id)
  sendSuccess(res, data)
})

const teacherDash = asyncHandler(async (req, res) => {
  const data = await assignmentService.teacherDashboard(req.user._id)
  sendSuccess(res, data)
})

const adminDash = asyncHandler(async (req, res) => {
  const data = await assignmentService.adminDashboard()
  sendSuccess(res, data)
})

const uploadOnly = asyncHandler(async (req, res) => {
  const files = mapUploadedFiles(req)
  sendSuccess(res, { files }, 'Files uploaded')
})

module.exports = {
  list,
  get,
  create,
  update,
  publish,
  archive,
  remove,
  restore,
  submit,
  draft,
  resubmit,
  listSubmissions,
  getSubmission,
  grade,
  history,
  updateRubrics,
  analytics,
  studentDash,
  teacherDash,
  adminDash,
  uploadOnly,
}
