const mongoose = require('mongoose')

/**
 * Class recordings — architecture supports upload, external link, cloud storage.
 */
const classRecordingSchema = new mongoose.Schema(
  {
    liveClass: { type: mongoose.Schema.Types.ObjectId, ref: 'LiveClass', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', default: null },
    week: { type: mongoose.Schema.Types.ObjectId, ref: 'Week', default: null },
    topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: null },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', default: null },
    storageType: {
      type: String,
      enum: ['upload', 'external_link', 'cloud'],
      default: 'external_link',
    },
    url: { type: String, required: true },
    thumbnailUrl: { type: String, default: '' },
    durationSeconds: { type: Number, default: 0 },
    fileSizeBytes: { type: Number, default: 0 },
    downloadable: { type: Boolean, default: true },
    published: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

module.exports = mongoose.model('ClassRecording', classRecordingSchema)
