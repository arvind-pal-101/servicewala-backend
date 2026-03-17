const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  getMyCommission,
  payCommission,
  getAllCommissions,
  adminCollectCommission
} = require('../controllers/commissionController');

// Worker routes
router.get('/my', protect, getMyCommission);
router.post('/pay', protect, payCommission);

// Admin routes
router.get('/all', protect, admin, getAllCommissions);
router.post('/collect', protect, admin, adminCollectCommission);

module.exports = router;