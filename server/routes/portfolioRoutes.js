const express = require('express');
const router = express.Router();
const { getPortfolio, addAsset, getAsset, updateAsset, deleteAsset } = require('../controllers/portfolioController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getPortfolio).post(addAsset);
router.route('/:id').get(getAsset).put(updateAsset).delete(deleteAsset);

module.exports = router;
