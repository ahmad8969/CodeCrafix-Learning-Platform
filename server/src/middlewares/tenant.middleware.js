const config = require('../config')
const { ROLES } = require('../constants')
const { ApiError } = require('../utils/helpers')

function requireTenant(req, res, next) {
  if (!config.multiTenant) return next()
  if (!req.user) return next(new ApiError(401, 'Authentication required'))

  if (req.user.role === ROLES.SUPER_ADMIN) {
    req.instituteId = req.get('x-institute-id') || req.instituteId || null
    return next()
  }

  if (!req.instituteId) return next(new ApiError(403, 'Tenant context required'))
  next()
}

function tenantFilter(req, extra = {}) {
  if (!config.multiTenant || !req.instituteId) return extra
  return { ...extra, institute: req.instituteId }
}

function assertSameTenant(req, resource) {
  if (!config.multiTenant || req.user?.role === ROLES.SUPER_ADMIN) return
  const resourceTenant = resource?.institute?._id || resource?.institute
  if (resourceTenant && String(resourceTenant) !== String(req.instituteId)) {
    throw new ApiError(403, 'Cross-tenant access denied')
  }
}

module.exports = { requireTenant, tenantFilter, assertSameTenant }
