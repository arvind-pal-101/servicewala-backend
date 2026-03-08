const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Worker = require('../models/Worker');

// Protect routes - User ko verify karo
const protect = async (req, res, next) => {
  let token;

  // Check if token exists in header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check user role and get user data
      if (decoded.role === 'worker') {
        req.user = await Worker.findById(decoded.id).select('-password');
        req.userType = 'worker';
      } else {
        req.user = await User.findById(decoded.id).select('-password');
        req.userType = 'user';
      }

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
};

// Admin only middleware
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Not authorized as admin'
    });
  }
};

// Worker only middleware
const workerOnly = (req, res, next) => {
  if (req.userType === 'worker') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access restricted to workers only'
    });
  }
};

module.exports = { protect, admin, workerOnly };