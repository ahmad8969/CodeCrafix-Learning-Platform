const { ApiError } = require('../utils/helpers')
const logger = require('../utils/logger')

function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`))
}

function errorHandler(err, req, res, next) {
  let status = err.statusCode || 500
  let message = err.message || 'Internal server error'
  let details = err.details

  if (err.name === 'ValidationError') {
    status = 400
    message = 'Validation failed'
    details = Object.values(err.errors || {}).map((item) => item.message)
  } else if (err.name === 'CastError') {
    status = 400
    message = 'Invalid resource identifier'
  } else if (err.code === 11000) {
    status = 409
    message = 'A record with this value already exists'
    details = Object.keys(err.keyPattern || {})
  } else if (err.message === 'Origin is not allowed by CORS') {
    status = 403
    message = 'Origin not allowed'
  }

  const production = process.env.NODE_ENV === 'production'
  if (status >= 500) message = production ? 'Internal server error' : message

  logger.error('request_error', {
    requestId: req.id,
    statusCode: status,
    method: req.method,
    path: req.originalUrl,
    userId: req.user?._id,
    error: err.message,
    stack: production ? undefined : err.stack,
    details,
  })

  res.status(status).json({
    success: false,
    message,
    requestId: req.id,
    ...(!production && details ? { details } : {}),
    ...(!production && { stack: err.stack }),
  })
}

module.exports = { notFound, errorHandler }
