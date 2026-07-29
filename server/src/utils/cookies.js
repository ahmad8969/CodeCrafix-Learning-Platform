const config = require('../config')
const { getRefreshMaxAgeMs } = require('./jwt')

const REFRESH_COOKIE = 'codecrafters_refresh'

function setRefreshCookie(res, token, rememberMe = false) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: config.cookies.secure,
    sameSite: config.cookies.sameSite,
    maxAge: getRefreshMaxAgeMs(rememberMe),
    path: '/api/v1/auth',
  })
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: config.cookies.secure,
    sameSite: config.cookies.sameSite,
    path: '/api/v1/auth',
  })
}

function getRefreshCookie(req) {
  return req.cookies?.[REFRESH_COOKIE] || null
}

module.exports = {
  REFRESH_COOKIE,
  setRefreshCookie,
  clearRefreshCookie,
  getRefreshCookie,
}
