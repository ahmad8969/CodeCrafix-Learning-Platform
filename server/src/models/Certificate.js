const mongoose = require('mongoose')
const {
  CERTIFICATE_TYPES,
  CERTIFICATE_STATUS,
  APPROVAL_MODE,
} = require('../constants/certificate')

const signatureSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    title: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
  },
  { _id: false }
)

const certificateTemplateSchema = new mongoose.Schema(
  {
    institute: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', default: null },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: Object.values(CERTIFICATE_TYPES),
      default: CERTIFICATE_TYPES.COURSE,
    },
    description: { type: String, default: '' },
    logoUrl: { type: String, default: '' },
    backgroundUrl: { type: String, default: '' },
    sealUrl: { type: String, default: '' },
    primaryColor: { type: String, default: '#0d9488' },
    accentColor: { type: String, default: '#134e4a' },
    titleText: { type: String, default: 'Certificate of Completion' },
    bodyText: {
      type: String,
      default:
        'This is to certify that {{studentName}} has successfully completed {{courseName}}.',
    },
    htmlTemplate: { type: String, default: '' },
    showQr: { type: Boolean, default: true },
    showVerificationUrl: { type: Boolean, default: true },
    showCertificateNumber: { type: Boolean, default: true },
    showInstructor: { type: Boolean, default: true },
    showCompletionDate: { type: Boolean, default: true },
    showSeal: { type: Boolean, default: true },
    signatures: [signatureSchema],
    active: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
)

const certificateRuleSchema = new mongoose.Schema(
  {
    institute: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', default: null },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', default: null },
    certificateType: {
      type: String,
      enum: Object.values(CERTIFICATE_TYPES),
      default: CERTIFICATE_TYPES.COURSE,
    },
    template: { type: mongoose.Schema.Types.ObjectId, ref: 'CertificateTemplate', default: null },
    enabled: { type: Boolean, default: true },
    minAttendancePercent: { type: Number, default: 0, min: 0, max: 100 },
    minQuizScore: { type: Number, default: 0, min: 0, max: 100 },
    minAssignmentMarksPercent: { type: Number, default: 0, min: 0, max: 100 },
    minPracticeScore: { type: Number, default: 0, min: 0, max: 100 },
    minCourseCompletionPercent: { type: Number, default: 100, min: 0, max: 100 },
    approvalMode: {
      type: String,
      enum: Object.values(APPROVAL_MODE),
      default: APPROVAL_MODE.AUTOMATIC,
    },
    teacherApprovalRequired: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
)

certificateRuleSchema.index({ course: 1, module: 1, certificateType: 1 }, { unique: true })

const certificateSchema = new mongoose.Schema(
  {
    institute: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', default: null },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', default: null },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', default: null },
    template: { type: mongoose.Schema.Types.ObjectId, ref: 'CertificateTemplate', default: null },
    type: {
      type: String,
      enum: Object.values(CERTIFICATE_TYPES),
      default: CERTIFICATE_TYPES.COURSE,
    },
    status: {
      type: String,
      enum: Object.values(CERTIFICATE_STATUS),
      default: CERTIFICATE_STATUS.PENDING_APPROVAL,
      index: true,
    },
    title: { type: String, default: 'Certificate of Completion' },
    studentName: { type: String, default: '' },
    courseName: { type: String, default: '' },
    instructorName: { type: String, default: '' },
    completionDate: { type: Date, default: null },
    certificateNumber: { type: String, required: true, unique: true },
    qrPayload: { type: String, default: '' },
    verificationToken: { type: String, required: true, unique: true, index: true },
    verificationUrl: { type: String, default: '' },
    issuedAt: { type: Date, default: null },
    revokedAt: { type: Date, default: null },
    revokeReason: { type: String, default: '' },
    pdfUrl: { type: String, default: null },
    snapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
    eligibilitySnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
)

certificateSchema.index({ user: 1, course: 1, type: 1, module: 1, status: 1 })

module.exports = {
  CertificateTemplate: mongoose.model('CertificateTemplate', certificateTemplateSchema),
  CertificateRule: mongoose.model('CertificateRule', certificateRuleSchema),
  Certificate: mongoose.model('Certificate', certificateSchema),
}
