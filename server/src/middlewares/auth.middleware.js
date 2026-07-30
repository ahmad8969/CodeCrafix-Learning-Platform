const { verifyAccessToken } = require('../utils/jwt')
const { ApiError, asyncHandler } = require('../utils/helpers')
const User = require('../models/User')
const { USER_STATUS, ROLES } = require('../constants')
const config = require('../config')

/**
 * Authentication middleware — requires valid access JWT.
 */
const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    throw new ApiError(401, 'Authentication required')
  }

  let decoded
  try {
    decoded = verifyAccessToken(token)
  } catch {
    throw new ApiError(401, 'Invalid or expired access token')
  }

  const user = await User.findById(decoded.id)
  if (!user) throw new ApiError(401, 'User no longer exists')
  if (user.status !== USER_STATUS.ACTIVE) {
    throw new ApiError(403, 'Account is not active')
  }

  req.user = user
  req.instituteId = user.institute?._id || user.institute || null

  if (config.multiTenant && user.role !== ROLES.SUPER_ADMIN && !req.instituteId) {
    throw new ApiError(403, 'Account is not assigned to a tenant')
  }

  const requestedTenant = req.get('x-institute-id')
  if (
    config.multiTenant &&
    requestedTenant &&
    user.role !== ROLES.SUPER_ADMIN &&
    String(requestedTenant) !== String(req.instituteId)
  ) {
    throw new ApiError(403, 'Cross-tenant access denied')
  }
  next()
})

/**
 * Authorization middleware — exact role match (super_admin bypass optional).
 */
function authorize(...roles) {
  const allowSuperAdmin = !roles.includes(ROLES.SUPER_ADMIN)
    ? true
    : roles.includes(ROLES.SUPER_ADMIN)

  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, 'Authentication required'))

    if (allowSuperAdmin && req.user.role === ROLES.SUPER_ADMIN) {
      return next()
    }

    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to access this resource'))
    }

    next()
  }
}

/** Alias for role-based gating */
const roleMiddleware = authorize

module.exports = {
  protect,
  authorize,
  roleMiddleware,
}
