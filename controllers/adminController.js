const User = require('../models/User');
const Worker = require('../models/Worker');
const Booking = require('../models/Booking');
const Category = require('../models/Category');
const Review = require('../models/Review');
const AuditLog = require('../models/AuditLog');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalWorkers = await Worker.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const pendingWorkers = await Worker.countDocuments({ 'verification.status': 'pending' });
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    
    // Calculate revenue (10% commission from completed bookings)
    const completedBookingsData = await Booking.find({ status: 'completed' });
    const revenue = completedBookingsData.reduce((sum, booking) => {
      return sum + (booking.pricing?.platformCommission || 0);
    }, 0);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalWorkers,
        totalBookings,
        pendingWorkers,
        completedBookings,
        revenue
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all workers
// @route   GET /api/admin/workers
// @access  Private (Admin)
const getAllWorkers = async (req, res) => {
  try {
    const workers = await Worker.find()
      .populate('category', 'name icon')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: workers.length,
      data: workers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all bookings
// @route   GET /api/admin/bookings
// @access  Private (Admin)
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('customer', 'name phone email')
      .populate('worker', 'name phone')
      .populate('category', 'name icon')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify worker
// @route   PUT /api/admin/workers/:id/verify
// @access  Private (Admin)
const verifyWorker = async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    worker.verification.isVerified = true;
    worker.verification.status = 'approved';
    worker.verification.verifiedAt = Date.now();
    worker.isActive = true;

    await worker.save();

    // Audit log
    try {
      await AuditLog.create({
        actor: req.user?._id,
        actorType: req.user?.userType || 'unknown',
        action: 'worker.verified',
        targetType: 'Worker',
        targetId: worker._id.toString(),
        meta: { status: 'approved' }
      });
    } catch (auditError) {
      console.error('Audit log error:', auditError.message);
    }

    res.json({
      success: true,
      message: 'Worker verified successfully',
      data: worker
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reject worker
// @route   PUT /api/admin/workers/:id/reject
// @access  Private (Admin)
const rejectWorker = async (req, res) => {
  try {
    const { reason } = req.body;
    const worker = await Worker.findById(req.params.id);

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    worker.verification.status = 'rejected';
    worker.verification.rejectionReason = reason || 'Not specified';
    worker.isActive = false;

    await worker.save();

    // Audit log
    try {
      await AuditLog.create({
        actor: req.user?._id,
        actorType: req.user?.userType || 'unknown',
        action: 'worker.rejected',
        targetType: 'Worker',
        targetId: worker._id.toString(),
        meta: { status: 'rejected', reason: reason || 'Not specified' }
      });
    } catch (auditError) {
      console.error('Audit log error:', auditError.message);
    }

    res.json({
      success: true,
      message: 'Worker rejected',
      data: worker
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle user status
// @route   PUT /api/admin/users/:id/toggle-status
// @access  Private (Admin)
const toggleUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = isActive;
    await user.save();

    // Audit log
    try {
      await AuditLog.create({
        actor: req.user?._id,
        actorType: req.user?.userType || 'unknown',
        action: 'user.status_toggled',
        targetType: 'User',
        targetId: user._id.toString(),
        meta: { isActive }
      });
    } catch (auditError) {
      console.error('Audit log error:', auditError.message);
    }

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get platform analytics
// @route   GET /api/admin/analytics
// @access  Private (Admin)
const getAnalytics = async (req, res) => {
  try {
    // Monthly bookings
    const monthlyBookings = await Booking.aggregate([
      {
        $group: {
          _id: { $month: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Top categories
    const topCategories = await Booking.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryData'
        }
      }
    ]);

    // Top workers
    const topWorkers = await Booking.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$worker',
          completedJobs: { $sum: 1 }
        }
      },
      { $sort: { completedJobs: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'workers',
          localField: '_id',
          foreignField: '_id',
          as: 'workerData'
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        monthlyBookings,
        topCategories,
        topWorkers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getStats,
  getAllUsers,
  getAllWorkers,
  getAllBookings,
  verifyWorker,
  rejectWorker,
  toggleUserStatus,
  getAnalytics
};