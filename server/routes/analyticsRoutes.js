const express = require('express');
const router = express.Router();
const {
  getDashboardData,
  getDetailedAnalytics,
  exportReportCSV,
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/dashboard', getDashboardData);
router.get('/detailed', getDetailedAnalytics);
router.get('/export/:reportType', exportReportCSV);

module.exports = router;

