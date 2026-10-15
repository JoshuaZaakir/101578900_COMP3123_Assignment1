const fs = require('fs');
const path = require('path');
const winston = require('winston');

const isTest = process.env.NODE_ENV === 'test';
const logDirectory = path.resolve(
  process.env.LOG_DIR || path.join(process.cwd(), 'logs')
);

const transports = [];

if (isTest) {
  transports.push(new winston.transports.Console({ silent: true }));
} else {
  try {
    fs.mkdirSync(logDirectory, { recursive: true });
    transports.push(
      new winston.transports.File({
        filename: path.join(logDirectory, 'error.log'),
        level: 'error',
      }),
      new winston.transports.File({
        filename: path.join(logDirectory, 'combined.log'),
      })
    );
  } catch (_error) {
    // Console logging remains available if a deployment has a read-only file system.
  }

  transports.push(new winston.transports.Console());
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'employee-api' },
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: false }),
    winston.format.json()
  ),
  transports,
});

logger.stream = {
  write(message) {
    logger.info('HTTP request', { request: message.trim() });
  },
};

module.exports = logger;
