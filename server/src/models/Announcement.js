const mongoose = require('mongoose')
const {
  ANNOUNCEMENT_PRIORITY,
  ANNOUNCEMENT_STATUS,
  ANNOUNCEMENT_AUDIENCE,
} = require('../constants/live-class')

const attachmentSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    url: { type: String, default: '' },
    mimeType: { type: String, default: '' },
  },
  { _id: false }
)

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 220 },
    body: { type: String, default: '' }, // rich text / markdown
    audience: {
      type: String,
      enum: Object.values(ANNOUNCEMENT_AUDIENCE),
      default: ANNOUNCEMENT_AUDIENCE.ALL_STUDENTS,
      index: true,
    },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null, index: true },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', default: null, index: true },
    teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    priority: {
      type: String,
      enum: Object.values(ANNOUNCEMENT_PRIORITY),
      default: ANNOUNCEMENT_PRIORITY.NORMAL,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(ANNOUNCEMENT_STATUS),
      default: ANNOUNCEMENT_STATUS.DRAFT,
      index: true,
    },
    images: [{ type: String }],
    attachments: [attachmentSchema],
    links: [{ label: String, url: String }],
    publishAt: { type: Date, default: null },
    publishedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
)

announcementSchema.index({ title: 'text', body: 'text' })

module.exports = mongoose.model('Announcement', announcementSchema)
