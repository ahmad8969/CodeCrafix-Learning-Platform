const mongoose = require('mongoose')
const { CALENDAR_EVENT_TYPES } = require('../constants/live-class')

const calendarEventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 220 },
    description: { type: String, default: '' },
    type: {
      type: String,
      enum: Object.values(CALENDAR_EVENT_TYPES),
      default: CALENDAR_EVENT_TYPES.CUSTOM,
      index: true,
    },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null, index: true },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', default: null, index: true },
    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date, default: null },
    allDay: { type: Boolean, default: false },
    color: { type: String, default: '#14b8a6' },
    /** Optional link to source entity */
    sourceType: { type: String, default: '' },
    sourceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
)

calendarEventSchema.index({ title: 'text' })
calendarEventSchema.index({ startAt: 1, endAt: 1 })

module.exports = mongoose.model('CalendarEvent', calendarEventSchema)
