const { body, param } = require('express-validator');

// Validate worker verification
exports.verifyWorkerValidation = [
  param('id')
    .isMongoId().withMessage('Invalid worker ID'),
  
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
  
  body('rejectionReason')
    .if(body('status').equals('rejected'))
    .notEmpty().withMessage('Rejection reason is required for rejected status')
    .isLength({ min: 10, max: 500 }).withMessage('Reason must be 10-500 characters')
];

// Validate worker rejection (reason only)
exports.rejectWorkerValidation = [
  param('id')
    .isMongoId().withMessage('Invalid worker ID'),
  
  body('reason')
    .notEmpty().withMessage('Rejection reason is required')
    .isLength({ min: 5, max: 500 }).withMessage('Reason must be 5-500 characters')
];

// Validate user status toggle
exports.toggleUserStatusValidation = [
  param('id')
    .isMongoId().withMessage('Invalid user ID')
];

// Validate category creation
exports.createCategoryValidation = [
  body('name')
    .notEmpty().withMessage('Category name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters')
    .trim(),
  
  body('description')
    .optional()
    .isLength({ max: 200 }).withMessage('Description must be less than 200 characters')
    .trim(),
  
  body('icon')
    .optional()
    .isString().withMessage('Icon must be a string')
];