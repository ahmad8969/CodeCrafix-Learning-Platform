const swaggerJsdoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')
const config = require('./index')

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CodeCrafters Learning Platform API',
      version: '1.0.0',
      description: 'Auth + foundation APIs (Prompt 002).',
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
  apis: ['./src/routes/**/*.js', './src/docs/*.js'],
}

const specs = swaggerJsdoc(options)

function setupSwagger(app) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }))
}

module.exports = { setupSwagger, specs }
