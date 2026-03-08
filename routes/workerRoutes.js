const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  searchWorkers,
  getWorkerById,
  getAllWorkers,
  verifyWorker
} = require('../controllers/workerController');

router.get('/search', searchWorkers);
router.get('/:id', getWorkerById);
router.get('/', protect, admin, getAllWorkers);
router.put('/:id/verify', protect, admin, verifyWorker);

module.exports = router;