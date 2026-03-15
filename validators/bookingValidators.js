const { body } = require('express-validator');

exports.createBookingValidation = [
  // Match frontend/body field names: workerId, categoryId
  body('workerId')
    .notEmpty().withMessage('Worker ID is required')
    .isMongoId().withMessage('Invalid worker ID'),
  
  body('categoryId')
    .notEmpty().withMessage('Category is required')
    .isMongoId().withMessage('Invalid category ID'),
  
  body('scheduledDate')
    .notEmpty().withMessage('Date is required')
    .isISO8601().withMessage('Invalid date format'),
  
  body('scheduledTime')
    .notEmpty().withMessage('Time is required')
    .isIn(['morning', 'afternoon', 'evening'])
    .withMessage('Invalid time slot'),
  
  body('serviceDetails.problemDescription')
    .trim()
    .notEmpty().withMessage('Problem description is required')
    .isLength({ min: 10, max: 1000 }).withMessage('Description must be 10-1000 characters'),
  
  body('serviceDetails.serviceAddress.address')
    .trim()
    .notEmpty().withMessage('Service address is required')
    .isLength({ max: 200 }).withMessage('Address too long'),
  
  body('serviceDetails.serviceAddress.city')
    .trim()
    .notEmpty().withMessage('City is required')
    .isLength({ max: 50 }).withMessage('City name too long'),
  
  body('serviceDetails.serviceAddress.pincode')
    .trim()
    .matches(/^\d{6}$/).withMessage('Invalid pincode'),
];

exports.completeBookingValidation = [
  body('finalAmount')
    .optional()
    .isNumeric().withMessage('Final amount must be a number')
    .isFloat({ min: 0, max: 100000 }).withMessage('Amount must be between 0 and 100,000')
];

exports.updateBookingStatusValidation = [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['pending', 'accepted', 'rejected', 'in-progress', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
];