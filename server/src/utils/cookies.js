const cookieOptions = (maxAgeMs) => {
  const config = require('../config')
  return {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    maxAge: maxAgeMs,
    path: '/',
  }
}

function setAuthCookies(res, { accessToken, refreshToken, rememberMe = false }) {
  const refreshMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000
  res.cookie('accessToken', accessToken, cookieOptions(15 * 60 * 1000))
  res.cookie('refreshToken', refreshToken, cookieOptions(refreshMs))
}

function clearAuthCookies(res) {
  const config = require('../config')
  const base = {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    path: '/',
  }
  res.clearCookie('accessToken', base)
  res.clearCookie('refreshToken', base)
}

module.exports = { setAuthCookies, clearAuthCookies, cookieOptions }
