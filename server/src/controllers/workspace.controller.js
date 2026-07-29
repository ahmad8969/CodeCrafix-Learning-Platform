const workspaceService = require('../services/workspace.service')
const auditService = require('../services/audit.service')
const { asyncHandler, sendSuccess } = require('../utils/helpers')
const { ctxFromReq } = require('../utils/curriculum-access')

const getWorkspace = asyncHandler(async (req, res) => {
  const data = await workspaceService.getWorkspace(req.user._id, req.params.lessonId, ctxFromReq(req))
  sendSuccess(res, data)
})

const saveWorkspace = asyncHandler(async (req, res) => {
  const data = await workspaceService.saveWorkspace(
    req.user._id,
    req.params.lessonId,
    req.body,
    ctxFromReq(req)
  )
  await auditService.record(req, {
    action: 'workspace_saved',
    resourceType: 'CodeWorkspace',
    resourceId: data.workspace?._id,
    newValue: { version: data.version, source: req.body.source || 'manual' },
  })
  sendSuccess(res, data, 'Workspace saved')
})

const resetWorkspace = asyncHandler(async (req, res) => {
  const data = await workspaceService.resetWorkspace(
    req.user._id,
    req.params.lessonId,
    ctxFromReq(req)
  )
  await auditService.record(req, {
    action: 'workspace_reset',
    resourceType: 'CodeWorkspace',
    resourceId: data.workspace?._id,
  })
  sendSuccess(res, data, 'Workspace reset')
})

const getStarter = asyncHandler(async (req, res) => {
  const data = await workspaceService.getStarter(req.params.lessonId, ctxFromReq(req))
  sendSuccess(res, data)
})

const codingDashboard = asyncHandler(async (req, res) => {
  const data = await workspaceService.getCodingDashboard(req.user._id)
  sendSuccess(res, data)
})

const listVersions = asyncHandler(async (req, res) => {
  const data = await workspaceService.listVersions(req.user._id, req.params.lessonId, ctxFromReq(req))
  sendSuccess(res, data)
})

const getVersion = asyncHandler(async (req, res) => {
  const data = await workspaceService.getVersion(
    req.user._id,
    req.params.lessonId,
    req.params.version,
    ctxFromReq(req)
  )
  sendSuccess(res, data)
})

const compareVersions = asyncHandler(async (req, res) => {
  const data = await workspaceService.compareVersions(
    req.user._id,
    req.params.lessonId,
    req.query.a,
    req.query.b,
    ctxFromReq(req)
  )
  sendSuccess(res, data)
})

const restoreVersion = asyncHandler(async (req, res) => {
  const data = await workspaceService.restoreVersion(
    req.user._id,
    req.params.lessonId,
    req.params.version,
    ctxFromReq(req)
  )
  await auditService.record(req, {
    action: 'workspace_version_restored',
    resourceType: 'CodeWorkspaceVersion',
    resourceId: req.params.version,
  })
  sendSuccess(res, data, 'Version restored')
})

module.exports = {
  getWorkspace,
  saveWorkspace,
  resetWorkspace,
  getStarter,
  codingDashboard,
  listVersions,
  getVersion,
  compareVersions,
  restoreVersion,
}
