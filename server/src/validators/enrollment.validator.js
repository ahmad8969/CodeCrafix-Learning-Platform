const { body, param, query } = require('express-validator')
const { ENROLLMENT_STATUS, ENROLLMENT_SOURCE } = require('../constants/enrollment')

const mongoId = (field = 'id') => param(field).isMongoId()

const createRules = [
  body('studentId').optional().isMongoId(),
  body('student').optional().isMongoId(),
  body('courseId').optional().isMongoId(),
  body('course').optional().isMongoId(),
  body('batchId').optional().isMongoId(),
  body('batch').optional().isMongoId(),
  body('source').optional().isIn(Object.values(ENROLLMENT_SOURCE)),
  body('notes').optional().isString().isLength({ max: 2000 }),
]

const bulkRules = [body('rows').optional().isArray(), body('enrollments').optional().isArray()]

const transferBatchRules = [
  mongoId('id'),
  body('batchId').optional().isMongoId(),
  body('toBatchId').optional().isMongoId(),
]

const codeRules = [body('code').isString().trim().isLength({ min: 3, max: 32 })]

const unlockRules = [
  body('studentId').isMongoId(),
  body('topicId').isMongoId(),
  body('courseId').isMongoId(),
  body('lock').optional().isBoolean(),
]

const listRules = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(Object.values(ENROLLMENT_STATUS)),
]

module.exports = {
  createRules,
  bulkRules,
  transferBatchRules,
  codeRules,
  unlockRules,
  listRules,
  mongoId,
}
