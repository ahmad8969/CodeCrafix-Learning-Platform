const { body, param, query } = require('express-validator')
const { LEADERBOARD_SCOPES, LEADERBOARD_METRICS } = require('../constants/gamification')

const mongoId = (field = 'id') => param(field).isMongoId()

const xpManualRules = [
  body('studentId').isMongoId(),
  body('amount').isFloat({ min: 0 }),
  body('courseId').optional().isMongoId(),
  body('reason').optional().isString().trim(),
]

const badgeAwardRules = [
  body('studentId').isMongoId(),
  body('badgeKey').isString().trim().notEmpty(),
]

const leaderboardRules = [
  query('scope').optional().isIn(Object.values(LEADERBOARD_SCOPES)),
  query('metric').optional().isIn(Object.values(LEADERBOARD_METRICS)),
  query('courseId').optional().isMongoId(),
  query('batchId').optional().isMongoId(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
]

const portfolioVisibilityRules = [body('public').isBoolean()]

module.exports = {
  mongoId,
  xpManualRules,
  badgeAwardRules,
  leaderboardRules,
  portfolioVisibilityRules,
}
