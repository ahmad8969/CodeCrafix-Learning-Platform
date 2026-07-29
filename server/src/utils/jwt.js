const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const config = require('../config')

function signAccessToken(payload) {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  })
}

function signRefreshToken(payload, rememberMe = false) {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: rememberMe ? config.jwt.refreshExpiresRemember : config.jwt.refreshExpiresIn,
  })
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.accessSecret)
}

function verifyRefreshToken(token) {
  return jwt.verify(token, config.jwt.refreshSecret)
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function getRefreshMaxAgeMs(rememberMe = false) {
  return rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  getRefreshMaxAgeMs,
}
