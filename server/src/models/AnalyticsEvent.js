const mongoose = require('mongoose')

/** Platform analytics event stream (aggregated later). */
const analyticsEventSchema = new mongoose.Schema(
  {
    institute: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', default: null, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    eventName: { type: String, required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', default: null },
    value: { type: Number, default: 1 },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    occurredAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
)

analyticsEventSchema.index({ eventName: 1, occurredAt: -1 })

module.exports = mongoose.model('AnalyticsEvent', analyticsEventSchema)
