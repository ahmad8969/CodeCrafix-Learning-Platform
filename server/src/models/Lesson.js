const mongoose = require('mongoose')
const { CURRICULUM_STATUS, LESSON_TYPES } = require('../constants')

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

    /** Live coding (Prompt 006) */
    enableLiveCoding: { type: Boolean, default: false, index: true },
    codingRuntime: {
      type: String,
      enum: ['browser', 'react', 'node', 'express', 'mongodb', 'tailwind'],
      default: 'browser',
    },
    starterFiles: [
      {
        path: { type: String, required: true },
        language: { type: String, default: 'html' },
        content: { type: String, default: '' },
        entry: { type: Boolean, default: false },
      },
    ],
    expectedOutput: { type: String, default: '' },
    hints: [{ type: String, trim: true }],
    solutionPlaceholder: { type: String, default: '' },
    challengePlaceholder: { type: String, default: '' },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
)

lessonSchema.index({ topic: 1, displayOrder: 1 })
lessonSchema.index({ course: 1, status: 1, lessonType: 1 })
lessonSchema.index({ title: 'text', summary: 'text', content: 'text' })

module.exports = mongoose.model('Lesson', lessonSchema)
