const { body, param, query } = require('express-validator')
const { CERTIFICATE_TYPES, CERTIFICATE_STATUS, APPROVAL_MODE } = require('../constants/certificate')

const mongoId = (field = 'id') => param(field).isMongoId()

const templateRules = [
  body('name').isString().trim().isLength({ min: 2, max: 160 }),
  body('type').optional().isIn(Object.values(CERTIFICATE_TYPES)),
  body('titleText').optional().isString().trim(),
  body('bodyText').optional().isString(),
  body('logoUrl').optional().isString(),
  body('backgroundUrl').optional().isString(),
  body('sealUrl').optional().isString(),
  body('active').optional().isBoolean(),
  body('isDefault').optional().isBoolean(),
  body('signatures').optional().isArray(),
]

const ruleRules = [
  body('minAttendancePercent').optional().isFloat({ min: 0, max: 100 }),
  body('minQuizScore').optional().isFloat({ min: 0, max: 100 }),
  body('minAssignmentMarksPercent').optional().isFloat({ min: 0, max: 100 }),
  body('minPracticeScore').optional().isFloat({ min: 0, max: 100 }),
  body('minCourseCompletionPercent').optional().isFloat({ min: 0, max: 100 }),
  body('approvalMode').optional().isIn(Object.values(APPROVAL_MODE)),
  body('enabled').optional().isBoolean(),
  body('certificateType').optional().isIn(Object.values(CERTIFICATE_TYPES)),
  body('template').optional().isMongoId(),
]

const issueRules = [
  body('courseId').isMongoId(),
  body('studentId').optional().isMongoId(),
  body('moduleId').optional().isMongoId(),
  body('type').optional().isIn(Object.values(CERTIFICATE_TYPES)),
  body('force').optional().isBoolean(),
]

const listRules = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(Object.values(CERTIFICATE_STATUS)),
  query('type').optional().isIn(Object.values(CERTIFICATE_TYPES)),
]

module.exports = {
  mongoId,
  templateRules,
  ruleRules,
  issueRules,
  listRules,
}
