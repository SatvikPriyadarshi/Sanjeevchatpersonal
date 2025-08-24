const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// POST /api/users - Create a new user
router.post('/', userController.createUser);

// GET /api/users/:id - Get user by ID
router.get('/:id', userController.getUserById);

// PUT /api/users/:id/online-status - Update user online status
router.put('/:id/online-status', userController.updateOnlineStatus);

// PUT /api/users/:id/typing-status - Update user typing status
router.put('/:id/typing-status', userController.updateTypingStatus);

// GET /api/users/online - Get all online users
router.get('/online', userController.getOnlineUsers);

// GET /api/users/room/:roomId - Get users in a specific room
router.get('/room/:roomId', userController.getUsersInRoom);

// DELETE /api/users/:id - Delete user
router.delete('/:id', userController.deleteUser);

// PUT /api/users/:id/avatar - Update user avatar
router.put('/:id/avatar', userController.updateAvatar);

module.exports = router;
