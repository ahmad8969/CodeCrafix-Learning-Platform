const mongoose = require('mongoose')

/** Recently viewed / reading progress — architecture ready for Prompt 005+ */
const lessonViewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    scrollPercent: { type: Number, default: 0, min: 0, max: 100 },
    completed: { type: Boolean, default: false },
    lastViewedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

lessonViewSchema.index({ user: 1, lesson: 1 }, { unique: true })
lessonViewSchema.index({ user: 1, lastViewedAt: -1 })

module.exports = mongoose.model('LessonView', lessonViewSchema)
