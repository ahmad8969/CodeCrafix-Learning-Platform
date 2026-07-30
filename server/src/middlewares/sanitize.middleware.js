const { ApiError } = require('../utils/helpers')

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

function assertSafe(value, path = 'request') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertSafe(item, `${path}[${index}]`))
    return
  }
  if (!value || typeof value !== 'object') return

  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key) || key.startsWith('$') || key.includes('.')) {
      throw new ApiError(400, `Unsafe input key at ${path}`)
    }
    assertSafe(child, `${path}.${key}`)
  }
}

function sanitizeRequest(req, res, next) {
  try {
    assertSafe(req.body, 'body')
    assertSafe(req.query, 'query')
    assertSafe(req.params, 'params')
    next()
  } catch (error) {
    next(error)
  }
}

module.exports = { sanitizeRequest }
