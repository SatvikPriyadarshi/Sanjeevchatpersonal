const User = require('../models/User');
const Room = require('../models/Room');
const Message = require('../models/Message');

// Store active connections
const activeConnections = new Map();

const socketHandler = (io) => {
  io.on('connection', async (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    // Handle user joining with username
    socket.on('join-user', async (data) => {
      try {
        const { username, avatar } = data;
        
        if (!username) {
          socket.emit('join-user-error', { message: 'Username is required' });
          return;
        }

        // Create or find user - always use the most recent user with this username (case-insensitive)
        let user = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } }).sort({ lastSeen: -1 });
        if (!user) {
          console.log('🆕 Creating new user:', username);
          user = new User({
            username,
            avatar: avatar || 'avt1',
            socketId: socket.id,
            isOnline: true
          });
          await user.save();
        } else {
          console.log('👤 Found existing user:', username, 'ID:', user._id.toString());
          // Update existing user
          user.socketId = socket.id;
          user.isOnline = true;
          user.lastSeen = new Date();
          if (avatar) {
            user.avatar = avatar; // Update avatar if provided
          }
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
        socket.emit('join-user-error', { message: 'Failed to join user' });
      }
    });

    // Handle joining a room
    socket.on('join-room', async (data) => {
      try {
        const { roomId } = data; // This is actually roomNumber from frontend
        const connectionInfo = activeConnections.get(socket.id);
        
        if (!connectionInfo) {
          socket.emit('join-room-error', { message: 'User not authenticated' });
          return;
        }

        const { userId } = connectionInfo;
        const user = await User.findById(userId);
        
        if (!user) {
          socket.emit('join-room-error', { message: 'User not found' });
          return;
        }

        // Find room by room number
        const room = await Room.findOne({ roomNumber: roomId });
        if (!room) {
          socket.emit('join-room-error', { message: 'Room not found' });
          return;
        }

        // Check if user is already in the requested room
        if (user.roomId && user.roomId.toString() === room._id.toString()) {
          console.log('👤 User already in room, just updating socket connection');
          console.log('🔍 User current room:', user.roomId.toString(), 'Requested room:', room._id.toString());
          
          // Just join the socket room and update connection info
          socket.join(room._id.toString());
          console.log('🔗 Socket', socket.id, 'rejoined room:', room._id.toString());
          
          const updatedConnectionInfo = {
            ...connectionInfo,
            roomId: room._id
          };
          activeConnections.set(socket.id, updatedConnectionInfo);
          
          // Get room messages
          const messages = await Message.findByRoom(room._id, 50, 0);
          const chronologicalMessages = messages.reverse();

          // Send room info and messages to user
          const roomData = {
            roomId: room._id,
            roomNumber: room.roomNumber,
            messages: chronologicalMessages
          };
          
          console.log('📤 Sending room-joined event to user (rejoin):', user.username);
          socket.emit('room-joined', roomData);
          
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

        console.log('🏠 Room status check:', {
          roomNumber: room.roomNumber,
          status: room.status,
          user1: room.user1?.toString(),
          user2: room.user2?.toString(),
          currentUserId: userId.toString(),
          isAvailable: room.isAvailable()
        });

        // Check if user is already in this room as user1 or user2
        const isUserInRoom = (room.user1 && room.user1.toString() === userId.toString()) || 
                            (room.user2 && room.user2.toString() === userId.toString());
        
        console.log('🔍 User room check:', {
          userId: userId.toString(),
          roomUser1: room.user1?.toString(),
          roomUser2: room.user2?.toString(),
          isUserInRoom,
          userAssignedRoom: user.roomId?.toString(),
          currentRoom: room._id.toString()
        });
        
        // Fix inconsistent room state: if user1 is null but user2 exists and status is full
        if (!room.user1 && room.user2 && room.status === 'full') {
          console.log('🔧 Fixing inconsistent room state: user1 is null but room is marked as full');
          room.status = 'occupied'; // Should be occupied, not full
          await room.save();
        }
        
        // If user is assigned to this room but not actually in the room slots, fix it
        if (user.roomId && user.roomId.toString() === room._id.toString() && !isUserInRoom) {
          console.log('🔧 User is assigned to room but not in room slots, fixing...');
          // Clear the user's room assignment and let them rejoin properly
          user.roomId = null;
          await user.save();
        }
        
        // Check if room has space (either available or has only 1 user)
        const hasSpace = room.status === 'available' || 
                        (room.status === 'occupied' && (!room.user1 || !room.user2)) ||
                        isUserInRoom;
        
        if (isUserInRoom) {
          console.log('👤 User is already in this room, allowing rejoin');
        } else if (!hasSpace) {
          console.log('❌ Room is truly full:', {
            status: room.status,
            user1: room.user1 ? 'occupied' : 'free',
            user2: room.user2 ? 'occupied' : 'free'
          });
          socket.emit('join-room-error', { message: 'Room is full' });
          return;
        }

        // Add user to room
        console.log('🏠 Adding user to room...');
        console.log('🔍 Before adding user - Room state:', {
          user1: room.user1,
          user2: room.user2,
          status: room.status
        });
        
        await room.addUser(userId);
        
        console.log('🔍 After adding user - Room state:', {
          user1: room.user1,
          user2: room.user2,
          status: room.status
        });
        
        console.log('👤 Assigning user to room...');
        await user.assignToRoom(room._id);
        console.log('✅ User assigned to room successfully');
        
        // Join socket room
        socket.join(room._id.toString());
        console.log('🔗 Socket', socket.id, 'joined room:', room._id.toString());
        
        // Update connection info
        const updatedConnectionInfo = {
          ...connectionInfo,
          roomId: room._id
        };
        activeConnections.set(socket.id, updatedConnectionInfo);
        
        console.log('🔄 Updated connection info for socket', socket.id, ':', updatedConnectionInfo);
        console.log('📊 Active connections:', Array.from(activeConnections.entries()).map(([socketId, info]) => ({
          socketId,
          username: info.username,
          roomId: info.roomId?.toString()
        })));

        // Create system message
        await Message.createSystemMessage(room._id, `${user.username} joined the room`);

        // Get room messages
        const messages = await Message.findByRoom(room._id, 50, 0);
        const chronologicalMessages = messages.reverse();

        // Notify room members
        const userJoinedData = {
          userId: user._id,
          username: user.username,
          avatar: user.avatar
        };
        
        console.log('📤 Broadcasting user-joined-room to room:', room._id.toString());
        console.log('👤 User joined data:', userJoinedData);
        
        socket.to(room._id.toString()).emit('user-joined-room', userJoinedData);

        // Send room info and messages to user
        const roomData = {
          roomId: room._id,
          roomNumber: room.roomNumber,
          messages: chronologicalMessages
        };
        
        console.log('📤 Sending room-joined event to user:', user.username);
        console.log('📝 Room data:', roomData);
        
        socket.emit('room-joined', roomData);

        // Emit updated room status to all clients
        emitRoomStatusUpdate(io);

      } catch (error) {
        console.error('Error in join-room:', error);
        socket.emit('join-room-error', { message: 'Failed to join room' });
      }
    });

    // Handle chat messages
    socket.on('chat-message', async (data) => {
      try {
        console.log('📨 Received chat-message:', data);
        const { content, replyTo } = data;
        const connectionInfo = activeConnections.get(socket.id);
        
        console.log('🔍 Connection info for socket', socket.id, ':', connectionInfo);
        console.log('🔍 All active connections:', Array.from(activeConnections.entries()));
        
        if (!connectionInfo) {
          console.log('❌ No connection info found for socket');
          socket.emit('error', { message: 'User not authenticated' });
          return;
        }
        
        if (!connectionInfo.roomId) {
          console.log('❌ User not in a room. Connection info:', connectionInfo);
          // Try to get fresh user data from database
          const user = await User.findById(connectionInfo.userId);
          if (user && user.roomId) {
            console.log('🔄 Found room in user data, updating connection info');
            connectionInfo.roomId = user.roomId;
            activeConnections.set(socket.id, connectionInfo);
          } else {
            socket.emit('error', { message: 'Please join a room first' });
            return;
          }
        }

        let { userId, roomId } = connectionInfo;
        console.log('👤 User ID:', userId, 'Room ID from connection:', roomId);
        
        // If no roomId in connection info, get it from the database
        if (!roomId) {
          const user = await User.findById(userId);
          if (user && user.roomId) {
            roomId = user.roomId;
            console.log('🔄 Got roomId from database:', roomId);
            // Update connection info
            connectionInfo.roomId = roomId;
            activeConnections.set(socket.id, connectionInfo);
          }
        }
        
        const user = await User.findById(userId);
        
        if (!user) {
          console.log('❌ User not found in database');
          socket.emit('error', { message: 'User not found' });
          return;
        }

        console.log('✅ User found:', user.username);

        // Ensure we have a valid roomId
        if (!roomId) {
          console.log('❌ Still no roomId available');
          socket.emit('error', { message: 'Please join a room first' });
          return;
        }

        // Create message
        const message = new Message({
          roomId,
          senderId: userId,
          content: content.trim(),
          replyTo: replyTo || null
        });

        console.log('💾 Saving message:', message);
        await message.save();
        console.log('✅ Message saved with ID:', message._id);

        // Populate sender info
        const populatedMessage = await Message.findById(message._id)
          .populate('senderId', 'username avatar');

        console.log('📤 Broadcasting message to room:', roomId.toString());
        console.log('📝 Populated message:', populatedMessage);
        
        // Check which sockets are in this room
        const socketsInRoom = io.sockets.adapter.rooms.get(roomId.toString());
        console.log('🔍 Sockets in room', roomId.toString(), ':', socketsInRoom ? Array.from(socketsInRoom) : 'none');

        // Broadcast to room
        io.to(roomId.toString()).emit('new-message', populatedMessage);
        console.log('✅ Message broadcasted successfully');

      } catch (error) {
        console.error('❌ Error in chat-message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing-start', async () => {
      try {
        console.log('⌨️ Typing start received from socket:', socket.id);
        const connectionInfo = activeConnections.get(socket.id);
        
        if (!connectionInfo || !connectionInfo.roomId) {
          console.log('❌ No connection info or room for typing start');
          return;
        }

        const { userId, roomId } = connectionInfo;
        console.log('👤 Typing start - User:', userId, 'Room:', roomId);
        
        const user = await User.findById(userId);
        
        if (user) {
          console.log('✅ User found for typing:', user.username);
          await user.updateTypingStatus(true);
          
          const typingData = {
            userId: user._id,
            username: user.username,
            isTyping: true
          };
          
          console.log('📤 Broadcasting typing start to room:', roomId.toString());
          console.log('📝 Typing data:', typingData);
          
          // Notify room members
          socket.to(roomId.toString()).emit('user-typing', typingData);
          console.log('✅ Typing start broadcasted');
        } else {
          console.log('❌ User not found for typing start');
        }

      } catch (error) {
        console.error('❌ Error in typing-start:', error);
      }
    });

    socket.on('typing-stop', async () => {
      try {
        console.log('⌨️ Typing stop received from socket:', socket.id);
        const connectionInfo = activeConnections.get(socket.id);
        
        if (!connectionInfo || !connectionInfo.roomId) {
          console.log('❌ No connection info or room for typing stop');
          return;
        }

        const { userId, roomId } = connectionInfo;
        console.log('👤 Typing stop - User:', userId, 'Room:', roomId);
        
        const user = await User.findById(userId);
        
        if (user) {
          console.log('✅ User found for typing stop:', user.username);
          await user.updateTypingStatus(false);
          
          const typingData = {
            userId: user._id,
            username: user.username,
            isTyping: false
          };
          
          console.log('📤 Broadcasting typing stop to room:', roomId.toString());
          console.log('📝 Typing data:', typingData);
          
          // Notify room members
          socket.to(roomId.toString()).emit('user-typing', typingData);
          console.log('✅ Typing stop broadcasted');
        } else {
          console.log('❌ User not found for typing stop');
        }

      } catch (error) {
        console.error('❌ Error in typing-stop:', error);
      }
    });

    // Handle message editing
    socket.on('edit-message', async (data) => {
      try {
        const { messageId, newContent } = data;
        const connectionInfo = activeConnections.get(socket.id);
        
        if (!connectionInfo) {
          socket.emit('error', { message: 'User not authenticated' });
          return;
        }

        const { userId } = connectionInfo;
        
        // Find the message and verify ownership
        const message = await Message.findById(messageId);
        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        if (message.senderId.toString() !== userId.toString()) {
          socket.emit('error', { message: 'You can only edit your own messages' });
          return;
        }

        // Update the message
        message.content = newContent.trim();
        message.isEdited = true;
        message.editedAt = new Date();
        await message.save();

        // Populate sender info
        const populatedMessage = await Message.findById(message._id)
          .populate('senderId', 'username avatar');

        // Broadcast the updated message to the room
        io.to(message.roomId.toString()).emit('message-edited', populatedMessage);
        console.log('✅ Message edited successfully');

      } catch (error) {
        console.error('❌ Error editing message:', error);
        socket.emit('error', { message: 'Failed to edit message' });
      }
    });

    // Handle message deletion
    socket.on('delete-message', async (data) => {
      try {
        const { messageId } = data;
        const connectionInfo = activeConnections.get(socket.id);
        
        if (!connectionInfo) {
          socket.emit('error', { message: 'User not authenticated' });
          return;
        }

        const { userId } = connectionInfo;
        
        // Find the message and verify ownership
        const message = await Message.findById(messageId);
        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        if (message.senderId.toString() !== userId.toString()) {
          socket.emit('error', { message: 'You can only delete your own messages' });
          return;
        }

        const roomId = message.roomId;
        
        // Delete the message
        await Message.findByIdAndDelete(messageId);

        // Broadcast the deletion to the room
        io.to(roomId.toString()).emit('message-deleted', { messageId });
        console.log('✅ Message deleted successfully');

      } catch (error) {
        console.error('❌ Error deleting message:', error);
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    // Handle clearing all messages
    socket.on('clear-all-messages', async (data) => {
      try {
        const { roomId } = data;
        const connectionInfo = activeConnections.get(socket.id);
        
        if (!connectionInfo) {
          socket.emit('error', { message: 'User not authenticated' });
          return;
        }

        // Verify user is in the room
        const room = await Room.findOne({ roomNumber: roomId });
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        const { userId } = connectionInfo;
        const isUserInRoom = (room.user1 && room.user1.toString() === userId.toString()) || 
                            (room.user2 && room.user2.toString() === userId.toString());

        if (!isUserInRoom) {
          socket.emit('error', { message: 'You must be in the room to clear messages' });
          return;
        }

        // Delete all messages in the room
        await Message.deleteMany({ roomId: room._id });

        // Create a system message about clearing
        const user = await User.findById(userId);
        await Message.createSystemMessage(room._id, `${user.username} cleared all messages`);

        // Get the new system message
        const messages = await Message.findByRoom(room._id, 50, 0);
        const chronologicalMessages = messages.reverse();

        // Broadcast to all users in the room
        io.to(room._id.toString()).emit('messages-cleared', { messages: chronologicalMessages });
        console.log('✅ All messages cleared successfully');

      } catch (error) {
        console.error('❌ Error clearing messages:', error);
        socket.emit('error', { message: 'Failed to clear messages' });
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
          const updatedConnectionInfo = {
            ...connectionInfo,
            roomId: null
          };
          activeConnections.set(socket.id, updatedConnectionInfo);
          console.log('🔄 Updated connection info after leaving room:', updatedConnectionInfo);
          
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

    // Handle message reactions
    socket.on('message-reaction', async (data) => {
      try {
        const { messageId, reaction, action } = data;
        const connectionInfo = activeConnections.get(socket.id);
        
        if (!connectionInfo) {
          socket.emit('error', { message: 'User not authenticated' });
          return;
        }

        const { userId, roomId } = connectionInfo;
        
        // Find the message
        const message = await Message.findById(messageId);
        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        // Initialize reactions if not exists
        if (!message.reactions) {
          message.reactions = new Map();
        }

        // Get current reaction count
        const currentCount = message.reactions.get(reaction) || 0;
        
        if (action === 'add') {
          message.reactions.set(reaction, currentCount + 1);
        } else if (action === 'remove' && currentCount > 0) {
          message.reactions.set(reaction, currentCount - 1);
        }

        await message.save();

        // Broadcast the reaction update to the room
        io.to(roomId.toString()).emit('message-reaction-update', {
          messageId,
          reactions: Object.fromEntries(message.reactions)
        });

        console.log('✅ Message reaction updated successfully');

      } catch (error) {
        console.error('❌ Error handling message reaction:', error);
        socket.emit('error', { message: 'Failed to update reaction' });
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

        socket.emit('room-status-response', formattedRooms);

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

// Cleanup function to remove duplicate users
const cleanupDuplicateUsers = async () => {
  try {
    console.log('Checking for duplicate users...');
    
    // Find all usernames that have duplicates
    const duplicates = await User.aggregate([
      {
        $group: {
          _id: '$username',
          count: { $sum: 1 },
          users: { $push: { id: '$_id', lastSeen: '$lastSeen', roomId: '$roomId' } }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);
    
    for (const duplicate of duplicates) {
      console.log(`Found ${duplicate.count} users with username: ${duplicate._id}`);
      
      // Sort by lastSeen (most recent first)
      const sortedUsers = duplicate.users.sort((a, b) => 
        new Date(b.lastSeen || 0) - new Date(a.lastSeen || 0)
      );
      
      // Keep the most recent user, remove the rest
      const keepUser = sortedUsers[0];
      const removeUsers = sortedUsers.slice(1);
      
      console.log(`Keeping user ${keepUser.id}, removing ${removeUsers.length} duplicates`);
      
      // Remove duplicate users from rooms first
      for (const userToRemove of removeUsers) {
        if (userToRemove.roomId) {
          const room = await Room.findById(userToRemove.roomId);
          if (room) {
            await room.removeUser(userToRemove.id);
            console.log(`Removed user ${userToRemove.id} from room ${room.roomNumber}`);
          }
        }
        
        // Delete the duplicate user
        await User.findByIdAndDelete(userToRemove.id);
        console.log(`Deleted duplicate user ${userToRemove.id}`);
      }
    }
    
    console.log('Duplicate user cleanup completed');
  } catch (error) {
    console.error('Error during duplicate user cleanup:', error);
  }
};

module.exports = socketHandler;
