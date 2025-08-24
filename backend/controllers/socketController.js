const User = require('../models/User');
const Room = require('../models/Room');
const Message = require('../models/Message');

// Store active connections
const activeConnections = new Map();

const socketHandler = (io) => {
  io.on('connection', async (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Handle user joining with username
    socket.on('join-user', async (data) => {
      try {
        const { username, avatar } = data;
        
        if (!username) {
          socket.emit('error', { message: 'Username is required' });
          return;
        }

        // Create or find user
        let user = await User.findOne({ username });
        if (!user) {
          user = new User({
            username,
            avatar: avatar || '👤',
            socketId: socket.id,
            isOnline: true
          });
          await user.save();
        } else {
          // Update existing user
          user.socketId = socket.id;
          user.isOnline = true;
          user.lastSeen = new Date();
          await user.save();
        }

        // Store connection info
        activeConnections.set(socket.id, {
          userId: user._id,
          username: user.username,
          roomId: user.roomId
        });

        // Join user to their room if they have one
        if (user.roomId) {
          socket.join(user.roomId.toString());
          
          // Notify room members
          socket.to(user.roomId.toString()).emit('user-reconnected', {
            userId: user._id,
            username: user.username,
            avatar: user.avatar
          });
        }

        // Send user info back
        socket.emit('user-joined', {
          userId: user._id,
          username: user.username,
          avatar: user.avatar,
          roomId: user.roomId
        });

        // Emit updated room status to all clients
        emitRoomStatusUpdate(io);

      } catch (error) {
        console.error('Error in join-user:', error);
        socket.emit('error', { message: 'Failed to join user' });
      }
    });

    // Handle joining a room
    socket.on('join-room', async (data) => {
      try {
        const { roomId } = data;
        const connectionInfo = activeConnections.get(socket.id);
        
        if (!connectionInfo) {
          socket.emit('error', { message: 'User not authenticated' });
          return;
        }

        const { userId } = connectionInfo;
        const user = await User.findById(userId);
        
        if (!user) {
          socket.emit('error', { message: 'User not found' });
          return;
        }

        // Leave current room if any
        if (user.roomId) {
          socket.leave(user.roomId.toString());
          
          // Remove user from previous room
          const previousRoom = await Room.findById(user.roomId);
          if (previousRoom) {
            await previousRoom.removeUser(userId);
            
            // Notify room members
            socket.to(user.roomId.toString()).emit('user-left', {
              userId: user._id,
              username: user.username
            });
          }
        }

        // Join new room
        const room = await Room.findById(roomId);
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        if (!room.isAvailable()) {
          socket.emit('error', { message: 'Room is full' });
          return;
        }

        // Add user to room
        await room.addUser(userId);
        await user.assignToRoom(roomId);
        
        // Join socket room
        socket.join(roomId.toString());
        
        // Update connection info
        activeConnections.set(socket.id, {
          ...connectionInfo,
          roomId: roomId
        });

        // Create system message
        await Message.createSystemMessage(roomId, `${user.username} joined the room`);

        // Get room messages
        const messages = await Message.findByRoom(roomId, 50, 0);
        const chronologicalMessages = messages.reverse();

        // Notify room members
        socket.to(roomId.toString()).emit('user-joined-room', {
          userId: user._id,
          username: user.username,
          avatar: user.avatar
        });

        // Send room info and messages to user
        socket.emit('room-joined', {
          roomId: roomId,
          roomNumber: room.roomNumber,
          messages: chronologicalMessages
        });

        // Emit updated room status to all clients
        emitRoomStatusUpdate(io);

      } catch (error) {
        console.error('Error in join-room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Handle chat messages
    socket.on('chat-message', async (data) => {
      try {
        const { content } = data;
        const connectionInfo = activeConnections.get(socket.id);
        
        if (!connectionInfo || !connectionInfo.roomId) {
          socket.emit('error', { message: 'User not in a room' });
          return;
        }

        const { userId, roomId } = connectionInfo;
        const user = await User.findById(userId);
        
        if (!user) {
          socket.emit('error', { message: 'User not found' });
          return;
        }

        // Create message
        const message = new Message({
          roomId,
          senderId: userId,
          content: content.trim()
        });

        await message.save();

        // Populate sender info
        const populatedMessage = await Message.findById(message._id)
          .populate('senderId', 'username avatar');

        // Broadcast to room
        io.to(roomId.toString()).emit('new-message', populatedMessage);

      } catch (error) {
        console.error('Error in chat-message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing-start', async () => {
      try {
        const connectionInfo = activeConnections.get(socket.id);
        
        if (!connectionInfo || !connectionInfo.roomId) {
          return;
        }

        const { userId, roomId } = connectionInfo;
        const user = await User.findById(userId);
        
        if (user) {
          await user.updateTypingStatus(true);
          
          // Notify room members
          socket.to(roomId.toString()).emit('user-typing', {
            userId: user._id,
            username: user.username,
            isTyping: true
          });
        }

      } catch (error) {
        console.error('Error in typing-start:', error);
      }
    });

    socket.on('typing-stop', async () => {
      try {
        const connectionInfo = activeConnections.get(socket.id);
        
        if (!connectionInfo || !connectionInfo.roomId) {
          return;
        }

        const { userId, roomId } = connectionInfo;
        const user = await User.findById(userId);
        
        if (user) {
          await user.updateTypingStatus(false);
          
          // Notify room members
          socket.to(roomId.toString()).emit('user-typing', {
            userId: user._id,
            username: user.username,
            isTyping: false
          });
        }

      } catch (error) {
        console.error('Error in typing-stop:', error);
      }
    });

    // Handle leaving room
    socket.on('leave-room', async () => {
      try {
        const connectionInfo = activeConnections.get(socket.id);
        
        if (!connectionInfo || !connectionInfo.roomId) {
          return;
        }

        const { userId, roomId } = connectionInfo;
        const user = await User.findById(userId);
        
        if (user) {
          // Leave socket room
          socket.leave(roomId.toString());
          
          // Remove user from room
          const room = await Room.findById(roomId);
          if (room) {
            await room.removeUser(userId);
          }
          
          await user.leaveRoom();
          
          // Create system message
          await Message.createSystemMessage(roomId, `${user.username} left the room`);
          
          // Notify room members
          socket.to(roomId.toString()).emit('user-left', {
            userId: user._id,
            username: user.username
          });
          
          // Update connection info
          activeConnections.set(socket.id, {
            ...connectionInfo,
            roomId: null
          });
          
          // Emit updated room status to all clients
          emitRoomStatusUpdate(io);
        }

      } catch (error) {
        console.error('Error in leave-room:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      try {
        console.log(`User disconnected: ${socket.id}`);
        
        const connectionInfo = activeConnections.get(socket.id);
        if (connectionInfo) {
          const { userId, roomId } = connectionInfo;
          
          if (userId) {
            const user = await User.findById(userId);
            if (user) {
              // Update user status
              await user.updateOnlineStatus(false);
              
              // Remove from room if in one
              if (roomId) {
                const room = await Room.findById(roomId);
                if (room) {
                  await room.removeUser(userId);
                  
                  // Create system message
                  await Message.createSystemMessage(roomId, `${user.username} disconnected`);
                  
                  // Notify room members
                  socket.to(roomId.toString()).emit('user-disconnected', {
                    userId: user._id,
                    username: user.username
                  });
                }
                
                await user.leaveRoom();
              }
            }
          }
          
          // Remove connection info
          activeConnections.delete(socket.id);
          
          // Emit updated room status to all clients
          emitRoomStatusUpdate(io);
        }

      } catch (error) {
        console.error('Error in disconnect:', error);
      }
    });

    // Handle room status requests
    socket.on('get-room-status', async () => {
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
          } : null
        }));

        socket.emit('room-status-update', formattedRooms);

      } catch (error) {
        console.error('Error getting room status:', error);
        socket.emit('error', { message: 'Failed to get room status' });
      }
    });
  });
};

// Helper function to emit room status updates
const emitRoomStatusUpdate = async (io) => {
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
      } : null
    }));

    io.emit('room-status-update', formattedRooms);

  } catch (error) {
    console.error('Error emitting room status update:', error);
  }
};

module.exports = socketHandler;
