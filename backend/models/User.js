const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 20
  },
  avatar: {
    type: String,
    default: '👤',
    required: true
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    default: null
  },
  socketId: {
    type: String,
    default: null
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  isTyping: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
userSchema.index({ username: 1 });
userSchema.index({ roomId: 1 });
userSchema.index({ socketId: 1 });

// Method to update online status
userSchema.methods.updateOnlineStatus = function(isOnline, socketId = null) {
  this.isOnline = isOnline;
  this.socketId = socketId;
  this.lastSeen = new Date();
  return this.save();
};

// Method to update typing status
userSchema.methods.updateTypingStatus = function(isTyping) {
  this.isTyping = isTyping;
  return this.save();
};

// Method to assign to room
userSchema.methods.assignToRoom = function(roomId) {
  this.roomId = roomId;
  return this.save();
};

// Method to leave room
userSchema.methods.leaveRoom = function() {
  this.roomId = null;
  this.isTyping = false;
  return this.save();
};

// Static method to find user by socket ID
userSchema.statics.findBySocketId = function(socketId) {
  return this.findOne({ socketId });
};

// Static method to find users in room
userSchema.statics.findByRoomId = function(roomId) {
  return this.find({ roomId, isOnline: true });
};

// Virtual for user display name
userSchema.virtual('displayName').get(function() {
  return `${this.username} ${this.avatar}`;
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
