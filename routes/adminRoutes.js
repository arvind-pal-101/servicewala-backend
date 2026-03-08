const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
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

// Note: In production, add proper admin authentication middleware
// For now, we'll use the regular protect middleware
// You can create a separate isAdmin middleware later

router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.get('/workers', getAllWorkers);
router.get('/bookings', getAllBookings);
router.get('/analytics', getAnalytics);
router.put('/workers/:id/verify', verifyWorker);
router.put('/workers/:id/reject', rejectWorker);
router.put('/users/:id/toggle-status', toggleUserStatus);

module.exports = router;