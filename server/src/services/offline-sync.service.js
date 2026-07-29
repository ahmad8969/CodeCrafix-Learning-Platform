const OfflineSyncOp = require('../models/OfflineSyncOp')
const { ApiError } = require('../utils/helpers')

/**
 * Offline sync — client queues ops (notes, bookmarks, workspace saves, progress).
 * Server applies idempotently by clientOpId.
 */
async function applyOps(userId, ops = []) {
  if (!Array.isArray(ops) || ops.length === 0) {
    throw new ApiError(400, 'ops array required')
  }
  const results = []
  for (const op of ops) {
    try {
      const existing = await OfflineSyncOp.findOne({ user: userId, clientOpId: op.clientOpId })
      if (existing) {
        results.push({ clientOpId: op.clientOpId, status: 'duplicate', id: existing._id })
        continue
      }
      const doc = await OfflineSyncOp.create({
        user: userId,
        clientOpId: op.clientOpId,
        opType: op.opType,
        payload: op.payload,
        clientTimestamp: op.clientTimestamp ? new Date(op.clientTimestamp) : new Date(),
        status: 'applied',
      })
      // Domain apply hooks land in future prompts (notes/workspace/progress services).
      results.push({ clientOpId: op.clientOpId, status: 'applied', id: doc._id })
    } catch (err) {
      results.push({ clientOpId: op.clientOpId, status: 'rejected', error: err.message })
    }
  }
  return { results }
}

module.exports = { applyOps }
