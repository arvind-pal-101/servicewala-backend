const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Worker = require('../models/Worker');
const Review = require('../models/Review');

// Public stats - no auth required
router.get('/stats', async (req, res) => {
  try {
    const totalWorkers = await Worker.countDocuments({ isVerified: true });
    const totalUsers = await User.countDocuments({ role: 'user' });
    
    // Average rating from reviews
    const ratingResult = await Review.aggregate([
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);
    const averageRating = ratingResult.length > 0 
      ? parseFloat(ratingResult[0].avgRating.toFixed(1)) 
      : 0;

    res.json({
      success: true,
      data: { totalWorkers, totalUsers, averageRating }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;