const mongoose = require('mongoose')
const {
  QUESTION_TYPES,
  QUESTION_DIFFICULTY,
  QUESTION_STATUS,
  TEST_VISIBILITY,
  TEST_ASSERTION,
} = require('../constants/practice')
const { slugify } = require('../utils/query')

const testCaseSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, default: '' },
    visibility: {
      type: String,
      enum: Object.values(TEST_VISIBILITY),
      default: TEST_VISIBILITY.PUBLIC,
    },
    assertion: {
      type: String,
      enum: Object.values(TEST_ASSERTION),
      default: TEST_ASSERTION.EXPECTED_OUTPUT,
    },
    sampleInput: { type: String, default: '' },
    sampleOutput: { type: String, default: '' },
    expectedOutput: { type: String, default: '' },
    /** For file_contains — which path to inspect */
    targetPath: { type: String, default: '' },
    /** Needle / pattern for contains|regex|file_contains */
    pattern: { type: String, default: '' },
    weight: { type: Number, default: 1, min: 0 },
    customValidatorId: { type: String, default: null },
  },
  { _id: false }
)

const starterFileSchema = new mongoose.Schema(
  {
    path: { type: String, required: true },
    language: { type: String, default: 'javascript' },
    content: { type: String, default: '' },
    entry: { type: Boolean, default: false },
  },
  { _id: false }
)

const mcqOptionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    isCorrect: { type: Boolean, default: false, select: false },
  },
  { _id: false }
)

const hintSchema = new mongoose.Schema(
  {
    order: { type: Number, default: 1 },
    text: { type: String, required: true },
    xpPenalty: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
)

/**
 * Practice Question — coding + MCQ fully supported; other types architecture-ready.
 */
const practiceQuestionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 220 },
    slug: { type: String, required: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    type: {
      type: String,
      enum: Object.values(QUESTION_TYPES),
      required: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: Object.values(QUESTION_DIFFICULTY),
      default: QUESTION_DIFFICULTY.EASY,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(QUESTION_STATUS),
      default: QUESTION_STATUS.DRAFT,
      index: true,
    },

    category: { type: String, default: 'General', trim: true, index: true },
    tags: [{ type: String, trim: true }],
    languageIds: [{ type: String, trim: true }],
    primaryLanguageId: { type: String, default: 'javascript' },
    executionEngine: {
      type: String,
      enum: ['browser', 'docker', 'judge0', 'webcontainer', 'sandpack', 'custom'],
      default: 'browser',
    },

    /** Curriculum links */
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null, index: true },
    topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: null, index: true },
    module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', default: null },
    week: { type: mongoose.Schema.Types.ObjectId, ref: 'Week', default: null },

    /** Coding */
    starterFiles: [starterFileSchema],
    starterTemplateId: { type: String, default: 'html_css_js' },
    expectedOutput: { type: String, default: '' },
    constraints: { type: String, default: '' },
    testCases: [testCaseSchema],
    timeLimitMs: { type: Number, default: 5000, min: 100 },
    memoryLimitMb: { type: Number, default: 128, min: 16 },
    maxAttempts: { type: Number, default: 0, min: 0 }, // 0 = unlimited
    referenceSolution: { type: String, default: '', select: false },
    explanation: { type: String, default: '' },
    revealSolution: { type: Boolean, default: false },
    teacherNotes: { type: String, default: '', select: false },

    /** MCQ / architecture for other types */
    options: [mcqOptionSchema],
    allowMultipleAnswers: { type: Boolean, default: false },
    /** Payload for fill/arrange/match/etc. — schema varies by type */
    typePayload: { type: mongoose.Schema.Types.Mixed, default: {} },

    hints: [hintSchema],
    xpReward: { type: Number, default: 50, min: 0 },
    displayOrder: { type: Number, default: 0, index: true },

    /** Stats denormalized */
    attemptCount: { type: Number, default: 0 },
    successCount: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    averageTimeSeconds: { type: Number, default: 0 },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
)

practiceQuestionSchema.index({ title: 'text', description: 'text', tags: 'text' })
practiceQuestionSchema.index({ topic: 1, displayOrder: 1, status: 1 })
practiceQuestionSchema.index({ type: 1, difficulty: 1, status: 1 })
practiceQuestionSchema.index({ slug: 1 }, { unique: true })

practiceQuestionSchema.pre('validate', function ensureSlug() {
  if (!this.slug && this.title) this.slug = slugify(this.title)
})

module.exports = mongoose.model('PracticeQuestion', practiceQuestionSchema)
