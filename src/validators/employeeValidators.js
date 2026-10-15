const { body, param, query } = require('express-validator');

const textField = (fieldName, label, maximumLength, optional = false) => {
  let validator = body(fieldName);

  if (optional) {
    validator = validator.optional({ values: 'undefined' });
  } else {
    validator = validator
      .exists({ values: 'falsy' })
      .withMessage(`${label} is required`)
      .bail();
  }

  return validator
    .isString()
    .withMessage(`${label} must be a string`)
    .bail()
    .trim()
    .notEmpty()
    .withMessage(`${label} cannot be empty`)
    .bail()
    .isLength({ max: maximumLength })
    .withMessage(`${label} cannot exceed ${maximumLength} characters`);
};

const emailField = (optional = false) => {
  let validator = body('email');

  if (optional) {
    validator = validator.optional({ values: 'undefined' });
  } else {
    validator = validator
      .exists({ values: 'falsy' })
      .withMessage('Email is required')
      .bail();
  }

  return validator
    .isString()
    .withMessage('Email must be a string')
    .bail()
    .trim()
    .isLength({ max: 254 })
    .withMessage('Email cannot exceed 254 characters')
    .bail()
    .isEmail()
    .withMessage('Email must be valid')
    .normalizeEmail();
};

const salaryField = (optional = false) => {
  let validator = body('salary');

  if (optional) {
    validator = validator.optional({ values: 'undefined' });
  } else {
    validator = validator
      .exists({ values: 'null' })
      .withMessage('Salary is required')
      .bail();
  }

  return validator
    .isFloat({ gt: 0, max: Number.MAX_SAFE_INTEGER })
    .withMessage('Salary must be a positive number')
    .toFloat();
};

const joiningDateField = (optional = false) => {
  let validator = body('date_of_joining');

  if (optional) {
    validator = validator.optional({ values: 'undefined' });
  } else {
    validator = validator
      .exists({ values: 'falsy' })
      .withMessage('Date of joining is required')
      .bail();
  }

  return validator
    .isString()
    .withMessage('Date of joining must be an ISO 8601 date string')
    .bail()
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage('Date of joining must be a valid ISO 8601 date')
    .toDate();
};

const createEmployeeValidators = [
  textField('first_name', 'First name', 50),
  textField('last_name', 'Last name', 50),
  emailField(),
  textField('position', 'Position', 100),
  salaryField(),
  joiningDateField(),
  textField('department', 'Department', 100),
];

const updateEmployeeValidators = [
  textField('first_name', 'First name', 50, true),
  textField('last_name', 'Last name', 50, true),
  emailField(true),
  textField('position', 'Position', 100, true),
  salaryField(true),
  joiningDateField(true),
  textField('department', 'Department', 100, true),
];

const employeeIdParamValidator = [
  param('eid')
    .isMongoId()
    .withMessage('Employee ID must be a valid MongoDB ObjectId'),
];

const employeeIdQueryValidator = [
  query('eid')
    .exists({ values: 'falsy' })
    .withMessage('Employee ID is required')
    .bail()
    .isMongoId()
    .withMessage('Employee ID must be a valid MongoDB ObjectId'),
];

module.exports = {
  createEmployeeValidators,
  employeeIdParamValidator,
  employeeIdQueryValidator,
  updateEmployeeValidators,
};
