class AppError extends Error {
  constructor(message, statusCode, errorCode, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, errors = null) {
    return new AppError(message, 400, 'VALIDATION_ERROR', errors);
  }

  static unauthorized(message = 'Authentication required') {
    return new AppError(message, 401, 'AUTHENTICATION_ERROR');
  }

  static forbidden(message = 'Insufficient permissions') {
    return new AppError(message, 403, 'AUTHORIZATION_ERROR');
  }

  static notFound(message = 'Resource not found') {
    return new AppError(message, 404, 'NOT_FOUND');
  }

  static conflict(message = 'Resource already exists') {
    return new AppError(message, 409, 'CONFLICT');
  }

  static unprocessable(message, errors = null) {
    return new AppError(message, 422, 'UNPROCESSABLE', errors);
  }

  static tooMany(message = 'Too many requests') {
    return new AppError(message, 429, 'RATE_LIMITED');
  }

  static internal(message = 'Internal server error') {
    return new AppError(message, 500, 'INTERNAL_ERROR');
  }
}

module.exports = { AppError };
