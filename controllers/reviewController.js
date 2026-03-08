const Review = require('../models/Review');
const Booking = require('../models/Booking');

const createReview = async (req, res) => {
  try {
    const { booking, worker, rating, reviewText } = req.body;

    const review = await Review.create({
      booking,
      customer: req.user._id,
      worker,
      rating,
      reviewText
    });

    res.status(201).json({
      success: true,
      message: 'Review created',
      data: review
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getWorkerReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ worker: req.params.workerId })
      .populate('customer', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ customer: req.user._id })
      .populate('worker', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    review.rating = req.body.rating || review.rating;
    review.reviewText = req.body.reviewText || review.reviewText;
    await review.save();

    res.json({ success: true, message: 'Review updated', data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    await review.deleteOne();
    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const reportReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    review.isReported = true;
    review.reportReason = req.body.reason;
    await review.save();

    res.json({ success: true, message: 'Review reported' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createReview,
  getWorkerReviews,
  getMyReviews,
  updateReview,
  deleteReview,
  reportReview
};