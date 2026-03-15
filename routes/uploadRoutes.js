const express = require('express');
const router = express.Router();
const { protect, workerOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const {
  uploadImageValidation,
  deletePortfolioValidation
} = require('../validators/uploadValidators');

const {
  uploadProfileImage,
  uploadPortfolioImages,
  deletePortfolioImage,
  deleteProfileImage
} = require('../controllers/uploadController');

// Profile image routes – worker only
router.post(
  '/profile',
  protect,
  workerOnly,
  upload.single('profileImage'),
  uploadImageValidation,
  validate,
  uploadProfileImage
);

router.delete(
  '/profile',
  protect,
  workerOnly,
  deleteProfileImage
);

// Portfolio images routes – worker only
router.post(
  '/portfolio',
  protect,
  workerOnly,
  upload.array('portfolioImages', 5),
  uploadImageValidation,
  validate,
  uploadPortfolioImages
);

router.delete(
  '/portfolio/:publicId',
  protect,
  workerOnly,
  deletePortfolioValidation,
  validate,
  deletePortfolioImage
);

module.exports = router;