const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Admin login (JWT)
// @route   POST /api/auth/admin/login
// @access  Public
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const adminUser = await User.findOne({ email, role: 'admin' }).select('+password');

    if (!adminUser) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!adminUser.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated'
      });
    }

    const isMatch = await adminUser.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(adminUser._id, 'admin');

    // ✅ SET COOKIE (function ke andar yahan add karo)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      encode: String
    });

    // Response with token (optional)
    return res.json({
      success: true,
      message: 'Admin login successful',
      data: {
        _id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        token   // token body mein bhi bhej sakte ho (optional)
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = { loginAdmin };