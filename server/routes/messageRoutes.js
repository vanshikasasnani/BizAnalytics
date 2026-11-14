const express = require('express');
const router = express.Router();
const {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

// All message routes require valid JWT authentication
router.use(protect);

router.get('/conversations', getConversations);
router.get('/unread/count', getUnreadCount);
router.get('/:otherUserId', getMessages);
router.post('/', sendMessage);
router.put('/read/:otherUserId', markAsRead);

module.exports = router;

