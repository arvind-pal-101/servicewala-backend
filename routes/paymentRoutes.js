const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  getPaymentDetails,
  refundPayment
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.get('/:bookingId', protect, getPaymentDetails);
router.post('/refund/:bookingId', protect, refundPayment);

module.exports = router;