const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const config = require('../config')

const commonOptions = {
  algorithm: 'HS256',
  issuer: config.jwt.issuer,
  audience: config.jwt.audience,
}

function signAccessToken(payload) {
  return jwt.sign(payload, config.jwt.accessSecret, {
    ...commonOptions,
    expiresIn: config.jwt.accessExpiresIn,
    jwtid: crypto.randomUUID(),
  })
}

function signRefreshToken(payload, rememberMe = false) {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    ...commonOptions,
    expiresIn: rememberMe ? config.jwt.refreshExpiresRemember : config.jwt.refreshExpiresIn,
    jwtid: crypto.randomUUID(),
  })
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.accessSecret, {
    algorithms: ['HS256'],
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
  })
}

function verifyRefreshToken(token) {
  return jwt.verify(token, config.jwt.refreshSecret, {
    algorithms: ['HS256'],
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
  })
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
