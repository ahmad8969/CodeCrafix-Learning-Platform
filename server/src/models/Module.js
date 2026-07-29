const mongoose = require('mongoose')
const { CURRICULUM_STATUS } = require('../constants')
const { slugify } = require('../utils/query')

const moduleSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, default: '', maxlength: 5000 },
    displayOrder: { type: Number, default: 0, index: true },
    estimatedDuration: { type: String, default: '', trim: true },
    status: {
      type: String,
      enum: Object.values(CURRICULUM_STATUS),
      default: CURRICULUM_STATUS.DRAFT,
      index: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
)

moduleSchema.index({ course: 1, slug: 1 }, { unique: true })
moduleSchema.index({ course: 1, displayOrder: 1 })

moduleSchema.pre('validate', function ensureSlug() {
  if (!this.slug && this.name) this.slug = slugify(this.name)
})

module.exports = mongoose.model('Module', moduleSchema)
