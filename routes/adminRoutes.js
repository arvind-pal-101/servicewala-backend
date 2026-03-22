const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  verifyWorkerValidation,
  rejectWorkerValidation,
  toggleUserStatusValidation
} = require('../validators/adminValidators');

const {
  getStats,
  getAllUsers,
  getAllWorkers,
  getAllBookings,
  verifyWorker,
  rejectWorker,
  toggleUserStatus,
  toggleWorkerStatus,  // ← NEW LINE ADDED
  getAnalytics
} = require('../controllers/adminController');

// All admin routes are protected and require admin role
router.get('/stats', protect, admin, getStats);
router.get('/users', protect, admin, getAllUsers);
router.get('/workers', protect, admin, getAllWorkers);
router.get('/bookings', protect, admin, getAllBookings);
router.get('/analytics', protect, admin, getAnalytics);

// Worker verification with validation
router.put(
  '/workers/:id/verify',
  protect,
  admin,
  verifyWorkerValidation,
  validate,
  verifyWorker
);

router.put(
  '/workers/:id/reject',
  protect,
  admin,
  rejectWorkerValidation,
  validate,
  rejectWorker
);

// Toggle user status with validation
router.put(
  '/users/:id/toggle-status',
  protect,
  admin,
  toggleUserStatusValidation,
  validate,
  toggleUserStatus
);

// Toggle worker status - NEW!
router.put(
  '/workers/:id/toggle-status',
  protect,
  admin,
  toggleWorkerStatus
);

module.exports = router;