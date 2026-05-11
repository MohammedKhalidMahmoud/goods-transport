const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const { config } = require('./config');
const { swaggerSpec } = require('./config/swagger');
const { globalLimiter } = require('./middlewares/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const apiRoutes = require('./routes');

const app = express();

// Security
app.use(helmet());
app.use(cors({ origin: config.cors.origin, credentials: true }));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (config.env !== 'test') {
  app.use(morgan('dev'));
}

// Rate limiting
app.use('/api/', globalLimiter);

// Swagger docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customSiteTitle: 'Goods Transfer API Docs',
}));
app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API routes
app.use('/api/v1', apiRoutes);

// Root
app.get('/', (_req, res) => {
  res.json({
    name: config.appName,
    version: '1.0.0',
    docs: '/api-docs',
    openapi: '/api-docs.json',
    api: '/api/v1',
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

module.exports = app;
