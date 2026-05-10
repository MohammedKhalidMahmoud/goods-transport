const http = require('http');
const app = require('./app');
const { config, validateConfig } = require('./config');
const { logger } = require('./lib/logger');
const { prisma } = require('./lib/prisma');
const { initializeSocket } = require('./socket');

validateConfig();

const server = http.createServer(app);

const io = initializeSocket(server);
app.set('io', io);

async function start() {
  try {
    await prisma.$connect();
    logger.info('Database connected');

    server.listen(config.port, () => {
      logger.info(`${config.appName} server running on port ${config.port}`);
      logger.info(`API docs: ${config.appUrl}/api-docs`);
      logger.info(`Environment: ${config.env}`);
    });
  } catch (err) {
    logger.error('Failed to start server', { error: err.message });
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down gracefully...');
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection', { error: err.message, stack: err.stack });
});

start();
