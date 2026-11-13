const express = require('express');
const router = express.Router();
const {
  getUsers,
  getAdminStats,
  toggleUserStatus,
  updateUserRole,
  deleteUser,
  createStaffUser,
  updateStaffUser,
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect, admin);

router.get('/users', getUsers);
router.post('/users', createStaffUser);
router.put('/users/:id', updateStaffUser);
router.get('/stats', getAdminStats);
router.put('/users/:id/toggle', toggleUserStatus);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

module.exports = router;
