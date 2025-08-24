const User = require('../models/User');
const Room = require('../models/Room');

// Create a new user
exports.createUser = async (req, res) => {
  try {
    const { username, avatar } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // Generate random avatar if not provided
    const avatars = ['👤', '👨', '👩', '🧑', '👶', '👴', '👵', '👨‍💼', '👩‍💼', '🦸', '🦸‍♀️'];
    const randomAvatar = avatar || avatars[Math.floor(Math.random() * avatars.length)];

    const user = new User({
      username,
      avatar: randomAvatar
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).populate('roomId');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
};

// Update user online status
exports.updateOnlineStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isOnline, socketId } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.updateOnlineStatus(isOnline, socketId);

    res.status(200).json({
      success: true,
      message: 'Online status updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Error updating online status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update online status',
      error: error.message
    });
  }
};

// Update user typing status
exports.updateTypingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isTyping } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.updateTypingStatus(isTyping);

    res.status(200).json({
      success: true,
      message: 'Typing status updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Error updating typing status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update typing status',
      error: error.message
    });
  }
};

// Get all online users
exports.getOnlineUsers = async (req, res) => {
  try {
    const users = await User.find({ isOnline: true })
      .select('username avatar roomId lastSeen')
      .populate('roomId', 'roomNumber status');

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching online users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch online users',
      error: error.message
    });
  }
};

// Get users in a specific room
exports.getUsersInRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const users = await User.findByRoomId(roomId)
      .select('username avatar isOnline lastSeen isTyping');

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users in room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users in room',
      error: error.message
    });
  }
};

// Delete user (cleanup when user disconnects)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If user is in a room, remove them from it
    if (user.roomId) {
      const room = await Room.findById(user.roomId);
      if (room) {
        await room.removeUser(id);
      }
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

// Update user avatar
exports.updateAvatar = async (req, res) => {
  try {
    const { id } = req.params;
    const { avatar } = req.body;

    if (!avatar) {
      return res.status(400).json({
        success: false,
        message: 'Avatar is required'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { avatar },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Avatar updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Error updating avatar:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update avatar',
      error: error.message
    });
  }
};
