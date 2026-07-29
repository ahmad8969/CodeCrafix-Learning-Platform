class ApiError extends Error {
  constructor(statusCode, message) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
  }
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
}

function sendSuccess(res, data = null, message = 'OK', status = 200) {
  return res.status(status).json({ success: true, message, data })
}

module.exports = { ApiError, asyncHandler, sendSuccess }
