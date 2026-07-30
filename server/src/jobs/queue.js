/**
 * Queue-ready architecture for background work.
 * Production can swap the in-memory runner for Redis/BullMQ without changing callers.
 */
const logger = require('../utils/logger')

const handlers = new Map()
const memoryQueue = []
let draining = false

function registerJob(name, handler) {
  handlers.set(name, handler)
}

async function enqueue(name, payload = {}, options = {}) {
  const job = {
    id: `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    payload,
    attempts: 0,
    maxAttempts: options.maxAttempts || 3,
    runAt: Date.now() + (options.delayMs || 0),
  }
  memoryQueue.push(job)
  logger.info('job_enqueued', { jobId: job.id, name })
  setImmediate(drain)
  return job
}

async function drain() {
  if (draining) return
  draining = true
  try {
    while (memoryQueue.length) {
      const nextIndex = memoryQueue.findIndex((job) => job.runAt <= Date.now())
      if (nextIndex < 0) break
      const [job] = memoryQueue.splice(nextIndex, 1)
      const handler = handlers.get(job.name)
      if (!handler) {
        logger.warn('job_handler_missing', { name: job.name, jobId: job.id })
        continue
      }
      try {
        await handler(job.payload, job)
        logger.info('job_completed', { jobId: job.id, name: job.name })
      } catch (error) {
        job.attempts += 1
        logger.error('job_failed', {
          jobId: job.id,
          name: job.name,
          attempts: job.attempts,
          error: error.message,
        })
        if (job.attempts < job.maxAttempts) {
          job.runAt = Date.now() + job.attempts * 2000
          memoryQueue.push(job)
        }
      }
    }
  } finally {
    draining = false
  }
}

module.exports = {
  registerJob,
  enqueue,
  drain,
}
