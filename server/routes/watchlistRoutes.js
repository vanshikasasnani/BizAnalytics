const express = require('express');
const router = express.Router();
const {
  getWatchlist,
  addWatchlistItem,
  deleteWatchlistItem,
  updateWatchlistItem,
} = require('../controllers/watchlistController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getWatchlist).post(addWatchlistItem);
router.route('/:id').put(updateWatchlistItem).delete(deleteWatchlistItem);

module.exports = router;
