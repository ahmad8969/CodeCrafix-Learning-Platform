const authService = require('../services/auth.service')
const { asyncHandler, sendSuccess } = require('../utils/helpers')
const { setAuthCookies, clearAuthCookies } = require('../utils/cookies')

const login = asyncHandler(async (req, res) => {
  const { email, password, rememberMe } = req.body
  const result = await authService.login({ email, password, rememberMe })
  setAuthCookies(res, {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    rememberMe: result.rememberMe,
  })
  sendSuccess(
    res,
    {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
    'Logged in successfully'
  )
})

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user?._id)
  clearAuthCookies(res)
  sendSuccess(res, null, 'Logged out successfully')
})

const refreshToken = asyncHandler(async (req, res) => {
  const token = req.body?.refreshToken || req.cookies?.refreshToken
  const result = await authService.refresh(token)
  setAuthCookies(res, {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    rememberMe: false,
  })
  sendSuccess(
    res,
    {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
    'Token refreshed'
  )
})

const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email)
  sendSuccess(res, result, result.message)
})

const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(req.body)
  clearAuthCookies(res)
  sendSuccess(res, null, result.message)
})

const changePassword = asyncHandler(async (req, res) => {
  const result = await authService.changePassword(req.user._id, req.body)
  clearAuthCookies(res)
  sendSuccess(res, null, result.message)
})

const me = asyncHandler(async (req, res) => {
  const user = await authService.me(req.user._id)
  sendSuccess(res, user, 'OK')
})

module.exports = {
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  changePassword,
  me,
}
