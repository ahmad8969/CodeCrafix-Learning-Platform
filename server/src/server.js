const fs = require('fs')
const path = require('path')
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const compression = require('compression')
const cookieParser = require('cookie-parser')
const mongoose = require('mongoose')

const config = require('./config')
const connectDB = require('./config/db')
const { setupSwagger } = require('./config/swagger')
const { notFound, errorHandler } = require('./middlewares/error.middleware')
const { protect } = require('./middlewares/auth.middleware')
const { apiLimiter } = require('./middlewares/rate-limit.middleware')
const { sanitizeRequest } = require('./middlewares/sanitize.middleware')
const { requestContext } = require('./middlewares/request-context.middleware')
const logger = require('./utils/logger')
const v1Routes = require('./routes/v1')

const uploadsDir = path.join(__dirname, '../uploads')
const logsDir = path.join(__dirname, 'logs')

;[uploadsDir, logsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
})

function buildApp() {
  const app = express()

  if (config.trustProxy) app.set('trust proxy', config.trustProxy)
  app.disable('x-powered-by')
  app.use(
    helmet({
      contentSecurityPolicy: config.isProduction ? undefined : false,
      crossOriginResourcePolicy: { policy: 'same-site' },
      hsts: config.isProduction
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
    })
  )
  app.use(compression())
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || config.corsOrigins.includes(origin)) return callback(null, true)
        return callback(new Error('Origin is not allowed by CORS'))
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Authorization', 'Content-Type', 'X-Request-Id', 'X-Institute-Id'],
      maxAge: 86400,
    })
  )
  app.use(requestContext)
  if (!config.isProduction) app.use(morgan('dev'))
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: false, limit: '1mb' }))
  app.use(cookieParser())
  app.use(sanitizeRequest)
  app.use(config.apiPrefix, apiLimiter)
  app.use(
    '/uploads',
    protect,
    express.static(uploadsDir, {
      dotfiles: 'deny',
      fallthrough: false,
      index: false,
      maxAge: config.isProduction ? '1h' : 0,
      setHeaders(res) {
        res.setHeader('X-Content-Type-Options', 'nosniff')
        res.setHeader('Content-Disposition', 'attachment')
        res.setHeader('Cache-Control', 'private, no-store')
      },
    })
  )

  if (config.enableSwagger) setupSwagger(app)

  app.get('/', (req, res) => {
    res.json({
      name: 'CodeCrafters Learning Platform API',
      version: '1.0.0 Enterprise',
      ...(config.enableSwagger ? { docs: '/api/docs' } : {}),
      health: '/api/v1/health',
      readiness: '/api/v1/ready',
    })
  })

  app.use(config.apiPrefix, v1Routes)

  app.use(notFound)
  app.use(errorHandler)

  return app
}

async function bootstrap() {
  const app = buildApp()

  try {
    await connectDB()
  } catch (err) {
    logger.error('database_connection_failed', { error: err.message })
    if (config.isProduction) process.exit(1)
  }

  const server = app.listen(config.port, () => {
    logger.info('server_started', {
      port: config.port,
      environment: config.env,
      swagger: config.enableSwagger,
    })
  })

  let shuttingDown = false
  const shutdown = async (signal) => {
    if (shuttingDown) return
    shuttingDown = true
    logger.info('shutdown_started', { signal })
    server.close(async () => {
      await mongoose.connection.close(false)
      logger.info('shutdown_complete')
      process.exit(0)
    })
    setTimeout(() => process.exit(1), 10000).unref()
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('unhandledRejection', (error) => {
    logger.error('unhandled_rejection', { error: error?.message, stack: error?.stack })
    shutdown('unhandledRejection')
  })
  process.on('uncaughtException', (error) => {
    logger.error('uncaught_exception', { error: error.message, stack: error.stack })
    shutdown('uncaughtException')
  })
}

if (require.main === module) bootstrap()

module.exports = { buildApp, bootstrap }
