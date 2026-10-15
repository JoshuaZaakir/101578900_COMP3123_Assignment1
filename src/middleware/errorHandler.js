const mongoose = require('mongoose');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');

const notFoundHandler = (req, _res, next) => {
  next(
    new AppError(
      404,
      'ROUTE_NOT_FOUND',
      `Route ${req.method} ${req.path} was not found`
    )
  );
};

const normalizeError = (error) => {
  if (
    error instanceof SyntaxError &&
    error.status === 400 &&
    Object.prototype.hasOwnProperty.call(error, 'body')
  ) {
    return new AppError(400, 'MALFORMED_JSON', 'Request body contains invalid JSON');
  }

  if (error.type === 'entity.too.large') {
    return new AppError(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large');
  }

  if (error instanceof mongoose.Error.CastError) {
    return new AppError(400, 'INVALID_ID', 'The supplied identifier is invalid');
  }

  if (error instanceof mongoose.Error.ValidationError) {
    const details = Object.values(error.errors).map((validationError) => ({
      field: validationError.path,
      message: validationError.message,
    }));
    return new AppError(
      400,
      'VALIDATION_ERROR',
      'Request validation failed',
      details
    );
  }

  if (error && error.code === 11000) {
    const field = Object.keys(error.keyPattern || error.keyValue || {})[0];
    return new AppError(
      409,
      'DUPLICATE_RESOURCE',
      'A resource with the supplied unique value already exists',
      field ? [{ field, message: `${field} must be unique` }] : undefined
    );
  }

  return error;
};

const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const normalizedError = normalizeError(error);
  const statusCode = normalizedError.statusCode || normalizedError.status || 500;
  const isOperational = normalizedError.isOperational === true;

  if (statusCode >= 500) {
    logger.error('Application request failed', {
      error: normalizedError.name || 'Error',
      method: req.method,
      path: req.path,
      status: statusCode,
    });
  }

  const response = {
    success: false,
    error: {
      code:
        normalizedError.code && typeof normalizedError.code === 'string'
          ? normalizedError.code
          : 'INTERNAL_SERVER_ERROR',
      message:
        statusCode < 500 || isOperational
          ? normalizedError.message
          : 'An unexpected server error occurred',
    },
  };

  if (Array.isArray(normalizedError.details) && normalizedError.details.length) {
    response.error.details = normalizedError.details;
  }

  return res.status(statusCode).json(response);
};

module.exports = { errorHandler, notFoundHandler };
