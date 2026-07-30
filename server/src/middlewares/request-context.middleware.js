const crypto = require('crypto')
const logger = require('../utils/logger')

function requestContext(req, res, next) {
  const startedAt = process.hrtime.bigint()
  req.id = String(req.get('x-request-id') || crypto.randomUUID()).slice(0, 128)
  res.setHeader('X-Request-Id', req.id)

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6
    logger.info('http_request', {
      requestId: req.id,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      ip: req.ip,
      userId: req.user?._id,
      instituteId: req.instituteId,
    })
  })

  next()
}

module.exports = { requestContext }
