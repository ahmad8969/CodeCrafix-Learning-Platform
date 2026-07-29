/**
 * Assignment Management enums (Prompt 008).
 */
const ASSIGNMENT_TYPES = Object.freeze({
  CODING: 'coding',
  PROJECT: 'project',
  FILE_UPLOAD: 'file_upload',
  MULTI_FILE: 'multiple_files',
  PDF: 'pdf_submission',
  ZIP: 'zip_submission',
  IMAGE: 'image_submission',
  VIDEO: 'video_submission',
  EXTERNAL_LINK: 'external_link',
  GITHUB: 'github_repository',
  GOOGLE_DRIVE: 'google_drive_link',
  RICH_TEXT: 'rich_text',
})

const ASSIGNMENT_DIFFICULTY = Object.freeze({
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
})

const ASSIGNMENT_STATUS = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
})

const SUBMISSION_STATUS = Object.freeze({
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  NEEDS_REVISION: 'needs_revision',
})

const ASSIGNMENT_MODE = Object.freeze({
  INDIVIDUAL: 'individual',
  GROUP: 'group',
})

const DEFAULT_UPLOAD_CONFIG = Object.freeze({
  maxFileSizeMb: 25,
  maxFiles: 10,
  allowedMimeTypes: [
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'text/plain',
    'text/html',
    'text/css',
    'application/javascript',
    'application/json',
  ],
  allowedExtensions: ['.pdf', '.zip', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.mp4', '.webm', '.txt', '.html', '.css', '.js', '.json'],
})

const DEFAULT_RUBRIC = Object.freeze([
  { key: 'functionality', label: 'Functionality', maxMarks: 30 },
  { key: 'code_quality', label: 'Code Quality', maxMarks: 20 },
  { key: 'ui_design', label: 'UI Design', maxMarks: 15 },
  { key: 'naming', label: 'Naming Convention', maxMarks: 10 },
  { key: 'documentation', label: 'Documentation', maxMarks: 10 },
  { key: 'performance', label: 'Performance', maxMarks: 5 },
  { key: 'creativity', label: 'Creativity', maxMarks: 5 },
  { key: 'best_practices', label: 'Best Practices', maxMarks: 5 },
])

const ASSIGNMENT_NOTIFY = Object.freeze({
  PUBLISHED: 'assignment_published',
  SUBMISSION_RECEIVED: 'assignment_submission_received',
  REVIEW_COMPLETED: 'assignment_review_completed',
  MARKS_PUBLISHED: 'assignment_marks_published',
  REVISION_REQUESTED: 'assignment_revision_requested',
  DEADLINE_REMINDER: 'assignment_deadline_reminder',
  LATE_SUBMISSION: 'assignment_late_submission',
})

module.exports = {
  ASSIGNMENT_TYPES,
  ASSIGNMENT_DIFFICULTY,
  ASSIGNMENT_STATUS,
  SUBMISSION_STATUS,
  ASSIGNMENT_MODE,
  DEFAULT_UPLOAD_CONFIG,
  DEFAULT_RUBRIC,
  ASSIGNMENT_NOTIFY,
}
