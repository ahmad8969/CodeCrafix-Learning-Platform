const featureFlagService = require('../services/feature-flag.service')
const cache = require('../utils/cache')
const { ApiError } = require('../utils/helpers')

function requireFlag(flagKey) {
  return async (req, res, next) => {
    try {
      const instituteId = req.instituteId || null
      const cacheKey = `flags:${instituteId || 'default'}`
      const payload = await cache.wrap(cacheKey, 15_000, () =>
        featureFlagService.getFeatureFlags(instituteId)
      )
      if (payload?.flags?.[flagKey] === false) {
        return next(new ApiError(403, `Feature disabled: ${flagKey}`))
      }
      return next()
    } catch (error) {
      return next(error)
    }
  }
}

module.exports = { requireFlag }
