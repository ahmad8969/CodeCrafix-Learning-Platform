/**
 * Practice engine enums — Question Bank + Evaluation (Prompt 007).
 */
const QUESTION_TYPES = Object.freeze({
  CODING: 'coding',
  MCQ: 'multiple_choice',
  TRUE_FALSE: 'true_false',
  FILL_BLANK: 'fill_blank',
  ARRANGE: 'arrange_steps',
  MATCH: 'match_following',
  SHORT: 'short_answer',
  LONG: 'long_answer',
  PROJECT: 'project_task',
  FILE_UPLOAD: 'file_upload',
  DRAG_DROP: 'drag_drop',
})

/** Fully implemented in Prompt 007 */
const IMPLEMENTED_QUESTION_TYPES = Object.freeze([
  QUESTION_TYPES.CODING,
  QUESTION_TYPES.MCQ,
])

const QUESTION_DIFFICULTY = Object.freeze({
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
})

const QUESTION_STATUS = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
})

const ATTEMPT_STATUS = Object.freeze({
  STARTED: 'started',
  RUN: 'run',
  SUBMITTED: 'submitted',
  PASSED: 'passed',
  FAILED: 'failed',
  PARTIAL: 'partial',
  SKIPPED: 'skipped',
})

const ATTEMPT_KIND = Object.freeze({
  RUN: 'run',
  SUBMIT: 'submit',
})

const TEST_VISIBILITY = Object.freeze({
  PUBLIC: 'public',
  HIDDEN: 'hidden',
})

const TEST_ASSERTION = Object.freeze({
  EXPECTED_OUTPUT: 'expected_output',
  CONTAINS: 'contains',
  REGEX: 'regex',
  STDOUT: 'stdout',
  FILE_CONTAINS: 'file_contains',
  CUSTOM: 'custom',
})

module.exports = {
  QUESTION_TYPES,
  IMPLEMENTED_QUESTION_TYPES,
  QUESTION_DIFFICULTY,
  QUESTION_STATUS,
  ATTEMPT_STATUS,
  ATTEMPT_KIND,
  TEST_VISIBILITY,
  TEST_ASSERTION,
}
