const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createReview,
  getWorkerReviews,
  getMyReviews,
  updateReview,
  deleteReview,
  reportReview
} = require('../controllers/reviewController');

router.post('/', protect, createReview);
router.get('/worker/:workerId', getWorkerReviews);
router.get('/my-reviews', protect, getMyReviews);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);
router.put('/:id/report', protect, reportReview);

module.exports = router;