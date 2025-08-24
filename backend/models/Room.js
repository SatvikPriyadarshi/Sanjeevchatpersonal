const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber: {
    type: Number,
    required: true,
    unique: true,
    min: 1,
    max: 5
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'full'],
    default: 'available'
  },
  user1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  user2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
roomSchema.index({ roomNumber: 1 });
roomSchema.index({ status: 1 });

// Method to check if room is available
roomSchema.methods.isAvailable = function() {
  return this.status === 'available' || this.status === 'occupied';
};

// Method to add user to room
roomSchema.methods.addUser = function(userId) {
  if (!this.user1) {
    this.user1 = userId;
    this.status = 'occupied';
  } else if (!this.user2) {
    this.user2 = userId;
    this.status = 'full';
  }
  this.lastActivity = new Date();
  return this.save();
};

// Method to remove user from room
roomSchema.methods.removeUser = function(userId) {
  if (this.user1 && this.user1.toString() === userId.toString()) {
    this.user1 = null;
  } else if (this.user2 && this.user2.toString() === userId.toString()) {
    this.user2 = null;
  }
  
  // Update room status
  if (!this.user1 && !this.user2) {
    this.status = 'available';
  } else if (this.user1 && !this.user2) {
    this.status = 'occupied';
  }
  
  this.lastActivity = new Date();
  return this.save();
};

// Static method to find available room
roomSchema.statics.findAvailableRoom = function() {
  return this.findOne({
    $or: [
      { status: 'available' },
      { status: 'occupied' }
    ]
  }).sort({ roomNumber: 1 });
};

// Static method to initialize rooms
roomSchema.statics.initializeRooms = async function() {
  const roomCount = await this.countDocuments();
  if (roomCount === 0) {
    const rooms = [];
    for (let i = 1; i <= 5; i++) {
      rooms.push({
        roomNumber: i,
        status: 'available'
      });
    }
    await this.insertMany(rooms);
    console.log('Initialized 5 rooms');
  }
};

module.exports = mongoose.model('Room', roomSchema);
