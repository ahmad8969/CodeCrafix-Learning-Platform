const swaggerJsdoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')
const config = require('./index')

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CodeCrafters Learning Platform API',
      version: '1.0.0',
      description: 'Prompt 002 — Authentication & RBAC + foundation health.',
    },
    servers: [{ url: `http://localhost:${config.port}` }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/v1/*.js', './src/docs/*.js', './src/controllers/*.js'],
}

const specs = swaggerJsdoc(options)

function setupSwagger(app) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }))
}

module.exports = { setupSwagger, specs }
