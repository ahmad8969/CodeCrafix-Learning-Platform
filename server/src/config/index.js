require('dotenv').config()

const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/codecrafters',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'dev_refresh_secret',
  accessTokenTtl: process.env.JWT_ACCESS_EXPIRES || '15m',
  refreshTokenTtl: process.env.JWT_REFRESH_EXPIRES || '7d',
  refreshTokenTtlRemember: process.env.JWT_REFRESH_REMEMBER_EXPIRES || '30d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  apiPrefix: '/api/v1',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  },
}

module.exports = config
