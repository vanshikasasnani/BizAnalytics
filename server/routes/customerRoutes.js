const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  getCustomerSales,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require('../controllers/customerController');
const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getCustomers)
  .post(createCustomer);

router.route('/:id')
  .get(getCustomerById)
  .put(updateCustomer)
  .delete(admin, deleteCustomer);

router.get('/:id/sales', getCustomerSales);

module.exports = router;

