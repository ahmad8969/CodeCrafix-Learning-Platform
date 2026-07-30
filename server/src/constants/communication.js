const CHAT_TYPES = Object.freeze({
  DIRECT: 'direct',
  GROUP: 'group',
  BATCH: 'batch',
  COURSE: 'course',
  BROADCAST: 'broadcast',
})

const TICKET_CATEGORIES = Object.freeze({
  TECHNICAL: 'technical_issue',
  COURSE_CONTENT: 'course_content',
  ASSIGNMENT: 'assignment_issue',
  PAYMENT: 'payment_issue',
  CERTIFICATE: 'certificate_issue',
  GENERAL: 'general_inquiry',
})

const TICKET_STATUS = Object.freeze({
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  WAITING: 'waiting_for_student',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
})

const TICKET_PRIORITY = Object.freeze({
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
})

const CRM_STAGES = Object.freeze({
  LEAD: 'lead',
  INQUIRY: 'inquiry',
  COUNSELING: 'counseling',
  DEMO: 'demo_class',
  ADMISSION: 'admission',
  ENROLLMENT: 'enrollment',
  ACTIVE: 'active_student',
  ALUMNI: 'alumni',
})

const SURVEY_TYPES = Object.freeze({
  COURSE: 'course_feedback',
  TEACHER: 'teacher_feedback',
  INSTITUTE: 'institute_feedback',
  EXIT: 'exit_survey',
  EVENT: 'event_feedback',
})

const SURVEY_QUESTION_TYPES = Object.freeze({
  RATING: 'rating',
  TEXT: 'text',
  MULTIPLE_CHOICE: 'multiple_choice',
  YES_NO: 'yes_no',
})

const JOB_TYPES = Object.freeze({
  FULL_TIME: 'full_time',
  PART_TIME: 'part_time',
  REMOTE: 'remote',
  INTERNSHIP: 'internship',
  FREELANCE: 'freelance',
})

const APPLICATION_STATUS = Object.freeze({
  SAVED: 'saved',
  APPLIED: 'applied',
  REVIEWING: 'reviewing',
  INTERVIEW: 'interview',
  OFFERED: 'offered',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
})

const FREELANCE_PLATFORMS = Object.freeze({
  UPWORK: 'upwork',
  FIVERR: 'fiverr',
  FREELANCER: 'freelancer',
  PEOPLEPERHOUR: 'peopleperhour',
})

const COMM_NOTIFY = Object.freeze({
  NEW_MESSAGE: 'new_message',
  FORUM_REPLY: 'forum_reply',
  TICKET_UPDATE: 'ticket_update',
  JOB_POSTED: 'job_posted',
  SURVEY_PUBLISHED: 'survey_published',
  CAREER_EVENT: 'career_event',
  ALUMNI_MEETUP: 'alumni_meetup',
})

module.exports = {
  CHAT_TYPES,
  TICKET_CATEGORIES,
  TICKET_STATUS,
  TICKET_PRIORITY,
  CRM_STAGES,
  SURVEY_TYPES,
  SURVEY_QUESTION_TYPES,
  JOB_TYPES,
  APPLICATION_STATUS,
  FREELANCE_PLATFORMS,
  COMM_NOTIFY,
}
