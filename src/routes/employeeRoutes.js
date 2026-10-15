const express = require('express');
const {
  createEmployee,
  deleteEmployee,
  getEmployee,
  getEmployees,
  updateEmployee,
} = require('../controllers/employeeController');
const { authenticate } = require('../middleware/auth');
const {
  requireAtLeastOneField,
  validateAllowedFields,
  validateAllowedQuery,
  validateRequest,
} = require('../middleware/validation');
const {
  createEmployeeValidators,
  employeeIdParamValidator,
  employeeIdQueryValidator,
  updateEmployeeValidators,
} = require('../validators/employeeValidators');
const asyncHandler = require('../utils/asyncHandler');

const employeeFields = [
  'first_name',
  'last_name',
  'email',
  'position',
  'salary',
  'date_of_joining',
  'department',
];

const createEmployeeRouter = () => {
  const router = express.Router();

  router.use(asyncHandler(authenticate));

  router.get(
    '/employees',
    validateAllowedQuery([]),
    asyncHandler(getEmployees)
  );

  router.post(
    '/employees',
    validateAllowedQuery([]),
    validateAllowedFields(employeeFields),
    createEmployeeValidators,
    validateRequest,
    asyncHandler(createEmployee)
  );

  router.get(
    '/employees/:eid',
    validateAllowedQuery([]),
    employeeIdParamValidator,
    validateRequest,
    asyncHandler(getEmployee)
  );

  router.put(
    '/employees/:eid',
    validateAllowedQuery([]),
    validateAllowedFields(employeeFields),
    requireAtLeastOneField(employeeFields),
    employeeIdParamValidator,
    updateEmployeeValidators,
    validateRequest,
    asyncHandler(updateEmployee)
  );

  router.delete(
    '/employees',
    validateAllowedQuery(['eid']),
    validateAllowedFields([]),
    employeeIdQueryValidator,
    validateRequest,
    asyncHandler(deleteEmployee)
  );

  return router;
};

module.exports = createEmployeeRouter;
