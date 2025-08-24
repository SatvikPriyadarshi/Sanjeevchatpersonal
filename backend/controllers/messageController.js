const Message = require('../models/Message');
const Room = require('../models/Room');
const User = require('../models/User');

// Create a new message
exports.createMessage = async (req, res) => {
  try {
    const { roomId, senderId, content } = req.body;

    if (!roomId || !senderId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Room ID, sender ID, and content are required'
      });
    }

    // Validate that sender is in the room
    const user = await User.findById(senderId);
    if (!user || user.roomId?.toString() !== roomId) {
      return res.status(400).json({
        success: false,
        message: 'User is not in this room'
      });
    }

    // Validate room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const message = new Message({
      roomId,
      senderId,
      content: content.trim()
    });

    await message.save();

    // Populate sender information
    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'username avatar');

    res.status(201).json({
      success: true,
      message: 'Message created successfully',
      data: populatedMessage
    });
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create message',
      error: error.message
    });
  }
};

// Get messages by room ID
exports.getMessagesByRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    // Validate room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const messages = await Message.findByRoom(roomId, parseInt(limit), parseInt(skip));

    // Reverse to get chronological order (oldest first)
    const chronologicalMessages = messages.reverse();

    res.status(200).json({
      success: true,
      data: chronologicalMessages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error.message
    });
  }
};

// Get message by ID
exports.getMessageById = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findById(id)
      .populate('senderId', 'username avatar')
      .populate('roomId', 'roomNumber');

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    res.status(200).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error fetching message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch message',
      error: error.message
    });
  }
};

// Update message (for editing)
exports.updateMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    message.content = content.trim();
    message.timestamp = new Date(); // Update timestamp when edited
    await message.save();

    const updatedMessage = await Message.findById(id)
      .populate('senderId', 'username avatar');

    res.status(200).json({
      success: true,
      message: 'Message updated successfully',
      data: updatedMessage
    });
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update message',
      error: error.message
    });
  }
};

// Delete message
exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    await Message.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message',
      error: error.message
    });
  }
};

// Mark message as read
exports.markMessageAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    await message.markAsRead();

    res.status(200).json({
      success: true,
      message: 'Message marked as read',
      data: message
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark message as read',
      error: error.message
    });
  }
};

// Get message count by room
exports.getMessageCountByRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const count = await Message.countByRoom(roomId);

    res.status(200).json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Error getting message count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get message count',
      error: error.message
    });
  }
};

// Search messages in a room
exports.searchMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { query, limit = 20 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const messages = await Message.find({
      roomId,
      content: { $regex: query, $options: 'i' }
    })
      .populate('senderId', 'username avatar')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search messages',
      error: error.message
    });
  }
};
