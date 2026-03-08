const Worker = require('../models/Worker');
const generateToken = require('../utils/generateToken');

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
      res.status(201).json({
        success: true,
        message: 'Worker registered successfully. Waiting for admin approval.',
        data: {
          _id: worker._id,
          name: worker.name,
          phone: worker.phone,
          email: worker.email,
          category: worker.category,
          verification: worker.verification,
          token: generateToken(worker._id, 'worker')
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid worker data'
      });
    }
  } catch (error) {
    console.error(error);
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

    // Check for worker (include password field)
    const worker = await Worker.findOne({ phone })
      .select('+password')
      .populate('category', 'name icon');

    if (!worker) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone number or password'
      });
    }

    // Check if worker is active
    if (!worker.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated'
      });
    }

    // Check password
    const isMatch = await worker.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone number or password'
      });
    }

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
        availability: worker.availability,
        token: generateToken(worker._id, 'worker')
      }
    });
  } catch (error) {
    console.error(error);
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
    const worker = await Worker.findById(req.user._id);

    if (worker) {
      worker.availability.isAvailable = req.body.isAvailable ?? worker.availability.isAvailable;
      
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

module.exports = {
  registerWorker,
  loginWorker,
  getMe,
  updateProfile,
  updateAvailability
};