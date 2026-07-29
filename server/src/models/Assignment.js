const mongoose = require('mongoose')
const {
  ASSIGNMENT_TYPES,
  ASSIGNMENT_DIFFICULTY,
  ASSIGNMENT_STATUS,
  ASSIGNMENT_MODE,
  DEFAULT_UPLOAD_CONFIG,
  DEFAULT_RUBRIC,
} = require('../constants/assignment')
const { slugify } = require('../utils/query')

const attachmentSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    type: { type: String, default: 'file' },
    url: { type: String, required: true },
    size: { type: Number, default: 0 },
    mimeType: { type: String, default: '' },
  },
  { _id: false }
)

const rubricItemSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    maxMarks: { type: Number, required: true, min: 0 },
    description: { type: String, default: '' },
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

const testCaseSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, default: '' },
    visibility: { type: String, enum: ['public', 'hidden'], default: 'public' },
    assertion: { type: String, default: 'file_contains' },
    targetPath: { type: String, default: '' },
    pattern: { type: String, default: '' },
    expectedOutput: { type: String, default: '' },
    weight: { type: Number, default: 1 },
  },
  { _id: false }
)

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 220 },
    slug: { type: String, required: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    instructions: { type: String, default: '' },
    objectives: [{ type: String, trim: true }],

    type: {
      type: String,
      enum: Object.values(ASSIGNMENT_TYPES),
      required: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: Object.values(ASSIGNMENT_DIFFICULTY),
      default: ASSIGNMENT_DIFFICULTY.MEDIUM,
    },
    status: {
      type: String,
      enum: Object.values(ASSIGNMENT_STATUS),
      default: ASSIGNMENT_STATUS.DRAFT,
      index: true,
    },
    mode: {
      type: String,
      enum: Object.values(ASSIGNMENT_MODE),
      default: ASSIGNMENT_MODE.INDIVIDUAL,
    },

    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', default: null },
    week: { type: mongoose.Schema.Types.ObjectId, ref: 'Week', default: null },
    topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: null, index: true },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', default: null, index: true },

    estimatedMinutes: { type: Number, default: 60, min: 0 },
    maxMarks: { type: Number, default: 100, min: 0 },
    passingMarks: { type: Number, default: 50, min: 0 },
    maxAttempts: { type: Number, default: 3, min: 0 },
    allowResubmission: { type: Boolean, default: true },
    lateSubmissionAllowed: { type: Boolean, default: true },
    latePenaltyPercent: { type: Number, default: 10, min: 0, max: 100 },

    publishAt: { type: Date, default: null },
    startAt: { type: Date, default: null },
    dueAt: { type: Date, default: null },
    endAt: { type: Date, default: null },

    attachments: [attachmentSchema],
    referenceLinks: [{ title: String, url: String }],

    /** Coding */
    starterFiles: [starterFileSchema],
    expectedOutput: { type: String, default: '' },
    testCases: [testCaseSchema],
    languageIds: [{ type: String }],
    executionEngine: { type: String, default: 'browser' },

    rubrics: { type: [rubricItemSchema], default: () => [...DEFAULT_RUBRIC] },
    uploadConfig: {
      maxFileSizeMb: { type: Number, default: DEFAULT_UPLOAD_CONFIG.maxFileSizeMb },
      maxFiles: { type: Number, default: DEFAULT_UPLOAD_CONFIG.maxFiles },
      allowedExtensions: { type: [String], default: () => [...DEFAULT_UPLOAD_CONFIG.allowedExtensions] },
      allowedMimeTypes: { type: [String], default: () => [...DEFAULT_UPLOAD_CONFIG.allowedMimeTypes] },
    },

    /** Learning path unlock placeholder */
    unlockNextTopicOnPass: { type: Boolean, default: false },
    nextTopic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: null },

    xpReward: { type: Number, default: 100, min: 0 },
    displayOrder: { type: Number, default: 0 },

    submissionCount: { type: Number, default: 0 },
    approvedCount: { type: Number, default: 0 },
    averageMarks: { type: Number, default: 0 },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
)

assignmentSchema.index({ title: 'text', description: 'text', instructions: 'text' })
assignmentSchema.index({ course: 1, status: 1, dueAt: 1 })
assignmentSchema.index({ slug: 1, course: 1 }, { unique: true })

assignmentSchema.pre('validate', function ensureSlug() {
  if (!this.slug && this.title) this.slug = slugify(this.title)
})

module.exports = mongoose.model('Assignment', assignmentSchema)
