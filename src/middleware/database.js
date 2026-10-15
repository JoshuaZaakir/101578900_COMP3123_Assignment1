const { connectDatabase } = require('../config/database');
const logger = require('../config/logger');
const AppError = require('../utils/AppError');

const ensureDatabaseConnection = async (_req, _res, next) => {
  try {
    await connectDatabase();
    next();
  } catch (error) {
    logger.error('Request could not reach the database', { error: error.name });
    next(
      new AppError(
        503,
        'DATABASE_UNAVAILABLE',
        'The database is temporarily unavailable'
      )
    );
  }
};

module.exports = ensureDatabaseConnection;
