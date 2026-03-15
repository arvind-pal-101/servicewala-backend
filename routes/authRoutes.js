const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const sendEmail = require('../utils/sendEmail'); 

const validate = require('../middleware/validate');
const {
  registerUserValidation,
  loginValidation,
  registerWorkerValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  adminLoginValidation
} = require('../validators/authValidators');

// Import controllers
const {
  registerUser,
  loginUser,
  logoutUser,  // NEW - import logout
  getMe: getUserProfile,
  updateProfile: updateUserProfile
} = require('../controllers/userAuthController');

const { loginAdmin } = require('../controllers/adminAuthController');

const {
  registerWorker,
  loginWorker,
  logoutWorker,  // NEW - import logout
  getMe: getWorkerProfile,
  updateProfile: updateWorkerProfile,
  updateAvailability
} = require('../controllers/workerAuthController');

// UNIFIED PROFILE ROUTE
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

// UNIFIED LOGOUT ROUTE - NEW!
router.post('/logout', protect, async (req, res) => {
  try {
    // Works for both user and worker - just clears cookie
    if (req.user.userType === 'worker') {
      return logoutWorker(req, res);
    } else {
      return logoutUser(req, res);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// USER ROUTES
router.post('/register', registerUserValidation, validate, registerUser);
router.post('/login', loginValidation, validate, loginUser);
router.post('/user/logout', protect, logoutUser);  // NEW - specific user logout
router.post('/admin/login', adminLoginValidation, validate, loginAdmin);
router.get('/user/me', protect, getUserProfile);
router.put('/user/profile', protect, updateUserProfile);

// WORKER ROUTES
router.post('/worker/register', registerWorkerValidation, validate, registerWorker);
router.post('/worker/login', loginValidation, validate, loginWorker);
router.post('/worker/logout', protect, logoutWorker);  // NEW - specific worker logout
router.get('/worker/me', protect, getWorkerProfile);
router.put('/worker/profile', protect, updateWorkerProfile);
router.put('/worker/availability', protect, updateAvailability);

// Favorite workers routes
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

// Password Reset Rate Limiting
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again after 1 hour.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Password Reset Routes

// @route   POST /api/auth/forgot-password
router.post('/forgot-password', passwordResetLimiter, forgotPasswordValidation, validate, async (req, res) => {
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

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

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
      console.error('Forgot password – email send failed:', error.message || error);
      return res.status(500).json({
        success: false,
        message: 'Email could not be sent. Check Render logs for details.'
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
router.put('/reset-password/:token', passwordResetLimiter, resetPasswordValidation, validate, async (req, res) => {
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

// ✅ TEST ROUTE - Error handler check karne ke liye
router.get('/test-error', (req, res, next) => {
  const error = new Error('Yeh ek test error hai!');
  error.statusCode = 400;
  next(error);
});

module.exports = router;