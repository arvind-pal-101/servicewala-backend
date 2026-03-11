const { body } = require('express-validator');

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