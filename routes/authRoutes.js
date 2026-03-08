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

// USER ROUTES
router.post('/user/register', registerUser);
router.post('/user/login', loginUser);
router.get('/user/me', protect, getUserProfile);
router.put('/user/profile', protect, updateUserProfile);

// WORKER ROUTES
router.post('/worker/register', registerWorker);
router.post('/worker/login', loginWorker);
router.get('/worker/me', protect, getWorkerProfile);
router.put('/worker/profile', protect, updateWorkerProfile);
router.put('/worker/availability', protect, updateAvailability);

module.exports = router;