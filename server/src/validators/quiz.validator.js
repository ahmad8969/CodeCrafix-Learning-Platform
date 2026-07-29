const { body, param, query } = require('express-validator')
const { QUIZ_STATUS } = require('../constants/quiz')

const mongoId = (field = 'id') => param(field).isMongoId()

const createRules = [
  body('title').isString().trim().isLength({ min: 3, max: 220 }),
  body('course').isMongoId(),
  body('status').optional().isIn(Object.values(QUIZ_STATUS)),
  body('passingPercentage').optional().isFloat({ min: 0, max: 100 }),
  body('timeLimitMinutes').optional().isInt({ min: 0 }),
  body('maxAttempts').optional().isInt({ min: 0 }),
  body('items').optional().isArray(),
  body('poolRules').optional().isArray(),
]

const updateRules = [
  mongoId('id'),
  body('title').optional().isString().trim().isLength({ min: 3, max: 220 }),
  body('status').optional().isIn(Object.values(QUIZ_STATUS)),
]

const attemptProgressRules = [
  param('attemptId').isMongoId(),
  body('answers').optional().isArray(),
]

const listRules = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
]

module.exports = {
  createRules,
  updateRules,
  attemptProgressRules,
  listRules,
  mongoId,
}
