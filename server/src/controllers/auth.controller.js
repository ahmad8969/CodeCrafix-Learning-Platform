const authService = require('../services/auth.service')
const auditService = require('../services/audit.service')
const { asyncHandler, sendSuccess } = require('../utils/helpers')
const { setRefreshCookie, clearRefreshCookie, getRefreshCookie } = require('../utils/cookies')

const login = asyncHandler(async (req, res) => {
  const { email, password, rememberMe } = req.body
  const result = await authService.login({ email, password, rememberMe: Boolean(rememberMe) })
  setRefreshCookie(res, result.refreshToken, Boolean(rememberMe))
  req.user = result.user
  await auditService.record(req, {
    action: 'login',
    resourceType: 'User',
    resourceId: result.user?._id || result.user?.id,
  })
  sendSuccess(
    res,
    {
      accessToken: result.accessToken,
      user: result.user,
    },
    'Logged in successfully'
  )
})

const logout = asyncHandler(async (req, res) => {
  await auditService.record(req, {
    action: 'logout',
    resourceType: 'User',
    resourceId: req.user?._id,
  })
  await authService.logout(req.user?._id)
  clearRefreshCookie(res)
  sendSuccess(res, null, 'Logged out successfully')
})

const refreshToken = asyncHandler(async (req, res) => {
  const token = getRefreshCookie(req) || req.body.refreshToken
  const result = await authService.refresh(token)
  setRefreshCookie(res, result.refreshToken, false)
  sendSuccess(
    res,
    {
      accessToken: result.accessToken,
      user: result.user,
    },
    'Token refreshed'
  )
})

const me = asyncHandler(async (req, res) => {
  const user = await authService.me(req.user._id)
  sendSuccess(res, user, 'OK')
})

const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email)
  sendSuccess(res, result, result.message)
})

const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword({
    token: req.body.token,
    password: req.body.password,
  })
  clearRefreshCookie(res)
  sendSuccess(res, null, result.message)
})

const changePassword = asyncHandler(async (req, res) => {
  const result = await authService.changePassword(req.user._id, {
    currentPassword: req.body.currentPassword,
    newPassword: req.body.newPassword,
  })
  clearRefreshCookie(res)
  sendSuccess(res, null, result.message)
})

module.exports = {
  login,
  logout,
  refreshToken,
  me,
  forgotPassword,
  resetPassword,
  changePassword,
}
