const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { setCookie } = require('../utils/setCookie');

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

    const token = generateToken(adminUser._id, 'admin');

    // setCookie use karo — same as user/worker
    setCookie(res, token);

    return res.json({
      success: true,
      message: 'Admin login successful',
      data: {
        _id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role
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