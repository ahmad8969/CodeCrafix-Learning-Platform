const User = require('../models/User')
const { ApiError, asyncHandler } = require('../utils/helpers')
const { verifyAccessToken } = require('../utils/jwt')
const { USER_STATUS, ROLES } = require('../constants')

function extractAccessToken(req) {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) return header.slice(7)
  if (req.cookies?.accessToken) return req.cookies.accessToken
  return null
}

const authenticate = asyncHandler(async (req, res, next) => {
  const token = extractAccessToken(req)
  if (!token) throw new ApiError(401, 'Authentication required')

  let decoded
  try {
    decoded = verifyAccessToken(token)
  } catch {
    throw new ApiError(401, 'Invalid or expired access token')
  }

  const user = await User.findById(decoded.id)
  if (!user) throw new ApiError(401, 'User not found')
  if (user.status !== USER_STATUS.ACTIVE) {
    throw new ApiError(403, 'Account is not active')
  }

  req.user = user
  req.token = token
  next()
})

/** Alias for authenticate */
const protect = authenticate

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, 'Authentication required'))

    const role = req.user.role
    if (role === ROLES.SUPER_ADMIN) return next()

    if (!allowedRoles.includes(role)) {
      return next(new ApiError(403, 'You do not have permission to access this resource'))
    }
    next()
  }
}

/** Role middleware alias */
const roleMiddleware = authorize

module.exports = {
  authenticate,
  protect,
  authorize,
  roleMiddleware,
  extractAccessToken,
}
