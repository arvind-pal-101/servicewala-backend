const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const validate = require('../middleware/validate'); // ← ADDED
const {
  verifyWorkerValidation,
  rejectWorkerValidation,
  toggleUserStatusValidation
} = require('../validators/adminValidators'); // ← ADDED

const {
  getStats,
  getAllUsers,
  getAllWorkers,
  getAllBookings,
  verifyWorker,
  rejectWorker,
  toggleUserStatus,
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
  verifyWorkerValidation,   // ← ADDED
  validate,                 // ← ADDED
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
  toggleUserStatusValidation, // ← ADDED
  validate,                   // ← ADDED
  toggleUserStatus
);

module.exports = router;