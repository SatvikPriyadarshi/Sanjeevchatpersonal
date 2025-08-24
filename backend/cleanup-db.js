const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/config.env' });

const User = require('./models/User');
const Room = require('./models/Room');
const Message = require('./models/Message');

async function cleanupDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    console.log('🧹 Starting database cleanup...');

    // 1. Clear all users
    console.log('Deleting all users...');
    const deletedUsers = await User.deleteMany({});
    console.log(`Deleted ${deletedUsers.deletedCount} users`);

    // 2. Reset all rooms
    console.log('Resetting all rooms...');
    const rooms = await Room.find({});
    for (const room of rooms) {
      room.user1 = null;
      room.user2 = null;
      room.status = 'available';
      room.lastActivity = new Date();
      await room.save();
      console.log(`Reset room ${room.roomNumber}`);
    }

    // 3. Clear all messages (optional - comment out if you want to keep chat history)
    console.log('Clearing all messages...');
    const deletedMessages = await Message.deleteMany({});
    console.log(`Deleted ${deletedMessages.deletedCount} messages`);

    console.log('✅ Database cleanup completed successfully!');
    console.log('You can now login with fresh usernames and join rooms.');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
}

cleanupDatabase();