const express = require('express');
const router = express.Router();
const {
  getSales,
  getSaleById,
  createSale,
  updateSale,
  deleteSale,
} = require('../controllers/saleController');
const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getSales)
  .post(createSale);

router.route('/:id')
  .get(getSaleById)
  .put(updateSale)
  .delete(admin, deleteSale);

module.exports = router;

