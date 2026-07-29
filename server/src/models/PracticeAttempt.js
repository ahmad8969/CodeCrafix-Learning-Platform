const mongoose = require('mongoose')
const { ATTEMPT_STATUS, ATTEMPT_KIND } = require('../constants/practice')

const testResultSchema = new mongoose.Schema(
  {
    id: { type: String },
    label: { type: String, default: '' },
    visibility: { type: String, default: 'public' },
    passed: { type: Boolean, default: false },
    weight: { type: Number, default: 1 },
    message: { type: String, default: '' },
    expected: { type: String, default: '' },
    actual: { type: String, default: '' },
  },
  { _id: false }
)

/**
 * Single run or submit attempt for a practice question.
 */
const practiceAttemptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PracticeQuestion',
      required: true,
      index: true,
    },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null, index: true },
    topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: null },
    kind: {
      type: String,
      enum: Object.values(ATTEMPT_KIND),
      default: ATTEMPT_KIND.SUBMIT,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(ATTEMPT_STATUS),
      default: ATTEMPT_STATUS.STARTED,
      index: true,
    },
    files: [
      {
        path: String,
        language: String,
        content: String,
        entry: Boolean,
      },
    ],
    selectedOptionIds: [{ type: String }],
    answerPayload: { type: mongoose.Schema.Types.Mixed, default: {} },
    stdout: { type: String, default: '' },
    stderr: { type: String, default: '' },
    consoleLogs: [{ type: String }],
    publicResults: [testResultSchema],
    /** Hidden results stored but never returned to students on submit response */
    hiddenResults: { type: [testResultSchema], select: false, default: [] },
    hiddenSummary: {
      passed: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    score: { type: Number, default: 0, min: 0, max: 100 },
    maxScore: { type: Number, default: 100 },
    executionTimeMs: { type: Number, default: 0 },
    memoryKb: { type: Number, default: 0 },
    feedback: { type: String, default: '' },
    hintsUsed: [{ type: Number }],
    xpAwarded: { type: Number, default: 0 },
    xpPenalty: { type: Number, default: 0 },
    provider: { type: String, default: 'browser' },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

practiceAttemptSchema.index({ user: 1, question: 1, createdAt: -1 })
practiceAttemptSchema.index({ question: 1, kind: 1, createdAt: -1 })

module.exports = mongoose.model('PracticeAttempt', practiceAttemptSchema)
