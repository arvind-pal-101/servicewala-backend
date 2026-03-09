const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  uploadProfileImage,
  uploadPortfolioImages,
  deletePortfolioImage,
  deleteProfileImage
} = require('../controllers/uploadController');

// Profile image routes
router.post('/profile', protect, upload.single('profileImage'), uploadProfileImage);
router.delete('/profile', protect, deleteProfileImage);

// Portfolio images routes
router.post('/portfolio', protect, upload.array('portfolioImages', 5), uploadPortfolioImages);
router.delete('/portfolio/:publicId', protect, deletePortfolioImage);

module.exports = router;