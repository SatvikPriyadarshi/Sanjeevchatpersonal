const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

// POST /api/messages - Create a new message
router.post('/', messageController.createMessage);

// GET /api/messages/room/:roomId - Get messages by room ID
router.get('/room/:roomId', messageController.getMessagesByRoom);

// GET /api/messages/:id - Get message by ID
router.get('/:id', messageController.getMessageById);

// PUT /api/messages/:id - Update message
router.put('/:id', messageController.updateMessage);

// DELETE /api/messages/:id - Delete message
router.delete('/:id', messageController.deleteMessage);

// PUT /api/messages/:id/read - Mark message as read
router.put('/:id/read', messageController.markMessageAsRead);

// GET /api/messages/room/:roomId/count - Get message count by room
router.get('/room/:roomId/count', messageController.getMessageCountByRoom);

// GET /api/messages/room/:roomId/search - Search messages in a room
router.get('/room/:roomId/search', messageController.searchMessages);

module.exports = router;
