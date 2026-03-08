const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createBooking,
  getMyBookings,
  getWorkerBookings,
  getBookingById,
  acceptBooking,
  rejectBooking,
  startService,
  completeBooking,
  cancelBooking
} = require('../controllers/bookingController');

// Create booking - NO PROTECT (allows guest bookings)
// But we use optional auth middleware
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (token) {
    // If token exists, verify it
    const jwt = require('jsonwebtoken');
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { _id: decoded.id, role: decoded.role };
    } catch (error) {
      // Token invalid, continue as guest
      req.user = null;
    }
  }
  next();
};

router.post('/', optionalAuth, createBooking);

// Protected routes (need login)
router.get('/my-bookings', protect, getMyBookings);
router.get('/worker-bookings', protect, getWorkerBookings);
router.get('/:id', protect, getBookingById);
router.put('/:id/accept', protect, acceptBooking);
router.put('/:id/reject', protect, rejectBooking);
router.put('/:id/start', protect, startService);
router.put('/:id/complete', protect, completeBooking);
router.put('/:id/cancel', protect, cancelBooking);

module.exports = router;