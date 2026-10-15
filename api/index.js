require('dotenv').config({ quiet: true });

const app = require('../app');
const { connectDatabase } = require('../src/config/database');
const logger = require('../src/config/logger');

module.exports = async (req, res) => {
  const requestPath = String(req.url || '').split('?')[0];

  if (requestPath === '/health') {
    return app(req, res);
  }

  try {
    await connectDatabase();
    return app(req, res);
  } catch (error) {
    logger.error('Serverless database connection failed', { error: error.name });
    return res.status(503).json({
      success: false,
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'The database is temporarily unavailable',
      },
    });
  }
};
