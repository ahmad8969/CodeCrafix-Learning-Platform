const { body, param, query } = require('express-validator')
const { QUESTION_TYPES, QUESTION_DIFFICULTY, QUESTION_STATUS } = require('../constants/practice')

const mongoId = (field = 'id') => param(field).isMongoId().withMessage(`Invalid ${field}`)

const createQuestionRules = [
  body('title').isString().trim().isLength({ min: 3, max: 220 }),
  body('type').isIn(Object.values(QUESTION_TYPES)),
  body('difficulty').optional().isIn(Object.values(QUESTION_DIFFICULTY)),
  body('status').optional().isIn(Object.values(QUESTION_STATUS)),
  body('description').optional().isString(),
  body('xpReward').optional().isInt({ min: 0 }),
  body('options').optional().isArray(),
  body('testCases').optional().isArray(),
  body('starterFiles').optional().isArray(),
]

const updateQuestionRules = [
  mongoId('id'),
  body('title').optional().isString().trim().isLength({ min: 3, max: 220 }),
  body('type').optional().isIn(Object.values(QUESTION_TYPES)),
  body('difficulty').optional().isIn(Object.values(QUESTION_DIFFICULTY)),
  body('status').optional().isIn(Object.values(QUESTION_STATUS)),
]

const runSubmitRules = [
  mongoId('id'),
  body('files').optional().isArray(),
  body('selectedOptionIds').optional().isArray(),
  body('stdout').optional().isString(),
  body('consoleLogs').optional().isArray(),
  body('executionTimeMs').optional().isInt({ min: 0 }),
  body('memoryKb').optional().isInt({ min: 0 }),
  body('hintsUsed').optional().isArray(),
]

const assignRules = [
  param('topicId').isMongoId(),
  body('questionIds').isArray({ min: 1 }),
  body('questionIds.*').isMongoId(),
]

const listRules = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
]

module.exports = {
  createQuestionRules,
  updateQuestionRules,
  runSubmitRules,
  assignRules,
  listRules,
  mongoId,
}
