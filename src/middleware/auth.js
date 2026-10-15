const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');
const { verifyToken } = require('../services/tokenService');

const authenticate = async (req, _res, next) => {
  const authorization = req.get('authorization');

  if (!authorization) {
    logger.warn('Authentication rejected: token missing', {
      method: req.method,
      path: req.path,
      ip: req.ip,
    });
    return next(
      new AppError(
        401,
        'AUTHENTICATION_REQUIRED',
        'A Bearer token is required'
      )
    );
  }

  const match = authorization.match(/^Bearer\s+([^\s]+)$/i);

  if (!match) {
    return next(
      new AppError(
        401,
        'INVALID_AUTHORIZATION_HEADER',
        'Authorization header must use the Bearer scheme'
      )
    );
  }

  try {
    const payload = verifyToken(match[1]);

    if (!payload || typeof payload !== 'object' || !payload.sub) {
      throw new jwt.JsonWebTokenError('Token subject is missing');
    }

    const user = await User.exists({ _id: payload.sub });

    if (!user) {
      return next(
        new AppError(
          401,
          'INVALID_TOKEN',
          'The authentication token is no longer valid'
        )
      );
    }

    req.user = {
      id: String(user._id),
      username: payload.username,
    };

    return next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }

    logger.warn('Authentication rejected: token verification failed', {
      reason: error.name,
      ip: req.ip,
    });

    if (error instanceof jwt.TokenExpiredError) {
      return next(
        new AppError(401, 'TOKEN_EXPIRED', 'The authentication token has expired')
      );
    }

    return next(
      new AppError(401, 'INVALID_TOKEN', 'The authentication token is invalid')
    );
  }
};

module.exports = { authenticate };
