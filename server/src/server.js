const fs = require('fs')
const path = require('path')
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const compression = require('compression')
const cookieParser = require('cookie-parser')

const config = require('./config')
const connectDB = require('./config/db')
const { setupSwagger } = require('./config/swagger')
const { notFound, errorHandler } = require('./middlewares/error.middleware')
const v1Routes = require('./routes/v1')

const uploadsDir = path.join(__dirname, '../uploads')
const logsDir = path.join(__dirname, 'logs')

;[uploadsDir, logsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
})

async function bootstrap() {
  const app = express()

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
  app.use(compression())
  app.use(
    cors({
      origin: config.clientUrl,
      credentials: true,
    })
  )
  app.use(morgan(config.env === 'production' ? 'combined' : 'dev'))
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: true }))
  app.use(cookieParser())
  app.use('/uploads', express.static(uploadsDir))

  setupSwagger(app)

  app.get('/', (req, res) => {
    res.json({
      name: 'CodeCrafters Learning Platform API',
      version: 'v1',
      docs: '/api/docs',
      health: '/api/v1/health',
    })
  })

  app.use(config.apiPrefix, v1Routes)

  app.use(notFound)
  app.use(errorHandler)

  try {
    await connectDB()
  } catch (err) {
    console.warn('MongoDB unavailable — starting in degraded mode:', err.message)
  }

  app.listen(config.port, () => {
    console.log(`API listening on http://localhost:${config.port}`)
    console.log(`Health: http://localhost:${config.port}/api/v1/health`)
    console.log(`Swagger: http://localhost:${config.port}/api/docs`)
  })
}

bootstrap()
