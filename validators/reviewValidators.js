const { body, param } = require('express-validator');

// Create review validation
exports.createReviewValidation = [
  body('booking')
    .notEmpty().withMessage('Booking ID is required')
    .isMongoId().withMessage('Invalid booking ID'),
  
  body('worker')
    .notEmpty().withMessage('Worker ID is required')
    .isMongoId().withMessage('Invalid worker ID'),
  
  body('rating')
    .notEmpty().withMessage('Rating is required')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  
  body('comment')
    .trim()
    .notEmpty().withMessage('Comment is required')
    .isLength({ min: 10, max: 500 }).withMessage('Comment must be 10-500 characters'),
];

// Update review validation – all fields optional but must be valid if provided
exports.updateReviewValidation = [
  param('id').isMongoId().withMessage('Invalid review ID'), // ensure URL param is valid
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 }).withMessage('Comment must be 10-500 characters'),
];

// Report review validation – optional reason
exports.reportReviewValidation = [
  param('id').isMongoId().withMessage('Invalid review ID'),
  body('reason')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 }).withMessage('Reason must be 5-200 characters'),
];