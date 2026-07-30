const User = require('../models/User')
const { ApiError } = require('../utils/helpers')
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
} = require('../utils/jwt')
const { USER_STATUS } = require('../constants')
const config = require('../config')
const { sendPasswordResetEmail } = require('./email.service')

function tokenPayload(user) {
  return { id: user._id.toString(), role: user.role, email: user.email }
}

async function issueTokens(user, rememberMe = false) {
  const payload = { ...tokenPayload(user), rememberMe: Boolean(rememberMe) }
  const accessToken = signAccessToken(payload)
  const refreshToken = signRefreshToken(payload, rememberMe)

  user.refreshTokenHash = hashToken(refreshToken)
  user.lastLogin = new Date()
  await user.save({ validateBeforeSave: false })

  return { accessToken, refreshToken, user: user.toSafeObject() }
}

async function login({ email, password, rememberMe = false }) {
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    '+password +refreshTokenHash'
  )
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password')
  }

  if (user.status === USER_STATUS.SUSPENDED) {
    throw new ApiError(403, 'Your account has been suspended')
  }
  if (user.status === USER_STATUS.INACTIVE) {
    throw new ApiError(403, 'Your account is inactive')
  }

  return issueTokens(user, rememberMe)
}

async function logout(userId) {
  if (!userId) return
  await User.findByIdAndUpdate(userId, { refreshTokenHash: null })
}

async function refresh(refreshToken) {
  if (!refreshToken) throw new ApiError(401, 'Refresh token required')

  let decoded
  try {
    decoded = verifyRefreshToken(refreshToken)
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token')
  }

  const user = await User.findById(decoded.id).select('+refreshTokenHash')
  if (!user || !user.refreshTokenHash) {
    throw new ApiError(401, 'Session expired. Please sign in again.')
  }

  const incomingHash = hashToken(refreshToken)
  if (incomingHash !== user.refreshTokenHash) {
    // Possible token reuse — clear session (rotation architecture)
    user.refreshTokenHash = null
    await user.save({ validateBeforeSave: false })
    throw new ApiError(401, 'Refresh token reuse detected. Please sign in again.')
  }

  if (user.status !== USER_STATUS.ACTIVE) {
    throw new ApiError(403, 'Account is not active')
  }

  // Rotate refresh token while preserving remember-me policy from prior session
  return issueTokens(user, Boolean(decoded.rememberMe))
}

async function me(userId) {
  const user = await User.findById(userId)
  if (!user) throw new ApiError(404, 'User not found')
  return user.toSafeObject()
}

async function forgotPassword(email) {
  const user = await User.findOne({ email: email.toLowerCase() })
  // Always return success shape to avoid email enumeration
  if (!user) {
    return { message: 'If that email exists, a reset link has been sent.' }
  }

  const resetToken = user.createPasswordResetToken()
  await user.save({ validateBeforeSave: false })

  const resetUrl = `${config.clientUrl}/reset-password?token=${resetToken}`
  await sendPasswordResetEmail({
    to: user.email,
    fullName: user.fullName,
    resetUrl,
  })

  const result = { message: 'If that email exists, a reset link has been sent.' }
  if (config.env !== 'production') {
    result.resetToken = resetToken
    result.resetUrl = resetUrl
  }
  return result
}

async function resetPassword({ token, password }) {
  const hashed = hashToken(token)
  const user = await User.findOne({
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+passwordResetToken +passwordResetExpires +password')

  if (!user) throw new ApiError(400, 'Invalid or expired reset token')

  user.password = password
  user.passwordResetToken = null
  user.passwordResetExpires = null
  user.refreshTokenHash = null
  await user.save()

  return { message: 'Password reset successful. You can sign in now.' }
}

async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select('+password +refreshTokenHash')
  if (!user) throw new ApiError(404, 'User not found')

  if (!(await user.comparePassword(currentPassword))) {
    throw new ApiError(400, 'Current password is incorrect')
  }

  user.password = newPassword
  user.refreshTokenHash = null
  await user.save()

  return { message: 'Password changed successfully. Please sign in again.' }
}

module.exports = {
  login,
  logout,
  refresh,
  me,
  forgotPassword,
  resetPassword,
  changePassword,
}
