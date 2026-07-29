const mongoose = require('mongoose')

/**
 * Offline sync queue — client stores ops locally, posts when online.
 */
const offlineSyncSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    clientOpId: { type: String, required: true },
    opType: {
      type: String,
      enum: ['lesson_note', 'bookmark', 'workspace_save', 'progress'],
      required: true,
    },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    clientTimestamp: { type: Date, required: true },
    syncedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['applied', 'conflict', 'rejected'], default: 'applied' },
  },
  { timestamps: true }
)

offlineSyncSchema.index({ user: 1, clientOpId: 1 }, { unique: true })

module.exports = mongoose.model('OfflineSyncOp', offlineSyncSchema)
