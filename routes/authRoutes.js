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

module.exports = router;