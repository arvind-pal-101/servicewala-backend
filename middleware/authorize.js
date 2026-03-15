const Booking = require('../models/Booking');
const Worker = require('../models/Worker');

// ============================================
// BOOKING AUTHORIZATION
// ============================================

// Check if user owns the booking (as customer)
exports.checkBookingCustomer = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user is the customer
    const isCustomer = booking.customer && booking.customer.toString() === req.user._id.toString();
    
    if (!isCustomer) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This booking belongs to another customer.'
      });
    }

    // Attach booking to request for controller use
    req.booking = booking;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Check if worker owns the booking (as assigned worker)
exports.checkBookingWorker = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user is the assigned worker
    const isWorker = booking.worker && booking.worker.toString() === req.user._id.toString();
    
    if (!isWorker) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This booking is assigned to another worker.'
      });
    }

    // Attach booking to request
    req.booking = booking;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Check if user is either customer or worker for this booking
exports.checkBookingAccess = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customer worker category');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user is customer or worker
    const isCustomer = booking.customer && booking.customer._id && booking.customer._id.toString() === req.user._id.toString();
    const isWorker = booking.worker && booking.worker._id && booking.worker._id.toString() === req.user._id.toString();
    
    if (!isCustomer && !isWorker) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not authorized to view this booking.'
      });
    }

    // Attach booking and access type to request
    req.booking = booking;
    req.bookingAccessType = isCustomer ? 'customer' : 'worker';
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// WORKER AUTHORIZATION
// ============================================

// Check if logged-in user owns the worker profile
exports.checkWorkerOwnership = async (req, res, next) => {
  try {
    // User must be a worker
    if (req.user.userType !== 'worker') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only workers can perform this action.'
      });
    }

    // For routes that use req.user._id (like profile update)
    // we're already authenticated, just need to verify userType
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Check if worker profile being accessed belongs to logged-in worker
exports.checkWorkerProfileAccess = async (req, res, next) => {
  try {
    const workerId = req.params.id || req.params.workerId;
    
    // If no specific worker ID in params, allow (for own profile operations)
    if (!workerId) {
      return next();
    }

    const worker = await Worker.findById(workerId);
    
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    // Check if logged-in worker owns this profile
    if (req.user.userType !== 'worker' || worker._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only modify your own worker profile.'
      });
    }

    req.worker = worker;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// PAYMENT AUTHORIZATION
// ============================================

// Only booking customer can initiate payment
exports.checkPaymentAuthorization = async (req, res, next) => {
  try {
    const bookingId = req.params.bookingId || req.body.bookingId;
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Only customer can pay
    const isCustomer = booking.customer && booking.customer.toString() === req.user._id.toString();
    
    if (!isCustomer) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the booking customer can make payment.'
      });
    }

    req.booking = booking;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// REVIEW AUTHORIZATION
// ============================================

// Only booking customer can review
exports.checkReviewAuthorization = async (req, res, next) => {
  try {
    const bookingId = req.body.booking;
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Only customer can review
    const isCustomer = booking.customer && booking.customer.toString() === req.user._id.toString();
    
    if (!isCustomer) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the customer who booked can write a review.'
      });
    }

    // Check if service completed
    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'You can only review completed services.'
      });
    }

    req.booking = booking;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};