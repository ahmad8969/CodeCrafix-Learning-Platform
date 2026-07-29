const { Notification, NotificationTemplate } = require('../models/Notification')
const emailService = require('./email.service')

/**
 * Centralized notification service — template-based, multi-channel.
 * WhatsApp / push / SMS are architecture stubs for future plugins.
 */
async function renderTemplate(key, variables = {}) {
  const tpl = await NotificationTemplate.findOne({ key, active: true }).lean()
  if (!tpl) {
    return {
      channel: 'in_app',
      subject: key,
      body: JSON.stringify(variables),
    }
  }
  let body = tpl.body
  let subject = tpl.subject || key
  Object.entries(variables).forEach(([k, v]) => {
    const token = new RegExp(`{{\\s*${k}\\s*}}`, 'g')
    body = body.replace(token, String(v ?? ''))
    subject = subject.replace(token, String(v ?? ''))
  })
  return { ...tpl, body, subject }
}

async function notifyUser({ userId, instituteId, templateKey, title, body, link, channel = 'in_app', variables = {}, meta = {} }) {
  let rendered = { subject: title, body: body || '', channel }
  if (templateKey) {
    rendered = await renderTemplate(templateKey, variables)
  }

  const doc = await Notification.create({
    institute: instituteId || null,
    user: userId,
    channel: channel || rendered.channel || 'in_app',
    templateKey: templateKey || null,
    title: title || rendered.subject || 'Notification',
    body: body || rendered.body || '',
    link: link || null,
    meta,
  })

  if ((channel || rendered.channel) === 'email' && variables.email) {
    await emailService.sendMail({
      to: variables.email,
      subject: doc.title,
      text: doc.body,
    })
  }

  // Future: whatsapp / push / sms via plugin adapters

  return doc
}

async function listForUser(userId, { unreadOnly = false, limit = 40 } = {}) {
  const filter = { user: userId }
  if (unreadOnly) filter.readAt = null
  return Notification.find(filter).sort({ createdAt: -1 }).limit(limit).lean()
}

async function markRead(userId, notificationId) {
  return Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { readAt: new Date() },
    { new: true }
  )
}

module.exports = {
  notifyUser,
  listForUser,
  markRead,
  renderTemplate,
}
