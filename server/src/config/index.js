require('dotenv').config()

const env = process.env.NODE_ENV || 'development'
const isProduction = env === 'production'
const splitCsv = (value, fallback = []) =>
  (value ? value.split(',') : fallback).map((item) => item.trim()).filter(Boolean)

const accessSecret =
  process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || (isProduction ? '' : 'dev_access_secret')
const refreshSecret =
  process.env.JWT_REFRESH_SECRET || (isProduction ? '' : 'dev_refresh_secret')

if (isProduction) {
  const weak = (value) =>
    !value ||
    value.length < 32 ||
    /change_me|dev_access_secret|dev_refresh_secret|dev_local_/i.test(value)
  if (weak(accessSecret) || weak(refreshSecret) || accessSecret === refreshSecret) {
    throw new Error(
      'Production requires distinct JWT_ACCESS_SECRET and JWT_REFRESH_SECRET values of at least 32 characters'
    )
  }
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required in production')
  if (!process.env.CLIENT_URL && !process.env.CORS_ORIGINS) {
    throw new Error('CLIENT_URL or CORS_ORIGINS is required in production')
  }
}

const config = {
  env,
  isProduction,
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/codecrafters',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  corsOrigins: splitCsv(process.env.CORS_ORIGINS, [
    process.env.CLIENT_URL || 'http://localhost:5173',
  ]),
  apiPrefix: '/api/v1',
  trustProxy: Number(process.env.TRUST_PROXY || (isProduction ? 1 : 0)),
  enableSwagger: process.env.ENABLE_SWAGGER
    ? process.env.ENABLE_SWAGGER === 'true'
    : !isProduction,
  logLevel: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  multiTenant: process.env.MULTI_TENANT === 'true',
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 300,
    authMax: Number(process.env.AUTH_RATE_LIMIT_MAX) || 10,
    publicVerifyMax: Number(process.env.VERIFY_RATE_LIMIT_MAX) || 30,
  },
  jwt: {
    accessSecret,
    refreshSecret,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
    refreshExpiresRemember: process.env.JWT_REFRESH_REMEMBER || '30d',
    issuer: process.env.JWT_ISSUER || 'codecrafix-api',
    audience: process.env.JWT_AUDIENCE || 'codecrafix-web',
  },
  cookies: {
    secure: isProduction,
    sameSite: process.env.COOKIE_SAME_SITE || (isProduction ? 'strict' : 'lax'),
  },
}

module.exports = config
