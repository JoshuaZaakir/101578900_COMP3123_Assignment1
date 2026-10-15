const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: [1, 'First name is required'],
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    last_name: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      minlength: [1, 'Last name is required'],
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      maxlength: [254, 'Email cannot exceed 254 characters'],
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email must be valid'],
    },
    position: {
      type: String,
      required: [true, 'Position is required'],
      trim: true,
      minlength: [1, 'Position is required'],
      maxlength: [100, 'Position cannot exceed 100 characters'],
    },
    salary: {
      type: Number,
      required: [true, 'Salary is required'],
      min: [0.01, 'Salary must be greater than zero'],
    },
    date_of_joining: {
      type: Date,
      required: [true, 'Date of joining is required'],
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
      minlength: [1, 'Department is required'],
      maxlength: [100, 'Department cannot exceed 100 characters'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee owner is required'],
      immutable: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  }
);

employeeSchema.index({ user: 1, email: 1 }, { unique: true });
employeeSchema.index({ user: 1, created_at: -1 });

module.exports =
  mongoose.models.Employee || mongoose.model('Employee', employeeSchema);
