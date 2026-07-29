const { body, param, query } = require('express-validator')
const {
  ASSIGNMENT_TYPES,
  ASSIGNMENT_DIFFICULTY,
  ASSIGNMENT_STATUS,
  SUBMISSION_STATUS,
} = require('../constants/assignment')

const mongoId = (field = 'id') => param(field).isMongoId()

const createRules = [
  body('title').isString().trim().isLength({ min: 3, max: 220 }),
  body('type').isIn(Object.values(ASSIGNMENT_TYPES)),
  body('course').isMongoId(),
  body('difficulty').optional().isIn(Object.values(ASSIGNMENT_DIFFICULTY)),
  body('status').optional().isIn(Object.values(ASSIGNMENT_STATUS)),
  body('maxMarks').optional().isFloat({ min: 0 }),
  body('passingMarks').optional().isFloat({ min: 0 }),
  body('maxAttempts').optional().isInt({ min: 0 }),
]

const updateRules = [
  mongoId('id'),
  body('title').optional().isString().trim().isLength({ min: 3, max: 220 }),
  body('type').optional().isIn(Object.values(ASSIGNMENT_TYPES)),
  body('status').optional().isIn(Object.values(ASSIGNMENT_STATUS)),
]

const gradeRules = [
  param('submissionId').isMongoId(),
  body('status').optional().isIn(Object.values(SUBMISSION_STATUS)),
  body('marks').optional().isFloat({ min: 0 }),
  body('teacherFeedback').optional().isString(),
  body('rubricScores').optional().isArray(),
]

const listRules = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
]

module.exports = {
  createRules,
  updateRules,
  gradeRules,
  listRules,
  mongoId,
}
