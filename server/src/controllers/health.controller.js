const { asyncHandler, sendSuccess } = require('../utils/helpers')
const mongoose = require('mongoose')

/**
 * @openapi
 * /api/v1/health:
 *   get:
 *     tags: [Health]
 *     summary: Health check
 *     responses:
 *       200:
 *         description: Server is running
 */
const getHealth = asyncHandler(async (req, res) => {
  const dbState = mongoose.connection.readyState
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' }

  return sendSuccess(
    res,
    {
      status: 'ok',
      uptime: process.uptime(),
      database: states[dbState] || 'unknown',
      version: '1.0.0-enterprise',
      timestamp: new Date().toISOString(),
    },
    'Server running'
  )
})

const getReadiness = asyncHandler(async (req, res) => {
  const ready = mongoose.connection.readyState === 1
  return res.status(ready ? 200 : 503).json({
    success: ready,
    message: ready ? 'Service ready' : 'Service not ready',
    data: {
      status: ready ? 'ready' : 'not_ready',
      database: ready ? 'connected' : 'unavailable',
      timestamp: new Date().toISOString(),
    },
  })
})

module.exports = { getHealth, getReadiness }
