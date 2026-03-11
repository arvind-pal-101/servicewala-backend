const { body } = require('express-validator');

exports.createBookingValidation = [
  body('worker')
    .notEmpty().withMessage('Worker ID is required')
    .isMongoId().withMessage('Invalid worker ID'),
  
  body('category')
    .notEmpty().withMessage('Category is required')
    .isMongoId().withMessage('Invalid category ID'),
  
  body('scheduledDate')
    .notEmpty().withMessage('Date is required')
    .isISO8601().withMessage('Invalid date format'),
  
  body('scheduledTime')
    .notEmpty().withMessage('Time is required')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Invalid time format (HH:MM)'),
  
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

exports.updateBookingStatusValidation = [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['pending', 'accepted', 'rejected', 'in-progress', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
];