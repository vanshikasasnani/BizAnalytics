const express = require('express');
const router = express.Router();
const { getUsers, getStats, toggleUserStatus, deleteUser } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect, admin);

router.get('/users', getUsers);
router.get('/stats', getStats);
router.put('/users/:id/toggle', toggleUserStatus);
router.delete('/users/:id', deleteUser);

module.exports = router;
