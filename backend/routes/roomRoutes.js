const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');

// GET /api/rooms - Get all rooms
router.get('/', roomController.getAllRooms);

// GET /api/rooms/:id - Get room by ID
router.get('/:id', roomController.getRoomById);

// POST /api/rooms/:id/join - Join a specific room
router.post('/:id/join', roomController.joinRoom);

// POST /api/rooms/:id/leave - Leave a room
router.post('/:id/leave', roomController.leaveRoom);

// POST /api/rooms/auto-assign - Auto-assign user to available room
router.post('/auto-assign', roomController.autoAssignRoom);

// POST /api/rooms/initialize - Initialize rooms (admin)
router.post('/initialize', roomController.initializeRooms);

module.exports = router;
