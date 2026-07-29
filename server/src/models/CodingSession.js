const mongoose = require('mongoose')

/** Optional coding session recording for replay / plagiarism review. */
const codingSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true, index: true },
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'CodeWorkspace', default: null },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date, default: null },
    events: [
      {
        t: { type: Number, required: true },
        type: {
          type: String,
          enum: ['keydown', 'edit', 'run', 'error', 'save', 'submit'],
          required: true,
        },
        payload: { type: mongoose.Schema.Types.Mixed, default: {} },
      },
    ],
    timeSpentSeconds: { type: Number, default: 0 },
    finalSubmission: { type: mongoose.Schema.Types.Mixed, default: null },
    recordingEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
)

codingSessionSchema.index({ user: 1, lesson: 1, startedAt: -1 })

module.exports = mongoose.model('CodingSession', codingSessionSchema)
