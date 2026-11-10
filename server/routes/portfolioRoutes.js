const express = require('express');
const router = express.Router();
const {
  getPortfolio,
  addAsset,
  getAsset,
  updateAsset,
  deleteAsset,
  refreshPrices,
  getMarketQuote,
} = require('../controllers/portfolioController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/refresh-prices', refreshPrices);
router.get('/quote/:symbol', getMarketQuote);

router.route('/').get(getPortfolio).post(addAsset);
router.route('/:id').get(getAsset).put(updateAsset).delete(deleteAsset);

module.exports = router;
