const mongoose = require('mongoose')

/**
 * Personal notes placeholder model.
 * Persistence APIs are stubbed for Prompt 005; full CRUD can expand later.
 */
const lessonNoteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    content: { type: String, default: '', maxlength: 20000 },
  },
  { timestamps: true }
)

lessonNoteSchema.index({ user: 1, lesson: 1 }, { unique: true })

module.exports = mongoose.model('LessonNote', lessonNoteSchema)
