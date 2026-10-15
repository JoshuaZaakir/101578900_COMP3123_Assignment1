const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

const testSecret = 'assignment-one-test-secret-with-sufficient-length';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === 'test') {
    return testSecret;
  }

  throw new AppError(
    500,
    'CONFIGURATION_ERROR',
    'JWT configuration is unavailable'
  );
};

const createToken = (user) =>
  jwt.sign(
    {
      username: user.username,
    },
    getJwtSecret(),
    {
      subject: String(user._id),
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    }
  );

const verifyToken = (token) => jwt.verify(token, getJwtSecret());

module.exports = { createToken, getJwtSecret, verifyToken };
