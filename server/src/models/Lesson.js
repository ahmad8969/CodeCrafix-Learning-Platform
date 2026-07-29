const mongoose = require('mongoose')
const { CURRICULUM_STATUS, LESSON_TYPES } = require('../constants')
const { WORKSPACE_TYPES } = require('../constants/workspace-types')
const { AI_ACTIONS } = require('../config/ai-providers')
const { DEFAULT_EVALUATION_CONFIG } = require('../config/evaluation-engine')

const starterFileSchema = new mongoose.Schema(
  {
    path: { type: String, required: true },
    language: { type: String, default: 'html' },
    content: { type: String, default: '' },
    entry: { type: Boolean, default: false },
  },
  { _id: false }
)

const testCaseSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, default: '' },
    input: { type: String, default: '' },
    expected: { type: String, default: '' },
    weight: { type: Number, default: 1, min: 0 },
    hidden: { type: Boolean, default: false },
  },
  { _id: false }
)

const lessonSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true, index: true },
    week: { type: mongoose.Schema.Types.ObjectId, ref: 'Week', required: true, index: true },
    topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    lessonType: {
      type: String,
      enum: Object.values(LESSON_TYPES),
      default: LESSON_TYPES.MARKDOWN,
      index: true,
    },

    /** Recommendation 1 — drives UI layout */
    workspaceType: {
      type: String,
      enum: Object.values(WORKSPACE_TYPES),
      default: WORKSPACE_TYPES.THEORY,
      index: true,
    },

    content: { type: String, default: '' },
    summary: { type: String, default: '', maxlength: 2000 },
    estimatedReadingTime: { type: Number, default: 5, min: 0 },
    displayOrder: { type: Number, default: 0, index: true },
    status: {
      type: String,
      enum: Object.values(CURRICULUM_STATUS),
      default: CURRICULUM_STATUS.DRAFT,
      index: true,
    },
    previewAllowed: { type: Boolean, default: false, index: true },
    bookmarksEnabled: { type: Boolean, default: true },
    versionHistoryPlaceholder: { type: Boolean, default: true },

    /** Live coding — language config is registry-driven (no hardcoded lists in UI) */
    enableLiveCoding: { type: Boolean, default: false, index: true },
    languageIds: [{ type: String, trim: true }],
    primaryLanguageId: { type: String, default: 'html', trim: true },
    starterTemplateId: { type: String, default: 'html_css_js', trim: true },
    codingRuntime: {
      type: String,
      enum: ['browser', 'react', 'node', 'express', 'mongodb', 'tailwind', 'judge0', 'docker', 'webcontainer', 'sandpack'],
      default: 'browser',
    },
    executionEngine: {
      type: String,
      enum: ['browser', 'docker', 'judge0', 'webcontainer', 'sandpack'],
      default: 'browser',
    },
    starterFiles: [starterFileSchema],

    /** Auto-evaluation architecture (Prompt 007+) */
    evaluation: {
      strategy: { type: String, default: DEFAULT_EVALUATION_CONFIG.strategy },
      publicTests: [testCaseSchema],
      hiddenTests: [testCaseSchema],
      expectedOutput: { type: String, default: '' },
      customValidatorId: { type: String, default: null },
      maxScore: { type: Number, default: 100 },
      partialMarksEnabled: { type: Boolean, default: true },
      performanceScoring: { type: Boolean, default: false },
      engineId: { type: String, default: 'default' },
    },

    expectedOutput: { type: String, default: '' },
    hints: [{ type: String, trim: true }],
    solutionPlaceholder: { type: String, default: '' },
    challengePlaceholder: { type: String, default: '' },

    /** AI placeholders per lesson */
    aiEnabled: { type: Boolean, default: true },
    aiActions: {
      type: [String],
      default: () => Object.values(AI_ACTIONS),
    },

    /** Modular features */
    discussionEnabled: { type: Boolean, default: false },
    sessionRecordingEnabled: { type: Boolean, default: false },
    offlineReadable: { type: Boolean, default: true },

    videoUrl: { type: String, default: '' },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
)

lessonSchema.index({ topic: 1, displayOrder: 1 })
lessonSchema.index({ course: 1, status: 1, lessonType: 1 })
lessonSchema.index({ workspaceType: 1, enableLiveCoding: 1 })
lessonSchema.index({ title: 'text', summary: 'text', content: 'text' })

/** Derive enableLiveCoding from workspace type when not explicitly set by callers */
lessonSchema.pre('save', function syncCodingFlag() {
  const codingTypes = new Set([
    WORKSPACE_TYPES.THEORY_PRACTICE,
    WORKSPACE_TYPES.CODING_CHALLENGE,
    WORKSPACE_TYPES.MINI_PROJECT,
    WORKSPACE_TYPES.ASSIGNMENT,
  ])
  if (this.isModified('workspaceType') && !this.isModified('enableLiveCoding')) {
    this.enableLiveCoding = codingTypes.has(this.workspaceType)
  }
  if (this.evaluation && this.expectedOutput && !this.evaluation.expectedOutput) {
    this.evaluation.expectedOutput = this.expectedOutput
  }
})

module.exports = mongoose.model('Lesson', lessonSchema)
