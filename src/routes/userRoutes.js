const express = require('express');
const { login, signup } = require('../controllers/userController');
const { loginValidators, signupValidators } = require('../validators/userValidators');
const {
  validateAllowedFields,
  validateAllowedQuery,
  validateRequest,
} = require('../middleware/validation');
const asyncHandler = require('../utils/asyncHandler');

const createUserRouter = ({ authenticationLimiter }) => {
  const router = express.Router();

  router.post(
    '/signup',
    authenticationLimiter,
    validateAllowedQuery([]),
    validateAllowedFields(['username', 'email', 'password']),
    signupValidators,
    validateRequest,
    asyncHandler(signup)
  );

  router.post(
    '/login',
    authenticationLimiter,
    validateAllowedQuery([]),
    validateAllowedFields(['username', 'email', 'password']),
    loginValidators,
    validateRequest,
    asyncHandler(login)
  );

  return router;
};

module.exports = createUserRouter;
