const jwt = require('jsonwebtoken')
const config = require('../config')

function signAccessToken(payload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.accessTokenTtl })
}

function signRefreshToken(payload, rememberMe = false) {
  return jwt.sign(payload, config.jwtRefreshSecret, {
    expiresIn: rememberMe ? config.refreshTokenTtlRemember : config.refreshTokenTtl,
  })
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.jwtSecret)
}

function verifyRefreshToken(token) {
  return jwt.verify(token, config.jwtRefreshSecret)
}

function getTokenPayload(user) {
  return {
    id: user._id.toString(),
    role: user.role,
    email: user.email,
  }
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  getTokenPayload,
}
