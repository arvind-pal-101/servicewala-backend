const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  getPaymentDetails,
  refundPayment
} = require('../controllers/paymentController');
const { protect, admin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { initiatePaymentValidation, verifyPaymentValidation } = require('../validators/paymentValidators');

router.post('/initiate', protect, initiatePaymentValidation, validate, createOrder);

router.post('/create-order', protect, initiatePaymentValidation, validate, createOrder);
router.post('/verify', protect, verifyPaymentValidation, validate, verifyPayment);
router.get('/:bookingId', protect, getPaymentDetails);

// Refunds are admin-only
router.post('/refund/:bookingId', protect, admin, refundPayment);

module.exports = router;