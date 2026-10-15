const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');

const validateAllowedFields = (allowedFields) => (req, _res, next) => {
  const body = req.body === undefined ? {} : req.body;

  if (body === null || Array.isArray(body) || typeof body !== 'object') {
    return next(
      new AppError(
        400,
        'INVALID_REQUEST_BODY',
        'Request body must be a JSON object'
      )
    );
  }

  const unexpectedFields = Object.keys(body).filter(
    (field) => !allowedFields.includes(field)
  );

  if (unexpectedFields.length > 0) {
    logger.warn('Unexpected request fields rejected', {
      method: req.method,
      path: req.path,
      fields: unexpectedFields,
    });

    return next(
      new AppError(
        400,
        'UNEXPECTED_FIELDS',
        'Request contains unexpected fields',
        unexpectedFields.map((field) => ({
          field,
          message: `${field} is not allowed`,
        }))
      )
    );
  }

  return next();
};

const validateAllowedQuery = (allowedFields) => (req, _res, next) => {
  const unexpectedFields = Object.keys(req.query).filter(
    (field) => !allowedFields.includes(field)
  );

  if (unexpectedFields.length > 0) {
    return next(
      new AppError(
        400,
        'UNEXPECTED_QUERY_FIELDS',
        'Request contains unexpected query parameters',
        unexpectedFields.map((field) => ({
          field,
          message: `${field} is not allowed`,
        }))
      )
    );
  }

  return next();
};

const requireAtLeastOneField = (allowedFields) => (req, _res, next) => {
  const suppliedFields = Object.keys(req.body || {}).filter((field) =>
    allowedFields.includes(field)
  );

  if (suppliedFields.length === 0) {
    return next(
      new AppError(
        400,
        'VALIDATION_ERROR',
        'At least one employee field must be provided',
        [
          {
            field: 'body',
            message: 'At least one employee field must be provided',
          },
        ]
      )
    );
  }

  return next();
};

const validateRequest = (req, _res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  const details = errors.array({ onlyFirstError: true }).map((error) => ({
    field: error.path || 'request',
    message: error.msg,
  }));

  logger.warn('Request validation failed', {
    method: req.method,
    path: req.path,
    fields: details.map((detail) => detail.field),
  });

  return next(
    new AppError(
      400,
      'VALIDATION_ERROR',
      'Request validation failed',
      details
    )
  );
};

module.exports = {
  requireAtLeastOneField,
  validateAllowedFields,
  validateAllowedQuery,
  validateRequest,
};
