const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const crypto = require('crypto'); // ← ADD THIS
const sendEmail = require('../utils/sendEmail'); 

const validate = require('../middleware/validate');
const {
  registerUserValidation,
  loginValidation,
  registerWorkerValidation,
  forgotPasswordValidation,
  resetPasswordValidation
} = require('../validators/authValidators');

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
router.post('/register',registerUserValidation, validate, registerUser);  // ← Changed from /user/register
router.post('/login', loginValidation, validate, loginUser);
router.get('/user/me', protect, getUserProfile);
router.put('/user/profile', protect, updateUserProfile);

// WORKER ROUTES
router.post('/worker/register', registerWorkerValidation, validate, registerWorker);
router.post('/worker/login', loginValidation, validate, loginWorker);
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

// Password Reset Routes

// @route   POST /api/auth/forgot-password
router.post('/forgot-password', forgotPasswordValidation, validate, async (req, res) => {
  try {
    const { phone } = req.body;
    const User = require('../models/User');

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this phone number'
      });
    }

    if (!user.email) {
      return res.status(400).json({
        success: false,
        message: 'No email registered. Please contact support.'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000;
    
    await user.save();

    const resetUrl = `https://servicewala-frontend-1mdy.vercel.app/reset-password/${resetToken}`;

    const message = `
You requested a password reset for ServiceWala.

Please click the link below to reset your password:
${resetUrl}

This link will expire in 30 minutes.

If you didn't request this, please ignore this email.
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'ServiceWala - Password Reset Request',
        message
      });

      res.json({
        success: true,
        message: 'Password reset email sent! Check your inbox.'
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      return res.status(500).json({
        success: false,
        message: 'Email could not be sent'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/auth/reset-password/:token
router.put('/reset-password/:token', resetPasswordValidation, validate, async (req, res) => {
  try {
    const { password } = req.body;
    const User = require('../models/User');

    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful! You can now login.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;