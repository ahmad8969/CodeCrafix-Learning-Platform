const mongoose = require('mongoose')
const { CATEGORY_STATUS } = require('../constants')
const { slugify } = require('../utils/query')

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '', maxlength: 2000 },
    icon: { type: String, default: 'book' },
    color: { type: String, default: '#14b8a6' },
    displayOrder: { type: Number, default: 0 },
    status: {
      type: String,
      enum: Object.values(CATEGORY_STATUS),
      default: CATEGORY_STATUS.ACTIVE,
      index: true,
    },
    seoTitle: { type: String, default: '', maxlength: 160 },
    seoDescription: { type: String, default: '', maxlength: 320 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
)

categorySchema.index({ name: 'text', description: 'text' })
categorySchema.index({ displayOrder: 1, status: 1 })

categorySchema.pre('validate', function ensureSlug() {
  if (!this.slug && this.name) this.slug = slugify(this.name)
})

categorySchema.methods.isDeleted = function isDeleted() {
  return Boolean(this.deletedAt)
}

module.exports = mongoose.model('Category', categorySchema)
