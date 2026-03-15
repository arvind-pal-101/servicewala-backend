const { body } = require('express-validator');

// Validate payment initiation
exports.initiatePaymentValidation = [
  body('bookingId')
    .notEmpty().withMessage('Booking ID is required')
    .isMongoId().withMessage('Invalid booking ID'),
  
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isNumeric().withMessage('Amount must be a number')
    .isFloat({ min: 1, max: 100000 }).withMessage('Amount must be between ₹1 and ₹100,000')
];

// Validate payment verification
exports.verifyPaymentValidation = [
  body('razorpay_order_id')
    .notEmpty().withMessage('Order ID is required'),
  
  body('razorpay_payment_id')
    .notEmpty().withMessage('Payment ID is required'),
  
  body('razorpay_signature')
    .notEmpty().withMessage('Payment signature is required'),
  
  body('bookingId')
    .notEmpty().withMessage('Booking ID is required')
    .isMongoId().withMessage('Invalid booking ID')
];

// Validate refund request
exports.refundValidation = [
  body('bookingId')
    .notEmpty().withMessage('Booking ID is required')
    .isMongoId().withMessage('Invalid booking ID'),
  
  body('reason')
    .optional()
    .isLength({ min: 10, max: 500 }).withMessage('Reason must be 10-500 characters')
];