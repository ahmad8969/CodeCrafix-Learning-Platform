const mongoose = require('mongoose')
const { CURRICULUM_STATUS } = require('../constants')

const weekSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true, index: true },
    weekNumber: { type: Number, required: true, min: 1 },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', maxlength: 5000 },
    displayOrder: { type: Number, default: 0, index: true },
    estimatedHours: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: Object.values(CURRICULUM_STATUS),
      default: CURRICULUM_STATUS.DRAFT,
      index: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
)

weekSchema.index({ module: 1, displayOrder: 1 })
weekSchema.index({ course: 1, weekNumber: 1 })

module.exports = mongoose.model('Week', weekSchema)
