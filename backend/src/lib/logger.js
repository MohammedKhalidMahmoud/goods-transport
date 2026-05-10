const winston = require('winston');
const { config } = require('../config');

const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: config.appName },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
          let log = `${timestamp} [${level}]: ${message}`;
          if (stack) log += `\n${stack}`;
          const metaKeys = Object.keys(meta).filter((k) => k !== 'service');
          if (metaKeys.length > 0) {
            log += ` ${JSON.stringify(
              metaKeys.reduce((acc, k) => ({ ...acc, [k]: meta[k] }), {}),
              null,
              0
            )}`;
          }
          return log;
        })
      ),
    }),
  ],
});

if (config.env === 'production') {
  logger.add(
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  );
}

module.exports = { logger };
