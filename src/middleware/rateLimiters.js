const { rateLimit } = require('express-rate-limit');
const logger = require('../config/logger');

const positiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const rateLimitHandler = (req, res) => {
  logger.warn('Rate limit exceeded', {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });

  res.status(429).json({
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
    },
  });
};

const sharedOptions = () => ({
  windowMs: positiveInteger(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: rateLimitHandler,
});

const createGeneralLimiter = () =>
  rateLimit({
    ...sharedOptions(),
    max: positiveInteger(process.env.API_RATE_LIMIT_MAX, 100),
  });

const createAuthenticationLimiter = () =>
  rateLimit({
    ...sharedOptions(),
    max: positiveInteger(process.env.AUTH_RATE_LIMIT_MAX, 20),
  });

module.exports = {
  createAuthenticationLimiter,
  createGeneralLimiter,
};
