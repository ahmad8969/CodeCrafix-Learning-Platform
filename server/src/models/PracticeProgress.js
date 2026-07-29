const mongoose = require('mongoose')

/**
 * Aggregated student progress per question.
 */
const practiceProgressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PracticeQuestion',
      required: true,
      index: true,
    },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null, index: true },
    topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: null, index: true },
    attempts: { type: Number, default: 0 },
    runCount: { type: Number, default: 0 },
    submissionCount: { type: Number, default: 0 },
    bestScore: { type: Number, default: 0 },
    latestScore: { type: Number, default: 0 },
    completed: { type: Boolean, default: false, index: true },
    skipped: { type: Boolean, default: false },
    totalTimeSeconds: { type: Number, default: 0 },
    codingTimeSeconds: { type: Number, default: 0 },
    averageTimeSeconds: { type: Number, default: 0 },
    successRate: { type: Number, default: 0 },
    lastAttemptAt: { type: Date, default: null },
    bookmarked: { type: Boolean, default: false },
  },
  { timestamps: true }
)

practiceProgressSchema.index({ user: 1, question: 1 }, { unique: true })
practiceProgressSchema.index({ user: 1, course: 1, completed: 1 })

module.exports = mongoose.model('PracticeProgress', practiceProgressSchema)
