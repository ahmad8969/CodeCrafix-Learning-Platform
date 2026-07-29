const { body, param, query } = require('express-validator')
const {
  LIVE_CLASS_STATUS,
  MEETING_PROVIDERS,
  ATTENDANCE_STATUS,
  ANNOUNCEMENT_PRIORITY,
  ANNOUNCEMENT_STATUS,
  ANNOUNCEMENT_AUDIENCE,
  CALENDAR_EVENT_TYPES,
} = require('../constants/live-class')

const mongoId = (field = 'id') => param(field).isMongoId()

const createClassRules = [
  body('title').isString().trim().isLength({ min: 3, max: 220 }),
  body('course').isMongoId(),
  body('teacher').optional().isMongoId(),
  body('batch').optional().isMongoId(),
  body('startTime').isString().trim(),
  body('endTime').isString().trim(),
  body('scheduledDate').optional().isISO8601(),
  body('startsAt').optional().isISO8601(),
  body('meetingProvider').optional().isIn(Object.values(MEETING_PROVIDERS)),
  body('status').optional().isIn(Object.values(LIVE_CLASS_STATUS)),
]

const updateClassRules = [
  mongoId('id'),
  body('title').optional().isString().trim().isLength({ min: 3, max: 220 }),
  body('status').optional().isIn(Object.values(LIVE_CLASS_STATUS)),
]

const attendanceRules = [
  mongoId('id'),
  body('entries').isArray({ min: 1 }),
  body('entries.*.studentId').isMongoId(),
  body('entries.*.status').optional().isIn(Object.values(ATTENDANCE_STATUS)),
]

const announcementRules = [
  body('title').isString().trim().isLength({ min: 3, max: 220 }),
  body('audience').optional().isIn(Object.values(ANNOUNCEMENT_AUDIENCE)),
  body('priority').optional().isIn(Object.values(ANNOUNCEMENT_PRIORITY)),
  body('status').optional().isIn(Object.values(ANNOUNCEMENT_STATUS)),
]

const eventRules = [
  body('title').isString().trim().isLength({ min: 2, max: 220 }),
  body('type').optional().isIn(Object.values(CALENDAR_EVENT_TYPES)),
  body('startAt').isISO8601(),
]

const listRules = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
]

module.exports = {
  createClassRules,
  updateClassRules,
  attendanceRules,
  announcementRules,
  eventRules,
  listRules,
  mongoId,
}
