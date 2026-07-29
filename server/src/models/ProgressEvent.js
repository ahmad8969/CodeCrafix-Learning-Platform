const mongoose = require('mongoose')

/**
 * Rich progress events beyond LessonView scroll %.
 */
const progressEventSchema = new mongoose.Schema(
  {
    institute: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', default: null, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null, index: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', default: null, index: true },
    eventType: {
      type: String,
      enum: [
        'lesson_started',
        'lesson_completed',
        'practice_completed',
        'assignment_submitted',
        'quiz_completed',
        'coding_time',
        'active_time',
        'idle_time',
        'daily_streak',
        'weekly_streak',
        'topic_completed',
        'topic_unlocked',
        'enrollment_started',
        'course_completed',
      ],
      required: true,
      index: true,
    },
    value: { type: Number, default: 0 },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    occurredAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
)

progressEventSchema.index({ user: 1, eventType: 1, occurredAt: -1 })

module.exports = mongoose.model('ProgressEvent', progressEventSchema)
