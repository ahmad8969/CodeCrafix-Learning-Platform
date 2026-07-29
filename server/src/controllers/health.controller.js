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
      timestamp: new Date().toISOString(),
    },
    'Server Running'
  )
})

module.exports = { getHealth }
