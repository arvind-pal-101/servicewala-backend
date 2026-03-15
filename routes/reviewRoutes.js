const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createReviewValidation,
  updateReviewValidation,    // ← ADDED
  reportReviewValidation     // ← ADDED
} = require('../validators/reviewValidators');
const {
  createReview,
  getWorkerReviews,
  getMyReviews,
  updateReview,
  deleteReview,
  reportReview
} = require('../controllers/reviewController');

router.post('/', protect, createReviewValidation, validate, createReview);
router.get('/worker/:workerId', getWorkerReviews);
router.get('/my-reviews', protect, getMyReviews);
router.put('/:id', protect, updateReviewValidation, validate, updateReview);          // ← ADDED validation
router.delete('/:id', protect, deleteReview);                                         // Delete usually no body
router.put('/:id/report', protect, reportReviewValidation, validate, reportReview);   // ← ADDED validation

module.exports = router;