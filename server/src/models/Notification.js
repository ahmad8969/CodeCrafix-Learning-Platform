const mongoose = require('mongoose')

const notificationTemplateSchema = new mongoose.Schema(
  {
    institute: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', default: null },
    key: { type: String, required: true, trim: true, unique: true },
    channel: {
      type: String,
      enum: ['in_app', 'email', 'whatsapp', 'push', 'sms'],
      default: 'in_app',
    },
    subject: { type: String, default: '' },
    body: { type: String, required: true },
    variables: [{ type: String }],
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
)

const notificationSchema = new mongoose.Schema(
  {
    institute: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', default: null, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    channel: {
      type: String,
      enum: ['in_app', 'email', 'whatsapp', 'push', 'sms'],
      default: 'in_app',
      index: true,
    },
    templateKey: { type: String, default: null },
    title: { type: String, required: true, trim: true },
    body: { type: String, default: '' },
    link: { type: String, default: null },
    readAt: { type: Date, default: null },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
)

notificationSchema.index({ user: 1, createdAt: -1 })
notificationSchema.index({ user: 1, readAt: 1 })

module.exports = {
  Notification: mongoose.model('Notification', notificationSchema),
  NotificationTemplate: mongoose.model('NotificationTemplate', notificationTemplateSchema),
}
