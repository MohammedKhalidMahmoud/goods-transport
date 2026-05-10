const rateLimit = require('express-rate-limit');
const { config } = require('../config');

const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    message: 'Too many requests, please try again later',
    meta: {
      errorCode: 'RATE_LIMITED',
      timestamp: new Date().toISOString(),
    },
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    message: 'Too many authentication attempts, please try again later',
    meta: {
      errorCode: 'RATE_LIMITED',
      timestamp: new Date().toISOString(),
    },
  },
});

module.exports = { globalLimiter, authLimiter };
