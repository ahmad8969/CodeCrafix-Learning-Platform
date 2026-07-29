const express = require('express')
const controller = require('../../controllers/live-class.controller')
const { protect } = require('../../middlewares/auth.middleware')
const { requirePermission, COURSE_PERMISSIONS } = require('../../middlewares/permission.middleware')
const { validate } = require('../../middlewares/validate.middleware')
const {
  createClassRules,
  updateClassRules,
  attendanceRules,
  announcementRules,
  eventRules,
  listRules,
  mongoId,
} = require('../../validators/live-class.validator')

const router = express.Router()
router.use(protect)

// Dashboards / schedules
router.get('/dashboard/admin', requirePermission(COURSE_PERMISSIONS.LIVE_CLASS_MANAGE), controller.adminDash)
router.get('/schedule/teacher', requirePermission(COURSE_PERMISSIONS.LIVE_CLASS_VIEW), controller.teacherSchedule)
router.get('/schedule/student', requirePermission(COURSE_PERMISSIONS.LIVE_CLASS_VIEW), controller.studentSchedule)

// Attendance
router.get('/attendance/me', requirePermission(COURSE_PERMISSIONS.ATTENDANCE_VIEW), controller.myAttendance)
router.get('/attendance/analytics', requirePermission(COURSE_PERMISSIONS.ATTENDANCE_MANAGE), controller.attendanceAnalytics)
router.get('/attendance/rules', requirePermission(COURSE_PERMISSIONS.ATTENDANCE_VIEW), controller.attendanceRulesGet)
router.put('/attendance/rules', requirePermission(COURSE_PERMISSIONS.ATTENDANCE_MANAGE), controller.attendanceRulesSave)
router.get(
  '/attendance/students/:studentId',
  requirePermission(COURSE_PERMISSIONS.ATTENDANCE_MANAGE),
  mongoId('studentId'),
  validate,
  controller.studentAttendance
)

// Announcements
router.get('/announcements', requirePermission(COURSE_PERMISSIONS.ANNOUNCEMENT_VIEW), listRules, validate, controller.listAnnouncements)
router.post('/announcements', requirePermission(COURSE_PERMISSIONS.ANNOUNCEMENT_MANAGE), announcementRules, validate, controller.createAnnouncement)
router.get('/announcements/:id', requirePermission(COURSE_PERMISSIONS.ANNOUNCEMENT_VIEW), mongoId('id'), validate, controller.getAnnouncement)
router.patch('/announcements/:id', requirePermission(COURSE_PERMISSIONS.ANNOUNCEMENT_MANAGE), mongoId('id'), validate, controller.updateAnnouncement)
router.post('/announcements/:id/publish', requirePermission(COURSE_PERMISSIONS.ANNOUNCEMENT_MANAGE), mongoId('id'), validate, controller.publishAnnouncement)
router.post('/announcements/:id/archive', requirePermission(COURSE_PERMISSIONS.ANNOUNCEMENT_MANAGE), mongoId('id'), validate, controller.archiveAnnouncement)
router.delete('/announcements/:id', requirePermission(COURSE_PERMISSIONS.ANNOUNCEMENT_MANAGE), mongoId('id'), validate, controller.deleteAnnouncement)

// Calendar
router.get('/calendar', requirePermission(COURSE_PERMISSIONS.LIVE_CLASS_VIEW), controller.calendar)
router.post('/calendar/events', requirePermission(COURSE_PERMISSIONS.LIVE_CLASS_MANAGE), eventRules, validate, controller.createEvent)
router.patch('/calendar/events/:id', requirePermission(COURSE_PERMISSIONS.LIVE_CLASS_MANAGE), mongoId('id'), validate, controller.updateEvent)
router.delete('/calendar/events/:id', requirePermission(COURSE_PERMISSIONS.LIVE_CLASS_MANAGE), mongoId('id'), validate, controller.deleteEvent)

// Recordings
router.get('/recordings', requirePermission(COURSE_PERMISSIONS.LIVE_CLASS_VIEW), controller.listRecordings)
router.post('/recordings', requirePermission(COURSE_PERMISSIONS.LIVE_CLASS_MANAGE), controller.addRecording)

// Live classes CRUD
router.get('/', requirePermission(COURSE_PERMISSIONS.LIVE_CLASS_VIEW), listRules, validate, controller.listClasses)
router.post('/', requirePermission(COURSE_PERMISSIONS.LIVE_CLASS_MANAGE), createClassRules, validate, controller.createClass)

router.post('/:id/start', requirePermission(COURSE_PERMISSIONS.LIVE_CLASS_MANAGE), mongoId('id'), validate, controller.startClass)
router.post('/:id/end', requirePermission(COURSE_PERMISSIONS.LIVE_CLASS_MANAGE), mongoId('id'), validate, controller.endClass)
router.post('/:id/cancel', requirePermission(COURSE_PERMISSIONS.LIVE_CLASS_MANAGE), mongoId('id'), validate, controller.cancelClass)
router.post('/:id/duplicate', requirePermission(COURSE_PERMISSIONS.LIVE_CLASS_MANAGE), mongoId('id'), validate, controller.duplicateClass)
router.get('/:id/roster', requirePermission(COURSE_PERMISSIONS.ATTENDANCE_MANAGE), mongoId('id'), validate, controller.roster)
router.get('/:id/attendance', requirePermission(COURSE_PERMISSIONS.ATTENDANCE_VIEW), mongoId('id'), validate, controller.classAttendance)
router.post('/:id/attendance', requirePermission(COURSE_PERMISSIONS.ATTENDANCE_MANAGE), attendanceRules, validate, controller.markAttendance)

router.get('/:id', requirePermission(COURSE_PERMISSIONS.LIVE_CLASS_VIEW), mongoId('id'), validate, controller.getClass)
router.patch('/:id', requirePermission(COURSE_PERMISSIONS.LIVE_CLASS_MANAGE), updateClassRules, validate, controller.updateClass)
router.delete('/:id', requirePermission(COURSE_PERMISSIONS.LIVE_CLASS_MANAGE), mongoId('id'), validate, controller.removeClass)

module.exports = router
