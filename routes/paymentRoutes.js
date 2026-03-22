const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  getPaymentDetails,
  refundPayment,
  selectCashPayment,
  markWorkerPaid,      // ← NEW
  getPendingPayouts    // ← NEW
} = require('../controllers/paymentController');
const { protect, admin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { initiatePaymentValidation, verifyPaymentValidation } = require('../validators/paymentValidators');

router.post('/initiate', protect, initiatePaymentValidation, validate, createOrder);

router.post('/create-order', protect, initiatePaymentValidation, validate, createOrder);
router.post('/verify', protect, verifyPaymentValidation, validate, verifyPayment);
router.get('/:bookingId', protect, getPaymentDetails);

// Cash payment - NEW!
router.post('/cash/:bookingId', protect, selectCashPayment);

// Refunds are admin-only
router.post('/refund/:bookingId', protect, admin, refundPayment);

// Worker payout management - Admin only
router.post('/mark-worker-paid/:bookingId', protect, admin, markWorkerPaid);
router.get('/pending-payouts', protect, admin, getPendingPayouts);

module.exports = router;