const mongoose = require('mongoose')
const { BATCH_STATUS, BATCH_DAYS } = require('../constants')

const batchSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    batchCode: { type: String, required: true, trim: true, uppercase: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    days: {
      type: [{ type: String, enum: BATCH_DAYS }],
      default: ['saturday', 'sunday'],
    },
    classTime: { type: String, default: '10:00 AM', trim: true },
    durationPerClass: { type: String, default: '2 Hours', trim: true },
    maximumStudents: { type: Number, default: 30, min: 1 },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: Object.values(BATCH_STATUS),
      default: BATCH_STATUS.UPCOMING,
      index: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
)

batchSchema.index({ course: 1, batchCode: 1 }, { unique: true })
batchSchema.index({ name: 'text', batchCode: 'text' })

module.exports = mongoose.model('Batch', batchSchema)
