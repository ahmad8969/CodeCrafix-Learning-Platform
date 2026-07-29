const crypto = require('crypto')
const User = require('../models/User')
const { ApiError } = require('../utils/helpers')
const { USER_STATUS } = require('../constants')
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getTokenPayload,
} = require('../utils/jwt')
const { sendPasswordResetEmail } = require('./email.service')

function sanitizeUser(user) {
  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    profileImage: user.profileImage,
    role: user.role,
    status: user.status,
    emailVerified: user.emailVerified,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

async function issueTokens(user, rememberMe = false) {
  const payload = getTokenPayload(user)
  const accessToken = signAccessToken(payload)
  const refreshToken = signRefreshToken(payload, rememberMe)
  user.refreshToken = refreshToken
  await user.save({ validateBeforeSave: false })
  return { accessToken, refreshToken }
}

async function login({ email, password, rememberMe = false }) {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password +refreshToken')
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password')
  }

  if (user.status === USER_STATUS.SUSPENDED) {
    throw new ApiError(403, 'Your account has been suspended')
  }
  if (user.status === USER_STATUS.INACTIVE) {
    throw new ApiError(403, 'Your account is inactive')
  }

  user.lastLogin = new Date()
  const tokens = await issueTokens(user, rememberMe)

  return {
    user: sanitizeUser(user),
    ...tokens,
    rememberMe: Boolean(rememberMe),
  }
}

async function logout(userId) {
  if (!userId) return
  await User.findByIdAndUpdate(userId, { refreshToken: null })
}

async function refresh(refreshToken) {
  if (!refreshToken) throw new ApiError(401, 'Refresh token required')

  let decoded
  try {
    decoded = verifyRefreshToken(refreshToken)
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token')
  }

  const user = await User.findById(decoded.id).select('+refreshToken')
  if (!user || !user.refreshToken || user.refreshToken !== refreshToken) {
    throw new ApiError(401, 'Session expired. Please sign in again.')
  }

  if (user.status !== USER_STATUS.ACTIVE) {
    throw new ApiError(403, 'Account is not active')
  }

  // Refresh token rotation (architecture ready)
  const tokens = await issueTokens(user, false)
  return {
    user: sanitizeUser(user),
    ...tokens,
  }
}

async function me(userId) {
  const user = await User.findById(userId)
  if (!user) throw new ApiError(404, 'User not found')
  return sanitizeUser(user)
}

async function forgotPassword(email) {
  const user = await User.findOne({ email: email.toLowerCase() })
  // Always respond success to avoid email enumeration
  if (!user) {
    return { message: 'If that email exists, a reset link has been sent.', resetToken: null }
  }

  const rawToken = user.createPasswordResetToken()
  await user.save({ validateBeforeSave: false })
  await sendPasswordResetEmail(user, rawToken)

  const payload = {
    message: 'If that email exists, a reset link has been sent.',
  }

  // Dev helper so reset can be tested without SMTP
  if (process.env.NODE_ENV !== 'production') {
    payload.resetToken = rawToken
    payload.email = user.email
  }

  return payload
}

async function resetPassword({ token, email, password }) {
  if (!token || !password) throw new ApiError(400, 'Token and new password are required')

  const hashed = crypto.createHash('sha256').update(token).digest('hex')
  const query = {
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: Date.now() },
  }
  if (email) query.email = email.toLowerCase()

  const user = await User.findOne(query).select('+passwordResetToken +passwordResetExpires')
  if (!user) throw new ApiError(400, 'Invalid or expired reset token')

  user.password = password
  user.passwordResetToken = null
  user.passwordResetExpires = null
  user.refreshToken = null
  await user.save()

  return { message: 'Password reset successfully' }
}

async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select('+password')
  if (!user) throw new ApiError(404, 'User not found')

  const ok = await user.comparePassword(currentPassword)
  if (!ok) throw new ApiError(400, 'Current password is incorrect')

  user.password = newPassword
  user.refreshToken = null
  await user.save()

  return { message: 'Password changed successfully' }
}

module.exports = {
  sanitizeUser,
  login,
  logout,
  refresh,
  me,
  forgotPassword,
  resetPassword,
  changePassword,
}
