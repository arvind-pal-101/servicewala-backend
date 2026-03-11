const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createBookingValidation,
  updateBookingStatusValidation
} = require('../validators/bookingValidators');

const {
  createBooking,
  getMyBookings,
  getWorkerBookings,
  getBookingById,
  acceptBooking,
  rejectBooking,
  startService,
  completeBooking,
  cancelBooking,
  confirmCashPayment
} = require('../controllers/bookingController');

// User routes - VALIDATION ADDED
router.post('/', optionalAuth, createBookingValidation, validate, createBooking);
router.get('/my-bookings', protect, getMyBookings);
router.get('/worker-bookings', protect, getWorkerBookings);
router.get('/:id', protect, getBookingById);

// Worker actions
router.put('/:id/accept', protect, acceptBooking);
router.put('/:id/reject', protect, rejectBooking);
router.put('/:id/start', protect, startService);
router.put('/:id/complete', protect, completeBooking);
router.put('/:id/confirm-cash', protect, confirmCashPayment);

// Both user and worker
router.put('/:id/cancel', protect, cancelBooking);

module.exports = router;