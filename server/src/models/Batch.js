const mongoose = require('mongoose')
const { BATCH_STATUS, BATCH_DAYS } = require('../constants')

const scheduleSlotSchema = new mongoose.Schema(
  {
    day: { type: String, enum: BATCH_DAYS, required: true },
    startTime: { type: String, default: '10:00 AM', trim: true },
    endTime: { type: String, default: '12:00 PM', trim: true },
  },
  { _id: false }
)

const batchSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    batchCode: { type: String, required: true, trim: true, uppercase: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    /** Legacy flat fields — kept for backward compatibility */
    days: {
      type: [{ type: String, enum: BATCH_DAYS }],
      default: ['saturday', 'sunday'],
    },
    classTime: { type: String, default: '10:00 AM', trim: true },
    durationPerClass: { type: String, default: '2 Hours', trim: true },
    /** Configurable weekly schedule (Prompt 010) */
    weeklySchedule: {
      type: [scheduleSlotSchema],
      default: [
        { day: 'friday', startTime: '10:00 AM', endTime: '12:00 PM' },
        { day: 'saturday', startTime: '10:00 AM', endTime: '12:00 PM' },
        { day: 'sunday', startTime: '10:00 AM', endTime: '12:00 PM' },
      ],
    },
    classDurationMinutes: { type: Number, default: 120, min: 15 },
    classroomLink: { type: String, default: '', trim: true },
    notes: { type: String, default: '', maxlength: 4000 },
    maximumStudents: { type: Number, default: 30, min: 1 },
    currentStudents: { type: Number, default: 0, min: 0 },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: Object.values(BATCH_STATUS),
      default: BATCH_STATUS.UPCOMING,
      index: true,
    },
    enrollmentCode: { type: String, default: '', trim: true, uppercase: true, index: true },
    allowSelfEnroll: { type: Boolean, default: false },
    requireApproval: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
)

batchSchema.index({ course: 1, batchCode: 1 }, { unique: true })
batchSchema.index({ name: 'text', batchCode: 'text' })

module.exports = mongoose.model('Batch', batchSchema)
