const mongoose = require('mongoose')
const { ATTENDANCE_STATUS } = require('../constants/live-class')

const attendanceSchema = new mongoose.Schema(
  {
    liveClass: { type: mongoose.Schema.Types.ObjectId, ref: 'LiveClass', required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', default: null, index: true },
    status: {
      type: String,
      enum: Object.values(ATTENDANCE_STATUS),
      default: ATTENDANCE_STATUS.ABSENT,
      index: true,
    },
    joinTime: { type: Date, default: null },
    leaveTime: { type: Date, default: null },
    durationSeconds: { type: Number, default: 0, min: 0 },
    lateMinutes: { type: Number, default: 0, min: 0 },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    source: {
      type: String,
      enum: ['manual', 'automatic', 'qr', 'join_tracking'],
      default: 'manual',
    },
    notes: { type: String, default: '', maxlength: 1000 },
    overrideReason: { type: String, default: '' },
  },
  { timestamps: true }
)

attendanceSchema.index({ liveClass: 1, student: 1 }, { unique: true })
attendanceSchema.index({ student: 1, course: 1, status: 1 })

const attendanceRuleSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null, index: true },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', default: null, index: true },
    minimumAttendancePercent: { type: Number, default: 75, min: 0, max: 100 },
    lateAfterMinutes: { type: Number, default: 10, min: 0 },
    autoMarkAbsent: { type: Boolean, default: true },
    allowManualOverride: { type: Boolean, default: true },
    allowExcusedAbsence: { type: Boolean, default: true },
    // Architecture stubs
    enableAutomaticAttendance: { type: Boolean, default: false },
    enableQrAttendance: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
)

attendanceRuleSchema.index({ course: 1, batch: 1 }, { unique: true, sparse: true })

module.exports = {
  Attendance: mongoose.model('Attendance', attendanceSchema),
  AttendanceRule: mongoose.model('AttendanceRule', attendanceRuleSchema),
}
