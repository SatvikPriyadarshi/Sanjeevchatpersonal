const Room = require('../models/Room');
const User = require('../models/User');
const Message = require('../models/Message');

// Get all rooms with their current status
exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find()
      .populate('user1', 'username avatar isOnline')
      .populate('user2', 'username avatar isOnline')
      .sort({ roomNumber: 1 });

    const formattedRooms = rooms.map(room => ({
      id: room._id,
      roomNumber: room.roomNumber,
      status: room.status,
      user1: room.user1 ? {
        id: room.user1._id,
        username: room.user1.username,
        avatar: room.user1.avatar,
        isOnline: room.user1.isOnline
      } : null,
      user2: room.user2 ? {
        id: room.user2._id,
        username: room.user2.username,
        avatar: room.user2.avatar,
        isOnline: room.user2.isOnline
      } : null,
      lastActivity: room.lastActivity
    }));

    res.status(200).json({
      success: true,
      data: formattedRooms
    });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rooms',
      error: error.message
    });
  }
};

// Get room by ID with detailed information
exports.getRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await Room.findById(id)
      .populate('user1', 'username avatar isOnline lastSeen')
      .populate('user2', 'username avatar isOnline lastSeen');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    res.status(200).json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch room',
      error: error.message
    });
  }
};

// Join a specific room
exports.joinRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    if (!room.isAvailable()) {
      return res.status(400).json({
        success: false,
        message: 'Room is full'
      });
    }

    // Check if user is already in another room
    const existingUser = await User.findById(userId);
    if (existingUser && existingUser.roomId) {
      // Remove user from previous room
      const previousRoom = await Room.findById(existingUser.roomId);
      if (previousRoom) {
        await previousRoom.removeUser(userId);
      }
    }

    // Add user to new room
    await room.addUser(userId);
    
    // Update user's room assignment
    await User.findByIdAndUpdate(userId, { roomId: room._id });

    // Create system message for user joining
    await Message.createSystemMessage(room._id, 'Someone joined the room');

    const updatedRoom = await Room.findById(roomId)
      .populate('user1', 'username avatar isOnline')
      .populate('user2', 'username avatar isOnline');

    res.status(200).json({
      success: true,
      message: 'Successfully joined room',
      data: updatedRoom
    });
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join room',
      error: error.message
    });
  }
};

// Leave room
exports.leaveRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Remove user from room
    await room.removeUser(userId);
    
    // Update user's room assignment
    await User.findByIdAndUpdate(userId, { roomId: null });

    // Create system message for user leaving
    await Message.createSystemMessage(room._id, 'Someone left the room');

    const updatedRoom = await Room.findById(roomId)
      .populate('user1', 'username avatar isOnline')
      .populate('user2', 'username avatar isOnline');

    res.status(200).json({
      success: true,
      message: 'Successfully left room',
      data: updatedRoom
    });
  } catch (error) {
    console.error('Error leaving room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave room',
      error: error.message
    });
  }
};

// Auto-assign user to available room
exports.autoAssignRoom = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Find available room
    const availableRoom = await Room.findAvailableRoom();
    
    if (!availableRoom) {
      return res.status(400).json({
        success: false,
        message: 'No rooms available'
      });
    }

    // Check if user is already in another room
    const existingUser = await User.findById(userId);
    if (existingUser && existingUser.roomId) {
      // Remove user from previous room
      const previousRoom = await Room.findById(existingUser.roomId);
      if (previousRoom) {
        await previousRoom.removeUser(userId);
      }
    }

    // Add user to available room
    await availableRoom.addUser(userId);
    
    // Update user's room assignment
    await User.findByIdAndUpdate(userId, { roomId: availableRoom._id });

    // Create system message for user joining
    await Message.createSystemMessage(availableRoom._id, 'Someone joined the room');

    const updatedRoom = await Room.findById(availableRoom._id)
      .populate('user1', 'username avatar isOnline')
      .populate('user2', 'username avatar isOnline');

    res.status(200).json({
      success: true,
      message: 'Successfully assigned to room',
      data: updatedRoom
    });
  } catch (error) {
    console.error('Error auto-assigning room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to auto-assign room',
      error: error.message
    });
  }
};

// Initialize rooms (admin function)
exports.initializeRooms = async (req, res) => {
  try {
    await Room.initializeRooms();
    
    res.status(200).json({
      success: true,
      message: 'Rooms initialized successfully'
    });
  } catch (error) {
    console.error('Error initializing rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize rooms',
      error: error.message
    });
  }
};
