const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getSales,
  getSaleById,
  createSale,
  updateSale,
  deleteSale,
} = require('../controllers/saleController');
const { protect, admin } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const createSaleRules = [
  body('customerId').notEmpty().withMessage('Customer ID is required'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),
  body('items.*.productId')
    .notEmpty()
    .withMessage('Each item must have a product ID'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Each item quantity must be at least 1'),
  body('items.*.unitPrice')
    .isFloat({ min: 0 })
    .withMessage('Each item unit price must be a non-negative number'),
  body('paymentMethod')
    .optional()
    .isIn(['Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque', 'Other'])
    .withMessage('Invalid payment method'),
  body('tax')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Tax must be between 0 and 100'),
  body('discount')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount must be between 0 and 100'),
];

const updateSaleRules = [
  body('paymentStatus')
    .optional()
    .isIn(['Pending', 'Paid', 'Partial', 'Refunded'])
    .withMessage('Invalid payment status'),
];

router.use(protect);

router.route('/')
  .get(getSales)
  .post(createSaleRules, validate, createSale);

router.route('/:id')
  .get(getSaleById)
  .put(updateSaleRules, validate, updateSale)
  .delete(admin, deleteSale);

module.exports = router;
