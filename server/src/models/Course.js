const mongoose = require('mongoose')
const {
  COURSE_STATUS,
  COURSE_DIFFICULTY,
  COURSE_VISIBILITY,
} = require('../constants')
const { slugify } = require('../utils/query')

const courseSettingsSchema = new mongoose.Schema(
  {
    enableCertificate: { type: Boolean, default: true },
    enablePractice: { type: Boolean, default: true },
    enableAssignment: { type: Boolean, default: true },
    enableQuiz: { type: Boolean, default: true },
    enableDiscussion: { type: Boolean, default: true },
    enableDownloads: { type: Boolean, default: true },
    enableNotes: { type: Boolean, default: true },
    enableLiveClasses: { type: Boolean, default: false },
    enableAiAssistant: { type: Boolean, default: false },
    enableAnnouncements: { type: Boolean, default: true },
    enableProgressTracking: { type: Boolean, default: true },
  },
  { _id: false }
)

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    shortDescription: { type: String, default: '', maxlength: 300 },
    fullDescription: { type: String, default: '', maxlength: 20000 },

    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    language: { type: String, default: 'English', trim: true },
    difficulty: {
      type: String,
      enum: Object.values(COURSE_DIFFICULTY),
      default: COURSE_DIFFICULTY.BEGINNER,
      index: true,
    },
    duration: { type: String, default: '3 Months', trim: true },
    estimatedHours: { type: Number, default: 40, min: 0 },

    thumbnail: { type: String, default: null },
    coverImage: { type: String, default: null },
    promoVideoUrl: { type: String, default: null },
    introVideoUrl: { type: String, default: null },

    price: { type: Number, default: 0, min: 0 },
    discountPrice: { type: Number, default: null, min: 0 },
    currency: { type: String, default: 'USD', uppercase: true, trim: true },

    enrollmentLimit: { type: Number, default: null, min: 0 },
    minimumAge: { type: Number, default: null, min: 0 },
    certificateAvailable: { type: Boolean, default: true },
    downloadableResources: { type: Boolean, default: true },

    tags: [{ type: String, trim: true }],
    learningOutcomes: [{ type: String, trim: true }],
    requirements: [{ type: String, trim: true }],
    targetAudience: [{ type: String, trim: true }],

    status: {
      type: String,
      enum: Object.values(COURSE_STATUS),
      default: COURSE_STATUS.DRAFT,
      index: true,
    },
    featured: { type: Boolean, default: false, index: true },
    trending: { type: Boolean, default: false },
    popular: { type: Boolean, default: false },

    visibility: {
      type: String,
      enum: Object.values(COURSE_VISIBILITY),
      default: COURSE_VISIBILITY.PUBLIC,
    },
    accessPassword: { type: String, default: null, select: false },

    seoTitle: { type: String, default: '', maxlength: 160 },
    seoDescription: { type: String, default: '', maxlength: 320 },
    seoKeywords: [{ type: String, trim: true }],

    settings: { type: courseSettingsSchema, default: () => ({}) },

    publishedAt: { type: Date, default: null },
    studentCountPlaceholder: { type: Number, default: 0, min: 0 },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

courseSchema.virtual('batchCount', {
  ref: 'Batch',
  localField: '_id',
  foreignField: 'course',
  count: true,
  match: { deletedAt: null },
})

courseSchema.index({ title: 'text', shortDescription: 'text', tags: 'text' })
courseSchema.index({ status: 1, featured: 1, createdAt: -1 })
courseSchema.index({ category: 1, status: 1 })

courseSchema.pre('validate', function ensureSlug() {
  if (!this.slug && this.title) this.slug = slugify(this.title)
})

module.exports = mongoose.model('Course', courseSchema)
