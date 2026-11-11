const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const productRules = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('sku').trim().notEmpty().withMessage('SKU is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
  body('costPrice').isFloat({ min: 0 }).withMessage('Cost price must be a non-negative number'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
];

const updateProductRules = [
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
  body('costPrice').optional().isFloat({ min: 0 }).withMessage('Cost price must be a non-negative number'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('lowStockThreshold').optional().isInt({ min: 0 }).withMessage('Low stock threshold must be a non-negative integer'),
];

router.use(protect);

router.route('/')
  .get(getProducts)
  .post(productRules, validate, createProduct);

router.route('/:id')
  .get(getProductById)
  .put(updateProductRules, validate, updateProduct)
  .delete(admin, deleteProduct);

module.exports = router;
