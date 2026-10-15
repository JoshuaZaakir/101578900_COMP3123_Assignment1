require('dotenv').config({ quiet: true });

const app = require('./app');
const {
  connectDatabase,
  disconnectDatabase,
} = require('./src/config/database');
const { getJwtSecret } = require('./src/services/tokenService');
const logger = require('./src/config/logger');

const startServer = async () => {
  getJwtSecret();
  await connectDatabase();

  const port = Number.parseInt(process.env.PORT, 10) || 3000;
  const server = app.listen(port, () => {
    logger.info('API server started', { port });
  });

  const shutdown = async (signal) => {
    logger.info('Server shutdown requested', { signal });
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));

  return server;
};

if (require.main === module) {
  startServer().catch((error) => {
    logger.error('API server failed to start', { error: error.name });
    process.exitCode = 1;
  });
}

module.exports = { startServer };
