const mongoose = require('mongoose')
const { QUIZ_STATUS } = require('../constants/quiz')
const { slugify } = require('../utils/query')

const poolRuleSchema = new mongoose.Schema(
  {
    categories: [{ type: String }],
    difficulties: [{ type: String }],
    types: [{ type: String }],
    languageIds: [{ type: String }],
    count: { type: Number, default: 0, min: 0 },
    marksEach: { type: Number, default: 1, min: 0 },
  },
  { _id: false }
)

const quizItemSchema = new mongoose.Schema(
  {
    practiceQuestion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PracticeQuestion',
      default: null,
    },
    /** Inline snapshot for quiz-native / cloned questions */
    snapshot: { type: mongoose.Schema.Types.Mixed, default: null },
    marks: { type: Number, default: 1, min: 0 },
    displayOrder: { type: Number, default: 0 },
    required: { type: Boolean, default: true },
  },
  { _id: true }
)

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 220 },
    slug: { type: String, required: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    instructions: { type: String, default: '' },

    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', default: null },
    week: { type: mongoose.Schema.Types.ObjectId, ref: 'Week', default: null },
    topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: null, index: true },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', default: null },
    category: { type: String, default: 'General', trim: true, index: true },

    status: {
      type: String,
      enum: Object.values(QUIZ_STATUS),
      default: QUIZ_STATUS.DRAFT,
      index: true,
    },

    passingPercentage: { type: Number, default: 60, min: 0, max: 100 },
    totalMarks: { type: Number, default: 0, min: 0 },
    totalQuestions: { type: Number, default: 0, min: 0 },
    timeLimitMinutes: { type: Number, default: 30, min: 0 },
    maxAttempts: { type: Number, default: 3, min: 0 },

    randomQuestions: { type: Boolean, default: false },
    randomOptions: { type: Boolean, default: false },
    shuffleQuestions: { type: Boolean, default: true },
    shuffleAnswers: { type: Boolean, default: true },
    showResultImmediately: { type: Boolean, default: true },
    showCorrectAnswers: { type: Boolean, default: true },
    negativeMarking: { type: Boolean, default: false },
    negativeMarkValue: { type: Number, default: 0.25, min: 0 },
    partialMarks: { type: Boolean, default: true },
    enableReview: { type: Boolean, default: true },
    lockAfterSubmission: { type: Boolean, default: true },
    pauseDisabled: { type: Boolean, default: true },
    resumeSupport: { type: Boolean, default: false },

    items: [quizItemSchema],
    poolRules: [poolRuleSchema],

    publishAt: { type: Date, default: null },
    startAt: { type: Date, default: null },
    endAt: { type: Date, default: null },

    xpReward: { type: Number, default: 75, min: 0 },
    unlockNextTopicOnPass: { type: Boolean, default: false },
    nextTopic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: null },

    attemptCount: { type: Number, default: 0 },
    passCount: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    averageTimeSeconds: { type: Number, default: 0 },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
)

quizSchema.index({ title: 'text', description: 'text' })
quizSchema.index({ course: 1, status: 1 })
quizSchema.index({ slug: 1, course: 1 }, { unique: true })

quizSchema.pre('validate', function ensureSlug() {
  if (!this.slug && this.title) this.slug = slugify(this.title)
})

module.exports = mongoose.model('Quiz', quizSchema)
