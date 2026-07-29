const mongoose = require('mongoose')
const { RESOURCE_TYPES, RESOURCE_VISIBILITY } = require('../constants')

const resourceSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true, index: true },
    topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: null, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', maxlength: 2000 },
    type: {
      type: String,
      enum: Object.values(RESOURCE_TYPES),
      default: RESOURCE_TYPES.WEBSITE,
      index: true,
    },
    url: { type: String, required: true, trim: true },
    size: { type: String, default: '', trim: true },
    visibility: {
      type: String,
      enum: Object.values(RESOURCE_VISIBILITY),
      default: RESOURCE_VISIBILITY.ENROLLED,
    },
    displayOrder: { type: Number, default: 0, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
)

resourceSchema.index({ lesson: 1, displayOrder: 1 })

module.exports = mongoose.model('Resource', resourceSchema)
