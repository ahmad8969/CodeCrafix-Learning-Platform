const mongoose = require('mongoose')

/**
 * Multi-tenant institute (CodeCrafters, Alpha Beacon, ABC Academy, …).
 * Users/courses/settings scoped by instituteId when MULTI_TENANT flag is on.
 */
const brandingSchema = new mongoose.Schema(
  {
    displayName: { type: String, default: 'CodeCrafters' },
    logoUrl: { type: String, default: null },
    faviconUrl: { type: String, default: null },
    primaryColor: { type: String, default: '#14b8a6' },
    secondaryColor: { type: String, default: '#0f766e' },
    customCss: { type: String, default: '' },
  },
  { _id: false }
)

const instituteSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
      index: true,
    },
    branding: { type: brandingSchema, default: () => ({}) },
    featureFlags: { type: Map, of: Boolean, default: undefined },
    enabledPlugins: [{ type: String, trim: true }],
    aiConfig: {
      provider: { type: String, default: 'none' },
      model: { type: String, default: null },
      rateLimitPerHour: { type: Number, default: 30 },
    },
    storagePrefix: { type: String, default: null },
    settings: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Institute', instituteSchema)
