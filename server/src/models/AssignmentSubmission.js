const mongoose = require('mongoose')
const { SUBMISSION_STATUS, ASSIGNMENT_TYPES } = require('../constants/assignment')

const fileSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true },
    filename: { type: String, required: true },
    url: { type: String, required: true },
    mimeType: { type: String, default: '' },
    size: { type: Number, default: 0 },
  },
  { _id: false }
)

const codeFileSchema = new mongoose.Schema(
  {
    path: { type: String, required: true },
    language: { type: String, default: 'javascript' },
    content: { type: String, default: '' },
    entry: { type: Boolean, default: false },
  },
  { _id: false }
)

const rubricScoreSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, default: '' },
    maxMarks: { type: Number, default: 0 },
    awarded: { type: Number, default: 0, min: 0 },
    comment: { type: String, default: '' },
  },
  { _id: false }
)

const timelineEventSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    at: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    note: { type: String, default: '' },
  },
  { _id: false }
)

const assignmentSubmissionSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', default: null },
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
      index: true,
    },
    submissionType: {
      type: String,
      enum: Object.values(ASSIGNMENT_TYPES),
      required: true,
    },
    files: [fileSchema],
    githubUrl: { type: String, default: '' },
    externalUrl: { type: String, default: '' },
    richText: { type: String, default: '' },
    codeSnapshot: [codeFileSchema],
    attemptNumber: { type: Number, default: 1, min: 1 },
    isLate: { type: Boolean, default: false },
    submittedAt: { type: Date, default: null },
    marks: { type: Number, default: null, min: 0 },
    percentage: { type: Number, default: null, min: 0, max: 100 },
    status: {
      type: String,
      enum: Object.values(SUBMISSION_STATUS),
      default: SUBMISSION_STATUS.DRAFT,
      index: true,
    },
    teacherFeedback: { type: String, default: '' },
    rubricScores: [rubricScoreSchema],
    aiReviewPlaceholder: { type: String, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    timeline: [timelineEventSchema],
    virusScanStatus: {
      type: String,
      enum: ['pending', 'clean', 'flagged', 'skipped'],
      default: 'skipped',
    },
  },
  { timestamps: true }
)

assignmentSubmissionSchema.index({ assignment: 1, student: 1, attemptNumber: 1 }, { unique: true })
assignmentSubmissionSchema.index({ student: 1, status: 1, submittedAt: -1 })
assignmentSubmissionSchema.index({ assignment: 1, status: 1 })

module.exports = mongoose.model('AssignmentSubmission', assignmentSubmissionSchema)
