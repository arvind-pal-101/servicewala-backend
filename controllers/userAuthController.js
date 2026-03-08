const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Register new user
// @route   POST /api/auth/user/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, phone, email, password, location } = req.body;

    // Validation
    if (!name || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, phone and password'
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ phone });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User with this phone number already exists'
      });
    }

    // Create user
    const user = await User.create({
      name,
      phone,
      email,
      password,
      location
    });

    if (user) {
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          _id: user._id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          location: user.location,
          role: user.role,
          token: generateToken(user._id, 'user')
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid user data'
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

// @desc    Login user
// @route   POST /api/auth/user/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Validation
    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide phone and password'
      });
    }

    // Check for user (include password field)
    const user = await User.findOne({ phone }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone number or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated'
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);

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
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        location: user.location,
        role: user.role,
        profilePic: user.profilePic,
        token: generateToken(user._id, 'user')
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

// @desc    Get current user profile
// @route   GET /api/auth/user/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/user/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.location = req.body.location || user.location;
      user.profilePic = req.body.profilePic || user.profilePic;

      // Update password if provided
      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          _id: updatedUser._id,
          name: updatedUser.name,
          phone: updatedUser.phone,
          email: updatedUser.email,
          location: updatedUser.location,
          profilePic: updatedUser.profilePic
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'User not found'
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
  registerUser,
  loginUser,
  getMe,
  updateProfile
};