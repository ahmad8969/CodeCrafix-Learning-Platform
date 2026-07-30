const express = require('express')
const controller = require('../../controllers/gamification.controller')
const { protect } = require('../../middlewares/auth.middleware')
const { requirePermission, COURSE_PERMISSIONS } = require('../../middlewares/permission.middleware')
const { validate } = require('../../middlewares/validate.middleware')
const {
  mongoId,
  xpManualRules,
  badgeAwardRules,
  leaderboardRules,
  portfolioVisibilityRules,
} = require('../../validators/gamification.validator')

const router = express.Router()

// Public portfolio
router.get('/portfolio/public/:slug', controller.publicPortfolio)

router.use(protect)

router.get('/me', requirePermission(COURSE_PERMISSIONS.GAMIFICATION_VIEW), controller.mySummary)
router.post('/me/daily-login', requirePermission(COURSE_PERMISSIONS.GAMIFICATION_VIEW), controller.dailyLogin)
router.get('/me/achievements', requirePermission(COURSE_PERMISSIONS.GAMIFICATION_VIEW), controller.myAchievements)
router.get('/me/portfolio', requirePermission(COURSE_PERMISSIONS.GAMIFICATION_VIEW), controller.myPortfolio)
router.patch(
  '/me/portfolio/visibility',
  requirePermission(COURSE_PERMISSIONS.GAMIFICATION_VIEW),
  portfolioVisibilityRules,
  validate,
  controller.setPortfolioVisibility
)

router.get(
  '/leaderboard',
  requirePermission(COURSE_PERMISSIONS.GAMIFICATION_VIEW),
  leaderboardRules,
  validate,
  controller.leaderboard
)

router.get('/badges', requirePermission(COURSE_PERMISSIONS.GAMIFICATION_VIEW), controller.listBadges)
router.get('/achievements', requirePermission(COURSE_PERMISSIONS.GAMIFICATION_VIEW), controller.listAchievements)

router.get(
  '/settings',
  requirePermission(COURSE_PERMISSIONS.GAMIFICATION_MANAGE),
  controller.getSettings
)
router.put(
  '/settings',
  requirePermission(COURSE_PERMISSIONS.GAMIFICATION_MANAGE),
  controller.updateSettings
)

router.post(
  '/badges',
  requirePermission(COURSE_PERMISSIONS.GAMIFICATION_MANAGE),
  controller.upsertBadge
)
router.post(
  '/achievements',
  requirePermission(COURSE_PERMISSIONS.GAMIFICATION_MANAGE),
  controller.upsertAchievement
)
router.post(
  '/badges/award',
  requirePermission(COURSE_PERMISSIONS.GAMIFICATION_MANAGE),
  badgeAwardRules,
  validate,
  controller.awardBadgeManual
)
router.post(
  '/xp/award',
  requirePermission(COURSE_PERMISSIONS.GAMIFICATION_MANAGE),
  xpManualRules,
  validate,
  controller.awardXpManual
)

router.get(
  '/courses/:courseId/config',
  requirePermission(COURSE_PERMISSIONS.GAMIFICATION_VIEW),
  mongoId('courseId'),
  validate,
  controller.courseConfig
)
router.put(
  '/courses/:courseId/config',
  requirePermission(COURSE_PERMISSIONS.GAMIFICATION_MANAGE),
  mongoId('courseId'),
  validate,
  controller.updateCourseConfig
)

router.get(
  '/students/:studentId',
  requirePermission(COURSE_PERMISSIONS.GAMIFICATION_VIEW),
  mongoId('studentId'),
  validate,
  controller.studentSummary
)
router.get(
  '/students/:studentId/portfolio',
  requirePermission(COURSE_PERMISSIONS.GAMIFICATION_VIEW),
  mongoId('studentId'),
  validate,
  controller.studentPortfolio
)

router.get(
  '/admin/dashboard',
  requirePermission(COURSE_PERMISSIONS.GAMIFICATION_MANAGE),
  controller.adminDashboard
)
router.post(
  '/admin/seed-defaults',
  requirePermission(COURSE_PERMISSIONS.GAMIFICATION_MANAGE),
  controller.seedDefaults
)

module.exports = router
