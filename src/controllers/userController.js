const User = require('../models/User');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');
const { createToken } = require('../services/tokenService');

const signup = async (req, res, next) => {
  const { username, email, password } = req.body;

  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  }).lean();

  if (existingUser) {
    return next(
      new AppError(
        409,
        'USER_EXISTS',
        'A user with that username or email already exists'
      )
    );
  }

  try {
    const user = await User.create({ username, email, password });

    logger.info('User account created', { userId: String(user._id) });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user: user.toJSON() },
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return next(
        new AppError(
          409,
          'USER_EXISTS',
          'A user with that username or email already exists'
        )
      );
    }

    return next(error);
  }
};

const login = async (req, res, next) => {
  const identifier = req.body.email
    ? { email: req.body.email }
    : { username: req.body.username };
  const user = await User.findOne(identifier).select('+password');

  if (!user || !(await user.comparePassword(req.body.password))) {
    logger.warn('Login attempt rejected', { ip: req.ip });
    return next(
      new AppError(
        401,
        'INVALID_CREDENTIALS',
        'Username/email or password is incorrect'
      )
    );
  }

  const token = createToken(user);

  logger.info('User logged in', { userId: String(user._id) });

  return res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      user: user.toJSON(),
    },
  });
};

module.exports = { login, signup };
