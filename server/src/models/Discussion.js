const mongoose = require('mongoose')

/**
 * Expanded forum discussion — course → module → week → topic → lesson hierarchy.
 * Keeps lesson-level compatibility from architecture stub.
 */
const discussionSchema = new mongoose.Schema(
  {
    institute: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', default: null },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', default: null, index: true },
    week: { type: mongoose.Schema.Types.ObjectId, ref: 'Week', default: null, index: true },
    topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: null, index: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', default: null, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Discussion', default: null, index: true },
    title: { type: String, default: '', maxlength: 300 },
    body: { type: String, required: true, maxlength: 10000 },
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    pinned: { type: Boolean, default: false },
    locked: { type: Boolean, default: false },
    bestAnswer: { type: Boolean, default: false },
    bestAnswerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Discussion', default: null },
    reportedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    replyCount: { type: Number, default: 0 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

discussionSchema.index({ course: 1, createdAt: -1 })
discussionSchema.index({ topic: 1, createdAt: -1 })
discussionSchema.index({ lesson: 1, createdAt: -1 })

module.exports = mongoose.model('Discussion', discussionSchema)
