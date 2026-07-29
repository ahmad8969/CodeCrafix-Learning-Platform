/**
 * Enrollment, batch roster & learning-path enums (Prompt 010).
 */
const ENROLLMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  WITHDRAWN: 'withdrawn',
  TRANSFERRED: 'transferred',
  REJECTED: 'rejected',
})

const ENROLLMENT_SOURCE = Object.freeze({
  MANUAL: 'manual',
  BULK: 'bulk',
  SELF: 'self',
  CODE: 'enrollment_code',
  INVITE: 'invite', // architecture-ready
})

const UNLOCK_RULE_TYPES = Object.freeze({
  PREVIOUS_TOPIC: 'previous_topic_completed',
  MIN_QUIZ_SCORE: 'minimum_quiz_score',
  MIN_PRACTICE_SCORE: 'minimum_practice_score',
  ASSIGNMENT_APPROVED: 'assignment_approved',
  TEACHER_APPROVAL: 'teacher_approval',
  REQUIRED_ATTENDANCE: 'required_attendance', // placeholder — attendance later
  MIN_CODING_TIME: 'minimum_coding_time',
  MANUAL_UNLOCK: 'manual_unlock',
})

const TOPIC_LOCK_STATE = Object.freeze({
  AUTO: 'auto',
  FORCED_UNLOCK: 'forced_unlock',
  FORCED_LOCK: 'forced_lock',
})

const ENROLL_NOTIFY = Object.freeze({
  ENROLLED: 'enrollment_successful',
  BATCH_ASSIGNED: 'batch_assigned',
  TOPIC_UNLOCKED: 'topic_unlocked',
  ASSIGNMENT_DUE: 'assignment_due',
  QUIZ_REMINDER: 'quiz_reminder',
  COURSE_COMPLETED: 'course_completed',
})

module.exports = {
  ENROLLMENT_STATUS,
  ENROLLMENT_SOURCE,
  UNLOCK_RULE_TYPES,
  TOPIC_LOCK_STATE,
  ENROLL_NOTIFY,
}
