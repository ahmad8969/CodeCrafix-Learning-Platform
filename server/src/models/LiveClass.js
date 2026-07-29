const mongoose = require('mongoose')
const { LIVE_CLASS_STATUS, MEETING_PROVIDERS, WEEK_DAYS } = require('../constants/live-class')

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    url: { type: String, default: '' },
    type: { type: String, default: 'link' },
  },
  { _id: false }
)

const liveClassSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 220 },
    description: { type: String, default: '' },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', default: null, index: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', default: null },
    week: { type: mongoose.Schema.Types.ObjectId, ref: 'Week', default: null },
    topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: null },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', default: null },

    scheduledDate: { type: Date, required: true, index: true },
    startTime: { type: String, required: true, trim: true }, // "10:00 AM"
    endTime: { type: String, required: true, trim: true },
    durationMinutes: { type: Number, default: 120, min: 15 },
    timezone: { type: String, default: 'Asia/Karachi' },
    startsAt: { type: Date, required: true, index: true },
    endsAt: { type: Date, required: true },

    meetingProvider: {
      type: String,
      enum: Object.values(MEETING_PROVIDERS),
      default: MEETING_PROVIDERS.EXTERNAL_LINK,
    },
    meetingLink: { type: String, default: '' },
    meetingPassword: { type: String, default: '', select: false },
    externalMeetingId: { type: String, default: '' },
    meetingMeta: { type: mongoose.Schema.Types.Mixed, default: {} },

    resources: [resourceSchema],
    status: {
      type: String,
      enum: Object.values(LIVE_CLASS_STATUS),
      default: LIVE_CLASS_STATUS.SCHEDULED,
      index: true,
    },

    isRecurring: { type: Boolean, default: false },
    recurrenceRule: {
      frequency: { type: String, enum: ['weekly', 'daily', 'none'], default: 'none' },
      daysOfWeek: [{ type: String, enum: WEEK_DAYS }],
      until: { type: Date, default: null },
      parentClass: { type: mongoose.Schema.Types.ObjectId, ref: 'LiveClass', default: null },
    },

    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancelReason: { type: String, default: '' },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
)

liveClassSchema.index({ title: 'text', description: 'text' })
liveClassSchema.index({ teacher: 1, startsAt: 1 })
liveClassSchema.index({ batch: 1, startsAt: 1 })
liveClassSchema.index({ course: 1, status: 1, startsAt: 1 })

module.exports = mongoose.model('LiveClass', liveClassSchema)
