const platformService = require('../services/platform.service')
const featureFlagService = require('../services/feature-flag.service')
const auditService = require('../services/audit.service')
const notificationService = require('../services/notification.service')
const progressService = require('../services/progress.service')
const aiService = require('../services/ai.service')
const offlineSyncService = require('../services/offline-sync.service')
const sandboxService = require('../services/sandbox.service')
const { asyncHandler, sendSuccess } = require('../utils/helpers')
const { ROLES } = require('../constants')

const getArchitecture = asyncHandler(async (req, res) => {
  const data = await platformService.getPlatformArchitecture(req.user?.institute)
  sendSuccess(res, data)
})

const getLanguages = asyncHandler(async (_req, res) => {
  sendSuccess(res, { languages: platformService.listLanguages(), templates: platformService.listTemplates() })
})

const getFeatureFlags = asyncHandler(async (req, res) => {
  const data = await featureFlagService.getFeatureFlags(req.user?.institute)
  sendSuccess(res, data)
})

const updateFeatureFlag = asyncHandler(async (req, res) => {
  const flags = await featureFlagService.setFeatureFlag(
    req.user?.institute,
    req.body.key,
    req.body.enabled
  )
  await auditService.record(req, {
    action: 'feature_flag_updated',
    resourceType: 'feature_flag',
    resourceId: req.body.key,
    newValue: { enabled: req.body.enabled },
  })
  sendSuccess(res, { flags }, 'Feature flag updated')
})

const getPlugins = asyncHandler(async (req, res) => {
  const plugins = await featureFlagService.getPlugins(req.user?.institute)
  sendSuccess(res, { plugins })
})

const listAuditLogs = asyncHandler(async (req, res) => {
  const data = await auditService.list({
    page: req.query.page,
    limit: req.query.limit,
    action: req.query.action,
    userId: req.query.userId,
  })
  sendSuccess(res, data)
})

const listNotifications = asyncHandler(async (req, res) => {
  const items = await notificationService.listForUser(req.user._id, {
    unreadOnly: req.query.unread === 'true',
  })
  sendSuccess(res, { items })
})

const markNotificationRead = asyncHandler(async (req, res) => {
  const item = await notificationService.markRead(req.user._id, req.params.id)
  sendSuccess(res, item)
})

const trackProgress = asyncHandler(async (req, res) => {
  const event = await progressService.trackProgress({
    userId: req.user._id,
    instituteId: req.user.institute,
    courseId: req.body.courseId,
    lessonId: req.body.lessonId,
    eventType: req.body.eventType,
    value: req.body.value,
    meta: req.body.meta,
  })
  sendSuccess(res, event, 'Progress recorded', 201)
})

const progressSummary = asyncHandler(async (req, res) => {
  const data = await progressService.summaryForUser(req.user._id)
  sendSuccess(res, data)
})

const aiAction = asyncHandler(async (req, res) => {
  const data = await aiService.runAction({
    action: req.body.action,
    provider: req.body.provider,
    payload: req.body.payload || {},
  })
  sendSuccess(res, data)
})

const aiCatalog = asyncHandler(async (_req, res) => {
  sendSuccess(res, {
    actions: aiService.listActions(),
    providers: aiService.listProviders(),
  })
})

const offlineSync = asyncHandler(async (req, res) => {
  const data = await offlineSyncService.applyOps(req.user._id, req.body.ops)
  sendSuccess(res, data, 'Sync applied')
})

const evaluateStub = asyncHandler(async (req, res) => {
  const data = await sandboxService.evaluateSubmission({
    lessonEvaluation: req.body.evaluation,
    files: req.body.files,
    stdout: req.body.stdout,
  })
  sendSuccess(res, data)
})

const executeStub = asyncHandler(async (req, res) => {
  const data = await sandboxService.executeInSandbox({
    engineId: req.body.engineId || 'browser',
    files: req.body.files,
  })
  sendSuccess(res, data)
})

module.exports = {
  getArchitecture,
  getLanguages,
  getFeatureFlags,
  updateFeatureFlag,
  getPlugins,
  listAuditLogs,
  listNotifications,
  markNotificationRead,
  trackProgress,
  progressSummary,
  aiAction,
  aiCatalog,
  offlineSync,
  evaluateStub,
  executeStub,
}
