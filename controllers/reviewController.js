const Review = require('../models/Review');
const Booking = require('../models/Booking');

const createReview = async (req, res) => {
  try {
    const { booking, worker, rating, reviewText, comment } = req.body;

    // Duplicate review check
    const existingReview = await Review.findOne({ booking });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this booking'
      });
    }

    // Booking exist check
    const bookingData = await Booking.findById(booking);
    if (!bookingData) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Completed check
    if (bookingData.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Reviews can only be submitted for completed bookings'
      });
    }

    // Customer verification
    if (bookingData.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to review this booking'
      });
    }

    const review = await Review.create({
      booking,
      customer: req.user._id,
      worker,
      rating,
      reviewText: reviewText || comment
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this booking'
      });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: messages[0]
      });
    }
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again later.'
    });
  }
};

const getWorkerReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ worker: req.params.workerId })
      .populate('customer', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again later.'
    });
  }
};

const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ customer: req.user._id })
      .populate('worker', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again later.'
    });
  }
};

const updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Sirf apna review update kar sake
    if (review.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this review'
      });
    }

    review.rating = req.body.rating ?? review.rating;
    review.reviewText = req.body.reviewText || req.body.comment || review.reviewText;
    await review.save();

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: review
    });

  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: messages[0]
      });
    }
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again later.'
    });
  }
};

const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Sirf apna review delete kar sake
    if (review.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this review'
      });
    }

    await review.deleteOne();
    res.json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again later.'
    });
  }
};

const reportReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Already reported check
    if (review.isReported) {
      return res.status(400).json({
        success: false,
        message: 'This review has already been reported'
      });
    }

    review.isReported = true;
    review.reportReason = req.body.reason || 'No reason provided';
    await review.save();

    res.json({
      success: true,
      message: 'Review reported successfully. Our team will review it shortly.'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again later.'
    });
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