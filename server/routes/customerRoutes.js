const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getCustomers,
  getCustomerById,
  getCustomerSales,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require('../controllers/customerController');
const { protect, admin } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const createCustomerRules = [
  body('name').trim().notEmpty().withMessage('Customer name is required'),
  body('email')
    .optional({ checkFalsy: true })
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .notEmpty()
    .withMessage('Phone cannot be empty if provided'),
];

const updateCustomerRules = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email')
    .optional({ checkFalsy: true })
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
];

router.use(protect);

router.route('/')
  .get(getCustomers)
  .post(createCustomerRules, validate, createCustomer);

router.route('/:id')
  .get(getCustomerById)
  .put(updateCustomerRules, validate, updateCustomer)
  .delete(admin, deleteCustomer);

router.get('/:id/sales', getCustomerSales);

module.exports = router;
