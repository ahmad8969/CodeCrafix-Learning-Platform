const config = require('../config')

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 }
const threshold = LEVELS[config.logLevel] || LEVELS.info

function write(level, message, meta = {}) {
  if ((LEVELS[level] || LEVELS.info) < threshold) return
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  }
  const output = JSON.stringify(entry)
  if (level === 'error') console.error(output)
  else if (level === 'warn') console.warn(output)
  else console.log(output)
}

module.exports = {
  debug: (message, meta) => write('debug', message, meta),
  info: (message, meta) => write('info', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  error: (message, meta) => write('error', message, meta),
}
