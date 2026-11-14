const Message = require('../models/Message');
const User = require('../models/User');

/**
 * Helper to generate consistent conversation IDs
 * Sorted so [UserA, UserB] always yields the exact same conversation ID regardless of who speaks first.
 */
const getConversationId = (id1, id2) => {
  return [id1.toString(), id2.toString()].sort().join('_');
};

// @desc    Get all conversations available to current user
// @route   GET /api/messages/conversations
// @access  Private (Admin & Staff)
const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const currentUserRole = req.user.role;

    let targetUsers = [];

    if (currentUserRole === 'admin') {
      // Admin can message any active Staff user or fellow Admin
      targetUsers = await User.find({
        _id: { $ne: currentUserId },
        isActive: true,
      })
        .select('name email role avatar isActive')
        .sort({ role: 1, name: 1 });
    } else {
      // Staff users can ONLY message Administrators (security isolation)
      targetUsers = await User.find({
        role: 'admin',
        isActive: true,
      })
        .select('name email role avatar isActive')
        .sort({ name: 1 });
    }

    // For each available user, find the last message and unread count
    const conversations = await Promise.all(
      targetUsers.map(async (target) => {
        const conversationId = getConversationId(currentUserId, target._id);

        const lastMessage = await Message.findOne({ conversationId })
          .sort({ createdAt: -1 })
          .select('message sender receiver isRead createdAt');

        const unreadCount = await Message.countDocuments({
          conversationId,
          receiverId: currentUserId,
          isRead: false,
        });

        return {
          conversationId,
          contact: {
            _id: target._id,
            name: target.name,
            email: target.email,
            role: target.role,
            avatar: target.avatar || '',
            isActive: target.isActive,
          },
          lastMessage: lastMessage || null,
          unreadCount,
        };
      })
    );

    // Sort conversations: those with messages first (most recent), then alphabetically
    conversations.sort((a, b) => {
      const timeA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const timeB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
      if (timeA !== timeB) return timeB - timeA;
      return a.contact.name.localeCompare(b.contact.name);
    });

    res.json({ conversations });
  } catch (error) {
    console.error('getConversations error:', error.message);
    res.status(500).json({ message: error.message || 'Server error loading conversations' });
  }
};

// @desc    Get message history with a specific user
// @route   GET /api/messages/:otherUserId
// @access  Private
const getMessages = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { otherUserId } = req.params;

    if (!otherUserId || otherUserId === currentUserId.toString()) {
      return res.status(400).json({ message: 'Invalid target user ID' });
    }

    const otherUser = await User.findById(otherUserId).select('name email role avatar isActive');
    if (!otherUser) {
      return res.status(404).json({ message: 'Target user not found' });
    }

    // Authorization check: Staff can only chat with Admins
    if (req.user.role !== 'admin' && otherUser.role !== 'admin') {
      return res.status(403).json({ message: 'Staff users are only authorized to communicate with Administrators' });
    }

    const conversationId = getConversationId(currentUserId, otherUserId);

    // Fetch message history
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .populate('sender', 'name email role')
      .populate('receiver', 'name email role');

    // Mark incoming messages as read
    const unreadUpdated = await Message.updateMany(
      {
        conversationId,
        receiverId: currentUserId,
        isRead: false,
      },
      { isRead: true }
    );

    // Notify the other user in real-time that their messages were read
    if (unreadUpdated.modifiedCount > 0) {
      const io = req.app.get('io');
      if (io) {
        io.to(otherUserId.toString()).emit('messages_read', {
          conversationId,
          readerId: currentUserId,
        });
      }
    }

    res.json({
      conversationId,
      otherUser,
      messages,
    });
  } catch (error) {
    console.error('getMessages error:', error.message);
    res.status(500).json({ message: error.message || 'Server error loading messages' });
  }
};

// @desc    Send a new message to another user
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { receiverId, message } = req.body;

    if (!receiverId) {
      return res.status(400).json({ message: 'Receiver ID is required' });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message content cannot be empty' });
    }

    if (message.trim().length > 2000) {
      return res.status(400).json({ message: 'Message cannot exceed 2000 characters' });
    }

    if (currentUserId.toString() === receiverId.toString()) {
      return res.status(400).json({ message: 'You cannot send messages to yourself' });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver user not found' });
    }

    if (!receiver.isActive) {
      return res.status(403).json({ message: 'Cannot message a deactivated account' });
    }

    // Role security: Staff can only send to Admin
    if (req.user.role !== 'admin' && receiver.role !== 'admin') {
      return res.status(403).json({ message: 'Staff users are only authorized to communicate with Administrators' });
    }

    const conversationId = getConversationId(currentUserId, receiverId);

    // Persist to MongoDB FIRST before sending real-time event
    const createdMessage = await Message.create({
      conversationId,
      sender: currentUserId,
      receiver: receiverId,
      senderId: currentUserId,
      receiverId: receiverId,
      message: message.trim(),
      isRead: false,
    });

    const populated = await Message.findById(createdMessage._id)
      .populate('sender', 'name email role')
      .populate('receiver', 'name email role');

    // Deliver via Socket.IO
    const io = req.app.get('io');
    if (io) {
      // 1. Deliver to receiver's user room
      io.to(receiverId.toString()).emit('new_message', populated);

      // 2. Deliver to sender's user room (confirms delivery across multiple tabs)
      io.to(currentUserId.toString()).emit('message_sent', populated);

      // 3. Emit general notification event
      io.to(receiverId.toString()).emit('notification', {
        _id: `msg_${createdMessage._id}`,
        title: `💬 New message from ${req.user.name}`,
        message: message.trim().length > 60 ? `${message.trim().slice(0, 57)}...` : message.trim(),
        type: 'system',
        link: '/messages',
        createdAt: new Date(),
      });
    }

    res.status(201).json({
      message: 'Message sent successfully',
      data: populated,
    });
  } catch (error) {
    console.error('sendMessage error:', error.message);
    res.status(500).json({ message: error.message || 'Server error sending message' });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/messages/read/:otherUserId
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { otherUserId } = req.params;

    const conversationId = getConversationId(currentUserId, otherUserId);

    const result = await Message.updateMany(
      {
        conversationId,
        receiverId: currentUserId,
        isRead: false,
      },
      { isRead: true }
    );

    if (result.modifiedCount > 0) {
      const io = req.app.get('io');
      if (io) {
        io.to(otherUserId.toString()).emit('messages_read', {
          conversationId,
          readerId: currentUserId,
        });
      }
    }

    res.json({ message: 'Messages marked as read', modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('markAsRead error:', error.message);
    res.status(500).json({ message: error.message || 'Server error marking messages read' });
  }
};

// @desc    Get total unread message count for current user
// @route   GET /api/messages/unread/count
// @access  Private
const getUnreadCount = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const count = await Message.countDocuments({
      receiverId: currentUserId,
      isRead: false,
    });

    res.json({ unreadCount: count });
  } catch (error) {
    console.error('getUnreadCount error:', error.message);
    res.status(500).json({ message: error.message || 'Server error getting unread count' });
  }
};

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,
};

