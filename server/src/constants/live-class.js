/**
 * Live Classes, Attendance, Calendar, Announcements (Prompt 011).
 */
const LIVE_CLASS_STATUS = Object.freeze({
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  POSTPONED: 'postponed',
})

const MEETING_PROVIDERS = Object.freeze({
  NONE: 'none',
  ZOOM: 'zoom',
  GOOGLE_MEET: 'google_meet',
  MICROSOFT_TEAMS: 'microsoft_teams',
  CUSTOM: 'custom',
  EXTERNAL_LINK: 'external_link',
})

const ATTENDANCE_STATUS = Object.freeze({
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  EXCUSED: 'excused',
})

const ANNOUNCEMENT_PRIORITY = Object.freeze({
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
})

const ANNOUNCEMENT_STATUS = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
})

const ANNOUNCEMENT_AUDIENCE = Object.freeze({
  ALL_STUDENTS: 'all_students',
  COURSE: 'course',
  BATCH: 'batch',
  TEACHER: 'teacher',
  INDIVIDUAL: 'individual',
})

const CALENDAR_EVENT_TYPES = Object.freeze({
  LIVE_CLASS: 'live_class',
  ASSIGNMENT: 'assignment_deadline',
  QUIZ: 'quiz_date',
  EXAM: 'exam',
  HOLIDAY: 'holiday',
  INSTITUTE_EVENT: 'institute_event',
  WORKSHOP: 'workshop',
  SEMINAR: 'seminar',
  CUSTOM: 'custom',
})

const LIVE_NOTIFY = Object.freeze({
  CLASS_SCHEDULED: 'class_scheduled',
  CLASS_RESCHEDULED: 'class_rescheduled',
  CLASS_CANCELLED: 'class_cancelled',
  CLASS_STARTING_SOON: 'class_starting_soon',
  ATTENDANCE_MARKED: 'attendance_marked',
  ANNOUNCEMENT_PUBLISHED: 'announcement_published',
  RECORDING_AVAILABLE: 'recording_available',
})

const WEEK_DAYS = Object.freeze([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
])

module.exports = {
  LIVE_CLASS_STATUS,
  MEETING_PROVIDERS,
  ATTENDANCE_STATUS,
  ANNOUNCEMENT_PRIORITY,
  ANNOUNCEMENT_STATUS,
  ANNOUNCEMENT_AUDIENCE,
  CALENDAR_EVENT_TYPES,
  LIVE_NOTIFY,
  WEEK_DAYS,
}
