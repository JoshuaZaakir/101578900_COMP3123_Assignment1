require('dotenv').config({ quiet: true });

const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const createUserRouter = require('./src/routes/userRoutes');
const createEmployeeRouter = require('./src/routes/employeeRoutes');
const {
  createAuthenticationLimiter,
  createGeneralLimiter,
} = require('./src/middleware/rateLimiters');
const ensureDatabaseConnection = require('./src/middleware/database');
const {
  errorHandler,
  notFoundHandler,
} = require('./src/middleware/errorHandler');
const { databaseStatus } = require('./src/config/database');
const logger = require('./src/config/logger');
const { getJwtSecret } = require('./src/services/tokenService');

morgan.token('safe-path', (req) => req.originalUrl.split('?')[0]);

const environmentFlag = (name) =>
  ['1', 'true', 'yes'].includes(String(process.env[name] || '').toLowerCase());

const createApp = (options = {}) => {
  const app = express();
  const disableRateLimit =
    options.disableRateLimit ?? environmentFlag('DISABLE_RATE_LIMIT');
  const autoConnect =
    options.autoConnect ??
    (environmentFlag('VERCEL') || environmentFlag('AUTO_CONNECT_DB'));
  const trustProxy = options.trustProxy ?? (environmentFlag('VERCEL') ? 1 : false);

  app.disable('x-powered-by');
  if (trustProxy !== false) {
    app.set('trust proxy', trustProxy);
  }

  app.use(helmet());
  app.use(
    morgan(':remote-addr :method :safe-path :status :response-time ms', {
      stream: logger.stream,
      skip: () => process.env.NODE_ENV === 'test',
    })
  );
  app.use(
    express.json({
      limit: '100kb',
      type: ['application/json', 'application/*+json'],
    })
  );

  app.get('/health', (_req, res) => {
    const status = databaseStatus();

    res.status(200).json({
      success: true,
      status: status === 'connected' ? 'ok' : 'degraded',
      database: { status },
      timestamp: new Date().toISOString(),
    });
  });

  if (autoConnect) {
    app.use(ensureDatabaseConnection);
  }

  app.use('/api', (_req, _res, next) => {
    try {
      getJwtSecret();
      next();
    } catch (error) {
      next(error);
    }
  });

  const authenticationLimiter = disableRateLimit
    ? (_req, _res, next) => next()
    : createAuthenticationLimiter();

  if (!disableRateLimit) {
    app.use('/api', createGeneralLimiter());
  }

  app.use(
    '/api/v1/user',
    createUserRouter({ authenticationLimiter })
  );
  app.use('/api/v1/emp', createEmployeeRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

const app = createApp();

module.exports = app;
module.exports.createApp = createApp;
