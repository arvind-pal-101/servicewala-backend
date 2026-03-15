const { body, param } = require('express-validator');

// Validate image upload
exports.uploadImageValidation = [
  body('type')
    .notEmpty().withMessage('Upload type is required')
    .isIn(['profile', 'portfolio', 'aadhaar']).withMessage('Invalid upload type'),
  body('workerId')
    .optional()
    .isMongoId().withMessage('Invalid worker ID')
];

// Validate portfolio image deletion (publicId from URL params)
exports.deletePortfolioValidation = [
  param('publicId')
    .notEmpty().withMessage('Image public ID is required')
    .isString().withMessage('Public ID must be a string')
];