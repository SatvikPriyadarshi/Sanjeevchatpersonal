import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000', {
      transports: ['websocket'],
      autoConnect: false
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
    });

    // User events
    newSocket.on('user-joined', (userData) => {
      console.log('User joined:', userData);
      setUser(userData);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Connect to server
  const connect = () => {
    if (socket && !isConnected) {
      socket.connect();
    }
  };

  // Disconnect from server
  const disconnect = () => {
    if (socket && isConnected) {
      socket.disconnect();
    }
  };

  // Join user with username
  const joinUser = (username, avatar) => {
    if (socket && isConnected) {
      socket.emit('join-user', { username, avatar });
    }
  };

  // Join a room
  const joinRoom = (roomId) => {
    if (socket && isConnected) {
      socket.emit('join-room', { roomId });
    }
  };

  // Leave room
  const leaveRoom = () => {
    if (socket && isConnected) {
      socket.emit('leave-room');
    }
  };

  // Send chat message
  const sendMessage = (content) => {
    if (socket && isConnected) {
      socket.emit('chat-message', { content });
    }
  };

  // Start typing indicator
  const startTyping = () => {
    if (socket && isConnected) {
      socket.emit('typing-start');
    }
  };

  // Stop typing indicator
  const stopTyping = () => {
    if (socket && isConnected) {
      socket.emit('typing-stop');
    }
  };

  // Get room status
  const getRoomStatus = () => {
    if (socket && isConnected) {
      socket.emit('get-room-status');
    }
  };

  const value = {
    socket,
    isConnected,
    user,
    connect,
    disconnect,
    joinUser,
    joinRoom,
    leaveRoom,
    sendMessage,
    startTyping,
    stopTyping,
    getRoomStatus
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
