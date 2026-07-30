const { body, param, query } = require('express-validator')
const {
  CHAT_TYPES,
  TICKET_CATEGORIES,
  TICKET_PRIORITY,
  CRM_STAGES,
  SURVEY_TYPES,
  JOB_TYPES,
} = require('../constants/communication')

const mongoId = (field = 'id') => param(field).isMongoId()

const directChatRules = [body('userId').isMongoId()]
const groupChatRules = [
  body('title').optional().isString().trim(),
  body('type').optional().isIn(Object.values(CHAT_TYPES)),
  body('participantIds').optional().isArray(),
]
const messageRules = [
  body('body').optional().isString().isLength({ max: 10000 }),
  body('attachments').optional().isArray(),
]
const threadRules = [
  body('course').isMongoId(),
  body('title').optional().isString().trim(),
  body('body').isString().trim().isLength({ min: 1, max: 10000 }),
]
const ticketRules = [
  body('subject').isString().trim().isLength({ min: 3, max: 300 }),
  body('category').optional().isIn(Object.values(TICKET_CATEGORIES)),
  body('priority').optional().isIn(Object.values(TICKET_PRIORITY)),
]
const leadRules = [
  body('fullName').isString().trim().isLength({ min: 2 }),
  body('stage').optional().isIn(Object.values(CRM_STAGES)),
]
const surveyRules = [
  body('title').isString().trim().isLength({ min: 2 }),
  body('type').optional().isIn(Object.values(SURVEY_TYPES)),
  body('questions').optional().isArray(),
]
const jobRules = [
  body('title').isString().trim().isLength({ min: 2 }),
  body('company').isString().trim().isLength({ min: 2 }),
  body('type').optional().isIn(Object.values(JOB_TYPES)),
]
const searchRules = [query('q').optional().isString()]

module.exports = {
  mongoId,
  directChatRules,
  groupChatRules,
  messageRules,
  threadRules,
  ticketRules,
  leadRules,
  surveyRules,
  jobRules,
  searchRules,
}
