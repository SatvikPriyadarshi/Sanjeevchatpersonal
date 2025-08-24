# ChatApp - Real-time Chat Application

A modern, real-time chat application built with React.js, Node.js, Socket.IO, and MongoDB. Features private room-based messaging with user avatars, typing indicators, and message persistence.

## 🚀 Features

- **5 Private Chat Rooms**: Maximum 2 users per room for private conversations
- **Real-time Messaging**: Instant message delivery using Socket.IO
- **User Avatars**: Customizable emoji-based avatars
- **Typing Indicators**: See when someone is typing in real-time
- **Message Timestamps**: Formatted timestamps for all messages
- **Message Persistence**: All messages saved to MongoDB database
- **Room Management**: Automatic room assignment and status updates
- **Responsive Design**: Modern UI that works on all devices
- **User Status**: Online/offline indicators and last seen timestamps

## 🏗️ Architecture

### Backend (Node.js + Express)
- **MVC Pattern**: Clean separation of concerns
- **Socket.IO**: Real-time bidirectional communication
- **MongoDB**: Message persistence and user management
- **RESTful API**: REST endpoints for room and user management
- **Security**: Rate limiting, CORS, and input validation

### Frontend (React.js)
- **Context API**: State management for chat and socket connections
- **Styled Components**: Modern CSS-in-JS styling
- **React Router**: Client-side routing
- **Responsive Design**: Mobile-first approach

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

## 🛠️ Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd chatapp
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chat_app
JWT_SECRET=your_jwt_secret_key_here
CORS_ORIGIN=http://localhost:3000
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

### 4. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# Start MongoDB service
mongod
```

### 5. Initialize Rooms
Start the backend server and initialize the rooms:
```bash
cd backend
npm run dev
```

In a new terminal, make a POST request to initialize rooms:
```bash
curl -X POST http://localhost:5000/api/rooms/initialize
```

### 6. Start the Application

**Backend (Terminal 1):**
```bash
cd backend
npm run dev
```

**Frontend (Terminal 2):**
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## 🎯 Usage

### Getting Started
1. **Login**: Enter a username and select an avatar
2. **Room Selection**: View available rooms and their current status
3. **Join Room**: Click on an available room to join
4. **Start Chatting**: Begin private conversation with your room partner

### Room System
- **Room 1-5**: 5 total rooms available
- **Maximum 2 users per room**: Ensures private conversations
- **Automatic Assignment**: Users are assigned to first available room
- **Room Status**: Available, Occupied (1 user), Full (2 users)

### Features
- **Real-time Messages**: Instant delivery with Socket.IO
- **Typing Indicators**: See when someone is typing
- **User Avatars**: Emoji-based avatar system
- **Message History**: Persistent chat history in database
- **System Messages**: Automatic notifications for user join/leave

## 🔧 API Endpoints

### Rooms
- `GET /api/rooms` - Get all rooms
- `GET /api/rooms/:id` - Get room by ID
- `POST /api/rooms/:id/join` - Join a room
- `POST /api/rooms/:id/leave` - Leave a room
- `POST /api/rooms/auto-assign` - Auto-assign to available room

### Users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id/online-status` - Update online status
- `PUT /api/users/:id/typing-status` - Update typing status

### Messages
- `POST /api/messages` - Create message
- `GET /api/messages/room/:roomId` - Get messages by room
- `PUT /api/messages/:id` - Update message
- `DELETE /api/messages/:id` - Delete message

## 🗄️ Database Schema

### Collections

**Rooms**
```javascript
{
  roomNumber: Number,      // 1-5
  status: String,          // 'available', 'occupied', 'full'
  user1: ObjectId,         // Reference to User
  user2: ObjectId,         // Reference to User
  lastActivity: Date
}
```

**Users**
```javascript
{
  username: String,
  avatar: String,           // Emoji
  roomId: ObjectId,        // Reference to Room
  socketId: String,
  isOnline: Boolean,
  isTyping: Boolean,
  lastSeen: Date
}
```

**Messages**
```javascript
{
  roomId: ObjectId,        // Reference to Room
  senderId: ObjectId,      // Reference to User
  content: String,
  messageType: String,     // 'text' or 'system'
  timestamp: Date,
  isRead: Boolean
}
```

## 🚀 Deployment

### Backend Deployment
1. **Environment Variables**: Set production environment variables
2. **Database**: Use MongoDB Atlas or production MongoDB instance
3. **Platforms**: Deploy to Heroku, Railway, Render, or DigitalOcean

### Frontend Deployment
1. **Build**: Run `npm run build`
2. **Platforms**: Deploy to Netlify, Vercel, or GitHub Pages
3. **Environment**: Update backend URL in production

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🔒 Security Features

- **Input Validation**: All user inputs are validated and sanitized
- **Rate Limiting**: Prevents API abuse
- **CORS Configuration**: Secure cross-origin requests
- **Helmet**: Security headers for Express
- **MongoDB Injection Protection**: Mongoose prevents NoSQL injection

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Error**
- Ensure MongoDB is running
- Check connection string in `.env` file
- Verify MongoDB port (default: 27017)

**Socket.IO Connection Issues**
- Check CORS configuration
- Verify backend URL in frontend
- Ensure both servers are running

**Room Initialization**
- Run the initialize endpoint: `POST /api/rooms/initialize`
- Check MongoDB connection
- Verify backend server is running

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Socket.IO for real-time communication
- MongoDB for data persistence
- React.js for the frontend framework
- Express.js for the backend framework

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

---

**Happy Chatting! 🎉**
