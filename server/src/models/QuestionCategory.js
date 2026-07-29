const mongoose = require('mongoose')

const questionCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    color: { type: String, default: '#14b8a6' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
)

module.exports = mongoose.model('QuestionCategory', questionCategorySchema)
