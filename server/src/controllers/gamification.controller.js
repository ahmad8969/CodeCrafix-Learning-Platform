const gamificationService = require('../services/gamification.service')
const achievementService = require('../services/achievement.service')
const leaderboardService = require('../services/leaderboard.service')
const portfolioService = require('../services/portfolio.service')
const auditService = require('../services/audit.service')
const { asyncHandler, sendSuccess, ApiError } = require('../utils/helpers')
const { ROLES } = require('../constants')

function assertSelfOrStaff(req, studentId) {
  const isSelf = String(studentId) === String(req.user._id)
  const isStaff = [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.TEACHER].includes(req.user.role)
  if (!isSelf && !isStaff) throw new ApiError(403, 'Forbidden')
}

const mySummary = asyncHandler(async (req, res) => {
  sendSuccess(res, await gamificationService.getStudentSummary(req.user._id, req.query))
})

const studentSummary = asyncHandler(async (req, res) => {
  assertSelfOrStaff(req, req.params.studentId)
  sendSuccess(res, await gamificationService.getStudentSummary(req.params.studentId, req.query))
})

const dailyLogin = asyncHandler(async (req, res) => {
  sendSuccess(res, await gamificationService.recordDailyLogin(req.user._id, req.user.institute))
})

const getSettings = asyncHandler(async (req, res) => {
  sendSuccess(res, await gamificationService.getSettings(req.query.instituteId || null))
})

const updateSettings = asyncHandler(async (req, res) => {
  const data = await gamificationService.updateSettings(req.body, req.body.instituteId || null)
  await auditService.record(req, {
    action: 'gamification_settings_updated',
    resourceType: 'GamificationSettings',
    resourceId: data._id,
    newValue: req.body,
  })
  sendSuccess(res, data, 'Settings updated')
})

const listBadges = asyncHandler(async (req, res) => {
  sendSuccess(res, await gamificationService.listBadges(req.query))
})

const upsertBadge = asyncHandler(async (req, res) => {
  const data = await gamificationService.upsertBadge(req.body)
  await auditService.record(req, {
    action: 'badge_upserted',
    resourceType: 'BadgeDefinition',
    resourceId: data._id,
  })
  sendSuccess(res, data, 'Badge saved')
})

const awardBadgeManual = asyncHandler(async (req, res) => {
  const data = await gamificationService.awardBadge({
    userId: req.body.studentId,
    badgeKey: req.body.badgeKey,
    awardedBy: req.user._id,
    source: 'manual',
  })
  await auditService.record(req, {
    action: 'badge_awarded_manual',
    resourceType: 'StudentProfile',
    resourceId: req.body.studentId,
    newValue: req.body,
  })
  sendSuccess(res, data, 'Badge awarded')
})

const awardXpManual = asyncHandler(async (req, res) => {
  const data = await gamificationService.awardXp({
    userId: req.body.studentId,
    courseId: req.body.courseId,
    event: gamificationService.XP_EVENTS.MANUAL,
    amount: req.body.amount,
    reason: req.body.reason || 'Manual XP adjustment',
    awardedBy: req.user._id,
    meta: { refId: req.body.refId || `manual-${Date.now()}-${req.body.studentId}` },
  })
  await auditService.record(req, {
    action: 'xp_awarded_manual',
    resourceType: 'XpLedger',
    resourceId: req.body.studentId,
    newValue: req.body,
  })
  sendSuccess(res, data, 'XP awarded')
})

const listAchievements = asyncHandler(async (req, res) => {
  sendSuccess(res, await achievementService.listAchievements(req.query))
})

const upsertAchievement = asyncHandler(async (req, res) => {
  const data = await achievementService.upsertAchievement(req.body)
  await auditService.record(req, {
    action: 'achievement_upserted',
    resourceType: 'AchievementDefinition',
    resourceId: data._id,
  })
  sendSuccess(res, data, 'Achievement saved')
})

const myAchievements = asyncHandler(async (req, res) => {
  sendSuccess(res, await achievementService.getStudentAchievements(req.user._id))
})

const leaderboard = asyncHandler(async (req, res) => {
  sendSuccess(res, await leaderboardService.leaderboard(req.query))
})

const myPortfolio = asyncHandler(async (req, res) => {
  sendSuccess(res, await portfolioService.buildPortfolio(req.user._id))
})

const studentPortfolio = asyncHandler(async (req, res) => {
  assertSelfOrStaff(req, req.params.studentId)
  if (String(req.params.studentId) !== String(req.user._id)) {
    const publicPortfolio = await portfolioService.buildPortfolio(req.params.studentId, {
      publicView: true,
    })
    if (!publicPortfolio?.portfolioPublic && ![ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.TEACHER].includes(req.user.role)) {
      throw new ApiError(403, 'Portfolio is private')
    }
    // Staff can see private portfolios; peers cannot.
    if ([ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.TEACHER].includes(req.user.role)) {
      return sendSuccess(res, await portfolioService.buildPortfolio(req.params.studentId))
    }
    return sendSuccess(res, publicPortfolio)
  }
  sendSuccess(res, await portfolioService.buildPortfolio(req.params.studentId))
})

const setPortfolioVisibility = asyncHandler(async (req, res) => {
  sendSuccess(
    res,
    await portfolioService.setPortfolioVisibility(req.user._id, req.body.public),
    'Portfolio visibility updated'
  )
})

const publicPortfolio = asyncHandler(async (req, res) => {
  sendSuccess(res, await portfolioService.getPublicPortfolio(req.params.slug))
})

const courseConfig = asyncHandler(async (req, res) => {
  sendSuccess(res, await gamificationService.getCourseConfig(req.params.courseId))
})

const updateCourseConfig = asyncHandler(async (req, res) => {
  const data = await gamificationService.updateCourseConfig(req.params.courseId, req.body)
  sendSuccess(res, data, 'Course gamification updated')
})

const adminDashboard = asyncHandler(async (req, res) => {
  const [gamification, certificates] = await Promise.all([
    gamificationService.adminDashboard(),
    require('../services/certificate.service').adminStats(),
  ])
  sendSuccess(res, { gamification, certificates })
})

const seedDefaults = asyncHandler(async (req, res) => {
  const data = await achievementService.seedDefaults()
  await gamificationService.getSettings()
  sendSuccess(res, data, 'Defaults seeded')
})

module.exports = {
  mySummary,
  studentSummary,
  dailyLogin,
  getSettings,
  updateSettings,
  listBadges,
  upsertBadge,
  awardBadgeManual,
  awardXpManual,
  listAchievements,
  upsertAchievement,
  myAchievements,
  leaderboard,
  myPortfolio,
  studentPortfolio,
  setPortfolioVisibility,
  publicPortfolio,
  courseConfig,
  updateCourseConfig,
  adminDashboard,
  seedDefaults,
}
