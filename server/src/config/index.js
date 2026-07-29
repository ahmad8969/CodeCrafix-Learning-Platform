require('dotenv').config()

const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/codecrafters',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  apiPrefix: '/api/v1',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'dev_access_secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
    refreshExpiresRemember: process.env.JWT_REFRESH_REMEMBER || '30d',
  },
  cookies: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  },
}

module.exports = config
