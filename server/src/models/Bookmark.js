const mongoose = require('mongoose')

const bookmarkSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    note: { type: String, default: '', maxlength: 500 },
  },
  { timestamps: true }
)

bookmarkSchema.index({ user: 1, lesson: 1 }, { unique: true })

module.exports = mongoose.model('Bookmark', bookmarkSchema)
