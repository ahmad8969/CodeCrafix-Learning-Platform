const mongoose = require('mongoose')

const fileSnapshotSchema = new mongoose.Schema(
  {
    path: { type: String, required: true },
    language: { type: String, default: 'plaintext' },
    content: { type: String, default: '' },
    entry: { type: Boolean, default: false },
  },
  { _id: false }
)

/**
 * Immutable workspace save history — every save creates a version.
 */
const codeWorkspaceVersionSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CodeWorkspace',
      required: true,
      index: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true, index: true },
    version: { type: Number, required: true, min: 1 },
    files: { type: [fileSnapshotSchema], default: [] },
    activeFile: { type: String, default: 'index.html' },
    source: {
      type: String,
      enum: ['manual', 'auto', 'reset', 'restore', 'upload'],
      default: 'manual',
    },
    label: { type: String, default: '', maxlength: 200 },
    codingTimeSecondsSnapshot: { type: Number, default: 0 },
  },
  { timestamps: true }
)

codeWorkspaceVersionSchema.index({ workspace: 1, version: -1 }, { unique: true })
codeWorkspaceVersionSchema.index({ user: 1, lesson: 1, createdAt: -1 })

module.exports = mongoose.model('CodeWorkspaceVersion', codeWorkspaceVersionSchema)
