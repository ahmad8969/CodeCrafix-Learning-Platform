/**
 * Quiz & Assessment Engine enums (Prompt 009).
 */
const QUIZ_STATUS = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
})

const QUIZ_ATTEMPT_STATUS = Object.freeze({
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  AUTO_SUBMITTED: 'auto_submitted',
  EXPIRED: 'expired',
  UNDER_REVIEW: 'under_review',
})

/** Quiz-supported question types (subset of practice bank + quiz-native). */
const QUIZ_QUESTION_TYPES = Object.freeze({
  MCQ: 'multiple_choice',
  MULTIPLE_SELECT: 'multiple_select',
  TRUE_FALSE: 'true_false',
  FILL_BLANK: 'fill_blank',
  MATCH: 'match_following',
  ARRANGE: 'arrange_steps',
  IMAGE: 'image_based',
  AUDIO: 'audio_based',
  VIDEO: 'video_based',
  SHORT: 'short_answer',
  LONG: 'long_answer',
  CODING: 'coding',
})

const QUIZ_IMPLEMENTED_TYPES = Object.freeze([
  QUIZ_QUESTION_TYPES.MCQ,
  QUIZ_QUESTION_TYPES.TRUE_FALSE,
  QUIZ_QUESTION_TYPES.FILL_BLANK,
  QUIZ_QUESTION_TYPES.CODING,
])

const QUIZ_NOTIFY = Object.freeze({
  PUBLISHED: 'quiz_published',
  STARTING_SOON: 'quiz_starting_soon',
  SUBMITTED: 'quiz_submitted',
  RESULT_PUBLISHED: 'quiz_result_published',
  RETAKE_AVAILABLE: 'quiz_retake_available',
})

module.exports = {
  QUIZ_STATUS,
  QUIZ_ATTEMPT_STATUS,
  QUIZ_QUESTION_TYPES,
  QUIZ_IMPLEMENTED_TYPES,
  QUIZ_NOTIFY,
}
