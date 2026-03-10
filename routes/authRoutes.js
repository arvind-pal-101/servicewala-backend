const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Import controllers
const {
  registerUser,
  loginUser,
  getMe: getUserProfile,
  updateProfile: updateUserProfile
} = require('../controllers/userAuthController');

const {
  registerWorker,
  loginWorker,
  getMe: getWorkerProfile,
  updateProfile: updateWorkerProfile,
  updateAvailability
} = require('../controllers/workerAuthController');

// UNIFIED PROFILE ROUTE - NEW!
router.get('/profile', protect, async (req, res) => {
  try {
    // Check if user or worker based on userType
    if (req.user.userType === 'worker') {
      return getWorkerProfile(req, res);
    } else {
      return getUserProfile(req, res);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// USER ROUTES
router.post('/register', registerUser);  // ← Changed from /user/register
router.post('/login', loginUser);        // ← Changed from /user/login
router.get('/user/me', protect, getUserProfile);
router.put('/user/profile', protect, updateUserProfile);

// WORKER ROUTES
router.post('/worker/register', registerWorker);
router.post('/worker/login', loginWorker);
router.get('/worker/me', protect, getWorkerProfile);
router.put('/worker/profile', protect, updateWorkerProfile);
router.put('/worker/availability', protect, updateAvailability);

// Favorite workers routes (at the end, before module.exports)
router.post('/favorites/:workerId', protect, async (req, res) => {
  try {
    const User = require('../models/User');
    const { workerId } = req.params;
    
    const user = await User.findById(req.user._id);
    
    if (!user.favoriteWorkers.includes(workerId)) {
      user.favoriteWorkers.push(workerId);
      await user.save();
    }
    
    res.json({
      success: true,
      message: 'Worker added to favorites'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/favorites/:workerId', protect, async (req, res) => {
  try {
    const User = require('../models/User');
    const { workerId } = req.params;
    
    const user = await User.findById(req.user._id);
    user.favoriteWorkers = user.favoriteWorkers.filter(
      id => id.toString() !== workerId
    );
    await user.save();
    
    res.json({
      success: true,
      message: 'Worker removed from favorites'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/favorites', protect, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user._id)
      .populate({
        path: 'favoriteWorkers',
        populate: { path: 'category' }
      });
    
    res.json({
      success: true,
      data: user.favoriteWorkers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;