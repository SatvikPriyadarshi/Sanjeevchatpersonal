const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

console.log("🚀 Starting Chat Application Server...");
console.log("📁 Loading environment variables...");
require("dotenv").config();
console.log("✅ Environment variables loaded");
console.log("");

const app = express();
const server = http.createServer(app);
// CORS configuration
const corsOrigins = ["http://localhost:3000", "http://127.0.0.1:3000"];

// Add environment CORS origin if specified
if (process.env.CORS_ORIGIN) {
  corsOrigins.push(process.env.CORS_ORIGIN);
}

// Add environment CORS origin if specified
if (process.env.CORS_ORIGIN) {
  corsOrigins.push(process.env.CORS_ORIGIN);
}

const io = socketIo(server, {
  cors: {
    origin: corsOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
console.log("🔍 Attempting to connect to MongoDB...");
console.log("📋 Environment Variables:");
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'NOT SET'}`);
console.log(`   PORT: ${process.env.PORT || 'NOT SET (default: 5000)'}`);
console.log(`   HOST: ${process.env.HOST || 'NOT SET (default: 0.0.0.0)'}`);
console.log(`   CORS_ORIGIN: ${process.env.CORS_ORIGIN || 'NOT SET'}`);
console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? 'SET (length: ' + process.env.JWT_SECRET.length + ')' : 'NOT SET'}`);
console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? 'SET (database: ' + process.env.MONGODB_URI.split('/').pop().split('?')[0] + ')' : 'NOT SET'}`);
console.log("");

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("✅ Successfully connected to MongoDB!");
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);
    console.log(`📡 Port: ${mongoose.connection.port}`);
    console.log(`🔗 Connection State: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Not Connected'}`);
    console.log("");
    // Initialize rooms on startup
    const Room = require("./models/Room");
    await Room.initializeRooms();

    // Fix any inconsistent room states
    console.log("Checking for inconsistent room states...");
    const rooms = await Room.find();
    for (const room of rooms) {
      const userCount = (room.user1 ? 1 : 0) + (room.user2 ? 1 : 0);
      let expectedStatus = "available";
      if (userCount === 1) expectedStatus = "occupied";
      if (userCount === 2) expectedStatus = "full";

      if (room.status !== expectedStatus) {
        console.log(
          `Fixing room ${room.roomNumber}: ${room.status} -> ${expectedStatus}`
        );
        room.status = expectedStatus;
        await room.save();
      }
    }
    console.log("Room state cleanup completed");

    // Clean up duplicate users
    console.log("Checking for duplicate users...");
    const User = require("./models/User");

    // Find all usernames that have duplicates
    const duplicates = await User.aggregate([
      {
        $group: {
          _id: "$username",
          count: { $sum: 1 },
          users: {
            $push: { id: "$_id", lastSeen: "$lastSeen", roomId: "$roomId" },
          },
        },
      },
      {
        $match: { count: { $gt: 1 } },
      },
    ]);

    for (const duplicate of duplicates) {
      console.log(
        `Found ${duplicate.count} users with username: ${duplicate._id}`
      );

      // Sort by lastSeen (most recent first)
      const sortedUsers = duplicate.users.sort(
        (a, b) => new Date(b.lastSeen || 0) - new Date(a.lastSeen || 0)
      );

      // Keep the most recent user, remove the rest
      const keepUser = sortedUsers[0];
      const removeUsers = sortedUsers.slice(1);

      console.log(
        `Keeping user ${keepUser.id}, removing ${removeUsers.length} duplicates`
      );

      // Remove duplicate users from rooms first
      for (const userToRemove of removeUsers) {
        if (userToRemove.roomId) {
          const room = await Room.findById(userToRemove.roomId);
          if (room) {
            await room.removeUser(userToRemove.id);
            console.log(
              `Removed user ${userToRemove.id} from room ${room.roomNumber}`
            );
          }
        }

        // Delete the duplicate user
        await User.findByIdAndDelete(userToRemove.id);
        console.log(`Deleted duplicate user ${userToRemove.id}`);
      }
    }

    console.log("Duplicate user cleanup completed");
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// Import routes
const roomRoutes = require("./routes/roomRoutes");
const messageRoutes = require("./routes/messageRoutes");
const userRoutes = require("./routes/userRoutes");

// Use routes
app.use("/api/rooms", roomRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);

// Socket.IO connection handling
const socketHandler = require("./controllers/socketController");
socketHandler(io);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";
server.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});

module.exports = { app, server, io };
