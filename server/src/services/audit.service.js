const AuditLog = require('../models/AuditLog')

function parseUserAgent(ua = '') {
  const browser =
    /Edg\//.test(ua) ? 'Edge'
      : /Chrome\//.test(ua) ? 'Chrome'
        : /Firefox\//.test(ua) ? 'Firefox'
          : /Safari\//.test(ua) ? 'Safari'
            : 'Unknown'
  const device = /Mobile|Android|iPhone/i.test(ua) ? 'mobile' : /Tablet|iPad/i.test(ua) ? 'tablet' : 'desktop'
  return { browser, device }
}

async function record(req, { action, resourceType, resourceId, oldValue, newValue, meta } = {}) {
  try {
    const ua = req?.headers?.['user-agent'] || ''
    const { browser, device } = parseUserAgent(ua)
    await AuditLog.create({
      institute: req?.user?.institute || null,
      user: req?.user?._id || null,
      action,
      resourceType: resourceType || '',
      resourceId: resourceId ? String(resourceId) : null,
      oldValue: oldValue ?? null,
      newValue: newValue ?? null,
      ipAddress: req?.ip || req?.headers?.['x-forwarded-for'] || null,
      userAgent: ua || null,
      browser,
      device,
      meta: meta || {},
    })
  } catch {
    /* never block request on audit failure */
  }
}

async function list({ page = 1, limit = 30, action, userId } = {}) {
  const filter = {}
  if (action) filter.action = action
  if (userId) filter.user = userId
  const skip = (Math.max(1, page) - 1) * limit
  const [items, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('user', 'fullName email role').lean(),
    AuditLog.countDocuments(filter),
  ])
  return { items, total, page: Number(page), limit: Number(limit) }
}

module.exports = { record, list, parseUserAgent }
