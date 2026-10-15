const { body } = require('express-validator');

const passwordRules = (fieldName) =>
  body(fieldName)
    .exists({ values: 'falsy' })
    .withMessage('Password is required')
    .bail()
    .isString()
    .withMessage('Password must be a string')
    .bail()
    .isLength({ min: 8, max: 72 })
    .withMessage('Password must be between 8 and 72 characters long')
    .bail()
    .custom((value) => Buffer.byteLength(value, 'utf8') <= 72)
    .withMessage('Password cannot exceed 72 UTF-8 bytes')
    .bail()
    .matches(/[a-z]/)
    .withMessage('Password must contain a lowercase letter')
    .bail()
    .matches(/[A-Z]/)
    .withMessage('Password must contain an uppercase letter')
    .bail()
    .matches(/[0-9]/)
    .withMessage('Password must contain a number');

const signupValidators = [
  body('username')
    .exists({ values: 'falsy' })
    .withMessage('Username is required')
    .bail()
    .isString()
    .withMessage('Username must be a string')
    .bail()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters long')
    .bail()
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .toLowerCase(),
  body('email')
    .exists({ values: 'falsy' })
    .withMessage('Email is required')
    .bail()
    .isString()
    .withMessage('Email must be a string')
    .bail()
    .trim()
    .isLength({ max: 254 })
    .withMessage('Email cannot exceed 254 characters')
    .bail()
    .isEmail()
    .withMessage('Email must be valid')
    .normalizeEmail(),
  passwordRules('password'),
];

const loginValidators = [
  body('username')
    .optional({ values: 'undefined' })
    .isString()
    .withMessage('Username must be a string')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Username cannot be empty')
    .bail()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters long')
    .toLowerCase(),
  body('email')
    .optional({ values: 'undefined' })
    .isString()
    .withMessage('Email must be a string')
    .bail()
    .trim()
    .isEmail()
    .withMessage('Email must be valid')
    .normalizeEmail(),
  body().custom((_body, { req }) => {
    const hasUsername =
      typeof req.body?.username === 'string' && req.body.username.length > 0;
    const hasEmail =
      typeof req.body?.email === 'string' && req.body.email.length > 0;

    if (hasUsername === hasEmail) {
      throw new Error('Provide either username or email, but not both');
    }

    return true;
  }),
  passwordRules('password'),
];

module.exports = { loginValidators, signupValidators };
