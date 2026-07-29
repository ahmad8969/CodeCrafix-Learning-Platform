const mongoose = require('mongoose')
const { CURRICULUM_STATUS, COURSE_DIFFICULTY } = require('../constants')
const { slugify } = require('../utils/query')

const topicSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true, index: true },
    week: { type: mongoose.Schema.Types.ObjectId, ref: 'Week', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, trim: true, lowercase: true },
    shortDescription: { type: String, default: '', maxlength: 500 },
    difficulty: {
      type: String,
      enum: Object.values(COURSE_DIFFICULTY),
      default: COURSE_DIFFICULTY.BEGINNER,
      index: true,
    },
    estimatedTime: { type: String, default: '', trim: true },
    displayOrder: { type: Number, default: 0, index: true },
    status: {
      type: String,
      enum: Object.values(CURRICULUM_STATUS),
      default: CURRICULUM_STATUS.DRAFT,
      index: true,
    },
    learningObjectives: [{ type: String, trim: true }],
    keywords: [{ type: String, trim: true }],
    tags: [{ type: String, trim: true }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
)

topicSchema.index({ week: 1, slug: 1 }, { unique: true })
topicSchema.index({ week: 1, displayOrder: 1 })
topicSchema.index({ course: 1, tags: 1 })

topicSchema.pre('validate', function ensureSlug() {
  if (!this.slug && this.name) this.slug = slugify(this.name)
})

module.exports = mongoose.model('Topic', topicSchema)
