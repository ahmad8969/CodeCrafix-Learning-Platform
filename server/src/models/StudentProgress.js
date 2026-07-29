const mongoose = require('mongoose')
const { TOPIC_LOCK_STATE } = require('../constants/enrollment')

/**
 * Per-student course progress snapshot (Prompt 010).
 */
const studentProgressSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    enrollment: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment', default: null },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', default: null },

    currentModule: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', default: null },
    currentWeek: { type: mongoose.Schema.Types.ObjectId, ref: 'Week', default: null },
    currentTopic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: null },
    currentLesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', default: null },

    lessonsCompleted: { type: Number, default: 0 },
    lessonsTotal: { type: Number, default: 0 },
    practiceCompleted: { type: Number, default: 0 },
    assignmentsCompleted: { type: Number, default: 0 },
    quizzesCompleted: { type: Number, default: 0 },
    quizzesPassed: { type: Number, default: 0 },
    codingTimeSeconds: { type: Number, default: 0 },
    readingTimeSeconds: { type: Number, default: 0 },
    overallCompletion: { type: Number, default: 0, min: 0, max: 100 },
    learningStreak: { type: Number, default: 0 },
    lastActivityAt: { type: Date, default: null },
    completedTopicIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topic' }],
  },
  { timestamps: true }
)

studentProgressSchema.index({ student: 1, course: 1 }, { unique: true })

/**
 * Manual lock/unlock overrides + topic completion flags.
 */
const topicAccessSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true, index: true },
    lockState: {
      type: String,
      enum: Object.values(TOPIC_LOCK_STATE),
      default: TOPIC_LOCK_STATE.AUTO,
    },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    unlockedAt: { type: Date, default: null },
    unlockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
)

topicAccessSchema.index({ student: 1, topic: 1 }, { unique: true })

module.exports = {
  StudentProgress: mongoose.model('StudentProgress', studentProgressSchema),
  TopicAccess: mongoose.model('TopicAccess', topicAccessSchema),
}
