const mongoose = require('mongoose')
const { ENROLLMENT_STATUS, ENROLLMENT_SOURCE } = require('../constants/enrollment')

const enrollmentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', default: null, index: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    status: {
      type: String,
      enum: Object.values(ENROLLMENT_STATUS),
      default: ENROLLMENT_STATUS.ACTIVE,
      index: true,
    },
    source: {
      type: String,
      enum: Object.values(ENROLLMENT_SOURCE),
      default: ENROLLMENT_SOURCE.MANUAL,
    },
    enrollmentCodeUsed: { type: String, default: '' },
    enrolledAt: { type: Date, default: Date.now },
    approvedAt: { type: Date, default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    completedAt: { type: Date, default: null },
    withdrawnAt: { type: Date, default: null },
    transferredFromBatch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', default: null },
    transferredFromCourse: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
    notes: { type: String, default: '', maxlength: 2000 },
    overallProgress: { type: Number, default: 0, min: 0, max: 100 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
)

enrollmentSchema.index(
  { student: 1, course: 1 },
  {
    unique: true,
    partialFilterExpression: {
      deletedAt: null,
      status: { $in: ['pending', 'active'] },
    },
  }
)
enrollmentSchema.index({ batch: 1, status: 1 })
enrollmentSchema.index({ enrolledAt: -1 })

module.exports = mongoose.model('Enrollment', enrollmentSchema)
