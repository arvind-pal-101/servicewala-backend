const Worker = require('../models/Worker');
const generateToken = require('../utils/generateToken');
const { setCookie, clearCookie } = require('../utils/setCookie');

// @desc    Register new worker
// @route   POST /api/auth/worker/register
// @access  Public
const registerWorker = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      password,
      category,
      experience,
      hourlyRate,
      location,
      documents
    } = req.body;

    // Validation
    if (!name || !phone || !password || !category || !experience || !hourlyRate || !location) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if worker already exists
    const workerExists = await Worker.findOne({ phone });

    if (workerExists) {
      return res.status(400).json({
        success: false,
        message: 'Worker with this phone number already exists'
      });
    }

    // Create worker
    const worker = await Worker.create({
      name,
      phone,
      email,
      password,
      category,
      experience,
      hourlyRate,
      location,
      documents: {
        aadhaarNumber: documents?.aadhaarNumber,
        aadhaarImage: documents?.aadhaarImage
      }
    });

    if (worker) {
      // Generate token
      const token = generateToken(worker._id, 'worker');
      
      // Set HTTP-only cookie
      setCookie(res, token);
      
      res.status(201).json({
        success: true,
        message: 'Worker registered successfully. Waiting for admin approval.',
        data: {
          _id: worker._id,
          name: worker.name,
          phone: worker.phone,
          email: worker.email,
          category: worker.category,
          verification: worker.verification
          // No token in response - it's in cookie!
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid worker data'
      });
    }
  } catch (error) {
    console.error('Worker registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Login worker
// @route   POST /api/auth/worker/login
// @access  Public
const loginWorker = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Validation
    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide phone and password'
      });
    }

    // Step 1: Check if worker exists
    const worker = await Worker.findOne({ phone })
      .select('+password')
      .populate('category', 'name icon');

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'No worker account found with this phone number. Please register first.',
        errorType: 'USER_NOT_FOUND'
      });
    }

    // Step 2: Check verification status
    if (worker.verification.status === 'rejected') {
      return res.status(403).json({
        success: false,
        message: 'Your application was rejected. Reason: ' + (worker.verification.rejectionReason || 'Contact support for details'),
        errorType: 'ACCOUNT_REJECTED'
      });
    }

    if (worker.verification.status === 'pending') {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending admin verification. Please wait for approval.',
        errorType: 'ACCOUNT_PENDING'
      });
    }

    if (!worker.verification.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Your account is not verified yet. Please wait for admin approval.',
        errorType: 'ACCOUNT_NOT_VERIFIED'
      });
    }

    // Step 3: Check if worker is active
    if (!worker.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
        errorType: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Step 4: Check password
    const isMatch = await worker.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please try again or reset your password.',
        errorType: 'WRONG_PASSWORD'
      });
    }

    // Generate token and set cookie
    const token = generateToken(worker._id, 'worker');
    setCookie(res, token);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        _id: worker._id,
        name: worker.name,
        phone: worker.phone,
        email: worker.email,
        category: worker.category,
        experience: worker.experience,
        hourlyRate: worker.hourlyRate,
        location: worker.location,
        profilePic: worker.profilePic,
        verification: worker.verification,
        ratings: worker.ratings,
        availability: worker.availability
      }
    });
  } catch (error) {
    console.error('Worker login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
      errorType: 'SERVER_ERROR'
    });
  }
};

// @desc    Logout worker
// @route   POST /api/auth/worker/logout
// @access  Private
const logoutWorker = async (req, res) => {
  try {
    // Clear cookie
    clearCookie(res);
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get current worker profile
// @route   GET /api/auth/worker/me
// @access  Private (Worker)
const getMe = async (req, res) => {
  try {
    const worker = await Worker.findById(req.user._id)
      .populate('category', 'name icon');

    res.json({
      success: true,
      data: worker
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update worker profile
// @route   PUT /api/auth/worker/profile
// @access  Private (Worker)
const updateProfile = async (req, res) => {
  try {
    const worker = await Worker.findById(req.user._id);

    if (worker) {
      worker.name = req.body.name || worker.name;
      worker.email = req.body.email || worker.email;
      worker.experience = req.body.experience || worker.experience;
      worker.hourlyRate = req.body.hourlyRate || worker.hourlyRate;
      worker.location = req.body.location || worker.location;
      worker.profilePic = req.body.profilePic || worker.profilePic;
      worker.portfolio = req.body.portfolio || worker.portfolio;

      // Update password if provided
      if (req.body.password) {
        worker.password = req.body.password;
      }

      const updatedWorker = await worker.save();

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedWorker
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update worker availability
// @route   PUT /api/auth/worker/availability
// @access  Private (Worker)
const updateAvailability = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const worker = await Worker.findById(req.user._id);

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }
    
    // Update availability
    if (req.body.isAvailable !== undefined) {
      worker.availability.isAvailable = req.body.isAvailable;
    }
    
    if (req.body.schedule) {
      worker.availability.schedule = req.body.schedule;
    }

    const updatedWorker = await worker.save();

    res.json({
      success: true,
      message: 'Availability updated successfully',
      data: {
        availability: updatedWorker.availability
      }
    });
  } catch (error) {
    console.error('Availability update error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  registerWorker,
  loginWorker,
  logoutWorker,  // NEW - export logout
  getMe,
  updateProfile,
  updateAvailability
};