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
        if (req.user) {
          req.user.userType = 'worker';
        }
      } else {
        req.user = await User.findById(decoded.id).select('-password');
        if (req.user) {
          req.user.userType = decoded.role || 'user';
        }
      }

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      next();
    } catch (error) {
      console.error('Auth error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
};

// Optional Auth - Guest booking ke liye (token optional hai)
const optionalAuth = async (req, res, next) => {
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
        if (req.user) {
          req.user.userType = 'worker';
        }
      } else {
        req.user = await User.findById(decoded.id).select('-password');
        if (req.user) {
          req.user.userType = decoded.role || 'user';
        }
      }
    } catch (error) {
      // Token invalid but continue as guest
      console.error('Optional auth error:', error.message);
      req.user = null;
    }
  } else {
    // No token - guest user
    req.user = null;
  }

  // Always proceed (guest or authenticated)
  next();
};

// Admin only middleware
const admin = (req, res, next) => {
  if (req.user && req.user.userType === 'admin') {
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
  if (req.user && req.user.userType === 'worker') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access restricted to workers only'
    });
  }
};

module.exports = { protect, optionalAuth, admin, workerOnly };