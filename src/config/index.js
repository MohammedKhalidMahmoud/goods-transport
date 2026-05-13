const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function parseCorsOrigins(value) {
  const fallbackOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://goods-transfer.nodeteam.site',
  ];

  const rawOrigins = (value || fallbackOrigins.join(','))
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (rawOrigins.includes('*')) {
    return '*';
  }

  return [...new Set(rawOrigins.map((origin) => {
    try {
      return new URL(origin).origin;
    } catch {
      return origin;
    }
  }))];
}

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  appName: process.env.APP_NAME || 'GoodsTransfer',
  appUrl: process.env.APP_URL || 'http://localhost:3000',

  db: {
    url: process.env.DATABASE_URL,
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  cors: {
    origins: parseCorsOrigins(process.env.CORS_ORIGIN),
  },

  logging: {
    level: process.env.LOG_LEVEL || 'debug',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },
};

const requiredEnvVars = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

function validateConfig() {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

module.exports = { config, validateConfig };
