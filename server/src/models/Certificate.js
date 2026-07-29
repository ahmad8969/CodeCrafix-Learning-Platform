const mongoose = require('mongoose')

const certificateTemplateSchema = new mongoose.Schema(
  {
    institute: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', default: null },
    name: { type: String, required: true },
    htmlTemplate: { type: String, default: '' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
)

const certificateSchema = new mongoose.Schema(
  {
    institute: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', default: null },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    template: { type: mongoose.Schema.Types.ObjectId, ref: 'CertificateTemplate', default: null },
    certificateNumber: { type: String, required: true, unique: true },
    qrPayload: { type: String, default: '' },
    verificationToken: { type: String, required: true, unique: true },
    issuedAt: { type: Date, default: Date.now },
    pdfUrl: { type: String, default: null },
  },
  { timestamps: true }
)

module.exports = {
  CertificateTemplate: mongoose.model('CertificateTemplate', certificateTemplateSchema),
  Certificate: mongoose.model('Certificate', certificateSchema),
}
