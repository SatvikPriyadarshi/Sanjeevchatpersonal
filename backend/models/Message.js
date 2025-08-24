const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  messageType: {
    type: String,
    enum: ['text', 'system'],
    default: 'text'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
messageSchema.index({ roomId: 1, timestamp: -1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ createdAt: -1 });

// Method to mark as read
messageSchema.methods.markAsRead = function() {
  this.isRead = true;
  return this.save();
};

// Static method to find messages by room
messageSchema.statics.findByRoom = function(roomId, limit = 50, skip = 0) {
  return this.find({ roomId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip)
    .populate('senderId', 'username avatar')
    .lean();
};

// Static method to get message count by room
messageSchema.statics.countByRoom = function(roomId) {
  return this.countDocuments({ roomId });
};

// Static method to create system message
messageSchema.statics.createSystemMessage = function(roomId, content) {
  return this.create({
    roomId,
    content,
    messageType: 'system',
    senderId: null
  });
};

// Virtual for formatted timestamp
messageSchema.virtual('formattedTime').get(function() {
  const now = new Date();
  const messageTime = this.timestamp;
  const diffInHours = (now - messageTime) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    return messageTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  } else if (diffInHours < 48) {
    return 'Yesterday ' + messageTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  } else {
    return messageTime.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }) + ' ' + messageTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }
});

// Ensure virtual fields are serialized
messageSchema.set('toJSON', { virtuals: true });
messageSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Message', messageSchema);
