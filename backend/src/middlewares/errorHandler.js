const { AppError } = require('../utils/AppError');
const { error } = require('../utils/response');
const { logger } = require('../lib/logger');

function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    return error(res, err.message, err.statusCode, err.errorCode, err.errors);
  }

  if (err.name === 'JsonWebTokenError') {
    return error(res, 'Invalid token', 401, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    return error(res, 'Token expired', 401, 'TOKEN_EXPIRED');
  }

  if (err.code === 'P2002') {
    const target = err.meta?.target;
    return error(res, `Duplicate value for ${target}`, 409, 'CONFLICT');
  }

  if (err.code === 'P2025') {
    return error(res, 'Record not found', 404, 'NOT_FOUND');
  }

  if (err.type === 'entity.parse.failed') {
    return error(res, 'Invalid JSON in request body', 400, 'VALIDATION_ERROR');
  }

  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  return error(
    res,
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    500,
    'INTERNAL_ERROR'
  );
}

function notFoundHandler(req, res) {
  return error(res, `Route ${req.method} ${req.originalUrl} not found`, 404, 'NOT_FOUND');
}

module.exports = { errorHandler, notFoundHandler };
