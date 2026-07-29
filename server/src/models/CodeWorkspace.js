const mongoose = require('mongoose')

const fileSchema = new mongoose.Schema(
  {
    path: { type: String, required: true, trim: true },
    language: { type: String, default: 'html', trim: true },
    content: { type: String, default: '' },
    entry: { type: Boolean, default: false },
  },
  { _id: false }
)

/**
 * Student live coding workspace — browser HTML/CSS/JS for Phase 1.
 * currentVersion tracks CodeWorkspaceVersion snapshots.
 */
const codeWorkspaceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    institute: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', default: null, index: true },
    runtime: {
      type: String,
      enum: ['browser', 'react', 'node', 'express', 'mongodb', 'tailwind', 'judge0', 'docker', 'webcontainer', 'sandpack'],
      default: 'browser',
    },
    executionEngine: {
      type: String,
      enum: ['browser', 'docker', 'judge0', 'webcontainer', 'sandpack'],
      default: 'browser',
    },
    languageIds: [{ type: String }],
    files: { type: [fileSchema], default: [] },
    activeFile: { type: String, default: 'index.html' },
    codingTimeSeconds: { type: Number, default: 0, min: 0 },
    /** @deprecated use currentVersion */
    versionPlaceholder: { type: Number, default: 1 },
    currentVersion: { type: Number, default: 0, min: 0 },
    lastSavedAt: { type: Date, default: Date.now },
    lastSaveSource: {
      type: String,
      enum: ['manual', 'auto', 'reset', 'restore', 'upload'],
      default: 'manual',
    },
  },
  { timestamps: true }
)

codeWorkspaceSchema.index({ user: 1, lesson: 1 }, { unique: true })
codeWorkspaceSchema.index({ user: 1, lastSavedAt: -1 })

module.exports = mongoose.model('CodeWorkspace', codeWorkspaceSchema)
