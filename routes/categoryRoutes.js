const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');

router.get('/', getAllCategories);
router.get('/:id', getCategoryById);
router.post('/', protect, admin, createCategory);
router.put('/:id', protect, admin, updateCategory);
router.delete('/:id', protect, admin, deleteCategory);

module.exports = router;