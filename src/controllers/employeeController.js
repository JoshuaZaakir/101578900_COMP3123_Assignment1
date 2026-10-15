const Employee = require('../models/Employee');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');

const employeeFields = [
  'first_name',
  'last_name',
  'email',
  'position',
  'salary',
  'date_of_joining',
  'department',
];

const findOwnedEmployee = async (employeeId, userId) => {
  const employee = await Employee.findById(employeeId);

  if (!employee) {
    throw new AppError(404, 'EMPLOYEE_NOT_FOUND', 'Employee was not found');
  }

  if (String(employee.user) !== userId) {
    logger.warn('Employee ownership check failed', {
      employeeId,
      userId,
    });
    throw new AppError(
      403,
      'FORBIDDEN',
      'You do not have permission to access this employee'
    );
  }

  return employee;
};

const getEmployees = async (req, res) => {
  const employees = await Employee.find({ user: req.user.id }).sort({
    created_at: -1,
  });

  return res.status(200).json({
    success: true,
    count: employees.length,
    data: { employees },
  });
};

const createEmployee = async (req, res, next) => {
  const employeeData = employeeFields.reduce((result, field) => {
    result[field] = req.body[field];
    return result;
  }, {});

  try {
    const employee = await Employee.create({
      ...employeeData,
      user: req.user.id,
    });

    logger.info('Employee created', {
      employeeId: String(employee._id),
      userId: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: { employee },
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return next(
        new AppError(
          409,
          'EMPLOYEE_EXISTS',
          'An employee with that email already exists for this user'
        )
      );
    }

    return next(error);
  }
};

const getEmployee = async (req, res) => {
  const employee = await findOwnedEmployee(req.params.eid, req.user.id);

  return res.status(200).json({
    success: true,
    data: { employee },
  });
};

const updateEmployee = async (req, res, next) => {
  const employee = await findOwnedEmployee(req.params.eid, req.user.id);

  employeeFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      employee[field] = req.body[field];
    }
  });

  try {
    await employee.save();

    logger.info('Employee updated', {
      employeeId: String(employee._id),
      userId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: { employee },
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return next(
        new AppError(
          409,
          'EMPLOYEE_EXISTS',
          'An employee with that email already exists for this user'
        )
      );
    }

    return next(error);
  }
};

const deleteEmployee = async (req, res) => {
  const employee = await findOwnedEmployee(req.query.eid, req.user.id);

  await employee.deleteOne();

  logger.info('Employee deleted', {
    employeeId: String(employee._id),
    userId: req.user.id,
  });

  return res.status(204).send();
};

module.exports = {
  createEmployee,
  deleteEmployee,
  getEmployee,
  getEmployees,
  updateEmployee,
};
