const { rateLimit } = require('express-rate-limit')
const config = require('../config')

const response = {
  success: false,
  message: 'Too many requests. Please try again later.',
}

const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  limit: config.rateLimit.max,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: response,
  skip: (req) => req.path === '/health' || req.path === '/ready',
})

const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  limit: config.rateLimit.authMax,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: response,
})

const publicVerifyLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  limit: config.rateLimit.publicVerifyMax,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: response,
})

module.exports = { apiLimiter, authLimiter, publicVerifyLimiter }
