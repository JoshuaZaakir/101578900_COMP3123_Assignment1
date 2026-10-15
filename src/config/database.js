const mongoose = require('mongoose');
const logger = require('./logger');

mongoose.set('strictQuery', true);

let connectionPromise = null;

const databaseStatus = () => {
  const statuses = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return statuses[mongoose.connection.readyState] || 'unknown';
};

const connectDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (mongoose.connection.readyState === 2) {
    return mongoose.connection.asPromise();
  }

  if (!connectionPromise) {
    const uri =
      process.env.MONGODB_URI ||
      'mongodb://127.0.0.1:27017/comp3123_assignment1';
    const databaseName =
      process.env.MONGODB_DB_NAME || 'comp3123_assignment1';

    connectionPromise = mongoose
      .connect(uri, { dbName: databaseName })
      .then(() => {
        logger.info('Database connection established', {
          database: databaseName,
        });
        return mongoose.connection;
      })
      .catch((error) => {
        logger.error('Database connection failed', { error: error.name });
        throw error;
      })
      .finally(() => {
        connectionPromise = null;
      });
  }

  return connectionPromise;
};

const disconnectDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info('Database connection closed');
  }
};

module.exports = {
  connectDatabase,
  databaseStatus,
  disconnectDatabase,
};
