const liveClassService = require('../services/live-class.service')
const attendanceService = require('../services/attendance.service')
const announcementService = require('../services/announcement.service')
const calendarService = require('../services/calendar.service')
const auditService = require('../services/audit.service')
const { asyncHandler, sendSuccess } = require('../utils/helpers')
const { ctxFromReq } = require('../utils/curriculum-access')
const { ROLES } = require('../constants')

const listClasses = asyncHandler(async (req, res) => {
  const data = await liveClassService.listLiveClasses(req.query, ctxFromReq(req))
  sendSuccess(res, data)
})

const getClass = asyncHandler(async (req, res) => {
  const data = await liveClassService.getLiveClass(req.params.id, ctxFromReq(req))
  sendSuccess(res, data)
})

const createClass = asyncHandler(async (req, res) => {
  const data = await liveClassService.createLiveClass(
    { ...req.body, teacher: req.body.teacher || req.user._id },
    req.user._id
  )
  await auditService.record(req, {
    action: 'live_class_created',
    resourceType: 'LiveClass',
    resourceId: data._id,
  })
  sendSuccess(res, data, 'Live class created', 201)
})

const updateClass = asyncHandler(async (req, res) => {
  const data = await liveClassService.updateLiveClass(
    req.params.id,
    req.body,
    req.user._id,
    ctxFromReq(req)
  )
  sendSuccess(res, data, 'Live class updated')
})

const cancelClass = asyncHandler(async (req, res) => {
  const data = await liveClassService.cancelLiveClass(
    req.params.id,
    req.user._id,
    req.body.reason,
    ctxFromReq(req)
  )
  sendSuccess(res, data, 'Live class cancelled')
})

const startClass = asyncHandler(async (req, res) => {
  const data = await liveClassService.startLiveClass(req.params.id, req.user._id, ctxFromReq(req))
  sendSuccess(res, data, 'Class started')
})

const endClass = asyncHandler(async (req, res) => {
  const data = await liveClassService.endLiveClass(req.params.id, req.user._id, ctxFromReq(req))
  sendSuccess(res, data, 'Class ended')
})

const duplicateClass = asyncHandler(async (req, res) => {
  const data = await liveClassService.duplicateLiveClass(
    req.params.id,
    req.user._id,
    ctxFromReq(req)
  )
  sendSuccess(res, data, 'Class duplicated', 201)
})

const removeClass = asyncHandler(async (req, res) => {
  const data = await liveClassService.deleteLiveClass(req.params.id, ctxFromReq(req))
  sendSuccess(res, data, 'Class deleted')
})

const teacherSchedule = asyncHandler(async (req, res) => {
  const teacherId =
    req.user.role === ROLES.TEACHER ? req.user._id : req.query.teacherId || req.user._id
  const items = await liveClassService.teacherSchedule(teacherId, req.query)
  sendSuccess(res, { items })
})

const studentSchedule = asyncHandler(async (req, res) => {
  const items = await liveClassService.studentSchedule(req.user._id, req.query)
  sendSuccess(res, { items })
})

const adminDash = asyncHandler(async (req, res) => {
  const data = await liveClassService.adminDashboard()
  const attendance = await attendanceService.analyticsOverview(req.query)
  sendSuccess(res, { ...data, attendance })
})

const roster = asyncHandler(async (req, res) => {
  const items = await attendanceService.ensureRoster(req.params.id)
  sendSuccess(res, { items })
})

const markAttendance = asyncHandler(async (req, res) => {
  const items = await attendanceService.markAttendance(
    req.params.id,
    req.body.entries || [],
    req.user._id,
    req
  )
  sendSuccess(res, { items }, 'Attendance saved')
})

const classAttendance = asyncHandler(async (req, res) => {
  const data = await attendanceService.classAttendanceReport(req.params.id)
  sendSuccess(res, data)
})

const myAttendance = asyncHandler(async (req, res) => {
  const data = await attendanceService.studentAttendanceSummary(req.user._id, req.query)
  sendSuccess(res, data)
})

const studentAttendance = asyncHandler(async (req, res) => {
  const data = await attendanceService.studentAttendanceSummary(req.params.studentId, req.query)
  sendSuccess(res, data)
})

const attendanceRulesGet = asyncHandler(async (req, res) => {
  const data = await attendanceService.getRules(req.query)
  sendSuccess(res, data)
})

const attendanceRulesSave = asyncHandler(async (req, res) => {
  const data = await attendanceService.upsertRules(req.body, req.user._id)
  sendSuccess(res, data, 'Rules saved')
})

const attendanceAnalytics = asyncHandler(async (req, res) => {
  const data = await attendanceService.analyticsOverview(req.query)
  sendSuccess(res, data)
})

const listAnnouncements = asyncHandler(async (req, res) => {
  const data = await announcementService.listAnnouncements(req.query, ctxFromReq(req))
  sendSuccess(res, data)
})

const getAnnouncement = asyncHandler(async (req, res) => {
  const data = await announcementService.getAnnouncement(req.params.id, ctxFromReq(req))
  sendSuccess(res, data)
})

const createAnnouncement = asyncHandler(async (req, res) => {
  const data = await announcementService.createAnnouncement(req.body, req.user._id)
  sendSuccess(res, data, 'Announcement created', 201)
})

const updateAnnouncement = asyncHandler(async (req, res) => {
  const data = await announcementService.updateAnnouncement(req.params.id, req.body, req.user._id)
  sendSuccess(res, data, 'Announcement updated')
})

const publishAnnouncement = asyncHandler(async (req, res) => {
  const data = await announcementService.publishAnnouncement(req.params.id, req.user._id)
  sendSuccess(res, data, 'Announcement published')
})

const archiveAnnouncement = asyncHandler(async (req, res) => {
  const data = await announcementService.archiveAnnouncement(req.params.id, req.user._id)
  sendSuccess(res, data, 'Announcement archived')
})

const deleteAnnouncement = asyncHandler(async (req, res) => {
  const data = await announcementService.deleteAnnouncement(req.params.id)
  sendSuccess(res, data, 'Announcement deleted')
})

const calendar = asyncHandler(async (req, res) => {
  const ctx = ctxFromReq(req)
  const data = await calendarService.getAcademicCalendar({
    ...req.query,
    userId: req.user._id,
    roleScope: ctx.courseScope,
  })
  sendSuccess(res, data)
})

const createEvent = asyncHandler(async (req, res) => {
  const data = await calendarService.createEvent(req.body, req.user._id)
  sendSuccess(res, data, 'Event created', 201)
})

const updateEvent = asyncHandler(async (req, res) => {
  const data = await calendarService.updateEvent(req.params.id, req.body, req.user._id)
  sendSuccess(res, data, 'Event updated')
})

const deleteEvent = asyncHandler(async (req, res) => {
  const data = await calendarService.deleteEvent(req.params.id)
  sendSuccess(res, data, 'Event deleted')
})

const addRecording = asyncHandler(async (req, res) => {
  const data = await liveClassService.addRecording(req.body, req.user._id)
  sendSuccess(res, data, 'Recording added', 201)
})

const listRecordings = asyncHandler(async (req, res) => {
  const items = await liveClassService.listRecordings(req.query)
  sendSuccess(res, { items })
})

module.exports = {
  listClasses,
  getClass,
  createClass,
  updateClass,
  cancelClass,
  startClass,
  endClass,
  duplicateClass,
  removeClass,
  teacherSchedule,
  studentSchedule,
  adminDash,
  roster,
  markAttendance,
  classAttendance,
  myAttendance,
  studentAttendance,
  attendanceRulesGet,
  attendanceRulesSave,
  attendanceAnalytics,
  listAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  publishAnnouncement,
  archiveAnnouncement,
  deleteAnnouncement,
  calendar,
  createEvent,
  updateEvent,
  deleteEvent,
  addRecording,
  listRecordings,
}
