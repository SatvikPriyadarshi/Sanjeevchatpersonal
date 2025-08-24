import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useSocket } from './SocketContext';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

// Action types
const ACTIONS = {
  SET_ROOMS: 'SET_ROOMS',
  SET_CURRENT_ROOM: 'SET_CURRENT_ROOM',
  ADD_MESSAGE: 'ADD_MESSAGE',
  SET_MESSAGES: 'SET_MESSAGES',
  SET_TYPING_USERS: 'SET_TYPING_USERS',
  ADD_TYPING_USER: 'ADD_TYPING_USER',
  REMOVE_TYPING_USER: 'REMOVE_TYPING_USER',
  SET_ROOM_USERS: 'SET_ROOM_USERS',
  UPDATE_ROOM_STATUS: 'UPDATE_ROOM_STATUS',
  CLEAR_CHAT: 'CLEAR_CHAT'
};

// Initial state
const initialState = {
  rooms: [],
  currentRoom: null,
  messages: [],
  typingUsers: [],
  roomUsers: [],
  isLoading: false,
  error: null
};

// Reducer function
const chatReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_ROOMS:
      return {
        ...state,
        rooms: action.payload
      };
    
    case ACTIONS.SET_CURRENT_ROOM:
      return {
        ...state,
        currentRoom: action.payload
      };
    
    case ACTIONS.ADD_MESSAGE:
      return {
        ...state,
        messages: [...state.messages, action.payload]
      };
    
    case ACTIONS.SET_MESSAGES:
      return {
        ...state,
        messages: action.payload
      };
    
    case ACTIONS.SET_TYPING_USERS:
      return {
        ...state,
        typingUsers: action.payload
      };
    
    case ACTIONS.ADD_TYPING_USER:
      return {
        ...state,
        typingUsers: [...state.typingUsers.filter(user => user.userId !== action.payload.userId), action.payload]
      };
    
    case ACTIONS.REMOVE_TYPING_USER:
      return {
        ...state,
        typingUsers: state.typingUsers.filter(user => user.userId !== action.payload)
      };
    
    case ACTIONS.SET_ROOM_USERS:
      return {
        ...state,
        roomUsers: action.payload
      };
    
    case ACTIONS.UPDATE_ROOM_STATUS:
      return {
        ...state,
        rooms: state.rooms.map(room => 
          room.id === action.payload.id ? { ...room, ...action.payload } : room
        )
      };
    
    case ACTIONS.CLEAR_CHAT:
      return {
        ...state,
        messages: [],
        typingUsers: [],
        roomUsers: []
      };
    
    default:
      return state;
  }
};

export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Room events
    socket.on('room-status-update', (rooms) => {
      dispatch({ type: ACTIONS.SET_ROOMS, payload: rooms });
    });

    socket.on('room-joined', (roomData) => {
      dispatch({ type: ACTIONS.SET_CURRENT_ROOM, payload: roomData });
      dispatch({ type: ACTIONS.SET_MESSAGES, payload: roomData.messages });
    });

    // Message events
    socket.on('new-message', (message) => {
      dispatch({ type: ACTIONS.ADD_MESSAGE, payload: message });
    });

    // User events
    socket.on('user-joined-room', (user) => {
      dispatch({ type: ACTIONS.SET_ROOM_USERS, payload: [...state.roomUsers, user] });
    });

    socket.on('user-left', (user) => {
      dispatch({ type: ACTIONS.SET_ROOM_USERS, payload: state.roomUsers.filter(u => u.userId !== user.userId) });
    });

    socket.on('user-reconnected', (user) => {
      dispatch({ type: ACTIONS.SET_ROOM_USERS, payload: [...state.roomUsers, user] });
    });

    socket.on('user-disconnected', (user) => {
      dispatch({ type: ACTIONS.SET_ROOM_USERS, payload: state.roomUsers.filter(u => u.userId !== user.userId) });
    });

    // Typing events
    socket.on('user-typing', (userData) => {
      if (userData.isTyping) {
        dispatch({ type: ACTIONS.ADD_TYPING_USER, payload: userData });
      } else {
        dispatch({ type: ACTIONS.REMOVE_TYPING_USER, payload: userData.userId });
      }
    });

    // Cleanup
    return () => {
      socket.off('room-status-update');
      socket.off('room-joined');
      socket.off('new-message');
      socket.off('user-joined-room');
      socket.off('user-left');
      socket.off('user-reconnected');
      socket.off('user-disconnected');
      socket.off('user-typing');
    };
  }, [socket, isConnected, state.roomUsers]);

  // Context value
  const value = {
    ...state,
    dispatch,
    // Actions
    setRooms: (rooms) => dispatch({ type: ACTIONS.SET_ROOMS, payload: rooms }),
    setCurrentRoom: (room) => dispatch({ type: ACTIONS.SET_CURRENT_ROOM, payload: room }),
    addMessage: (message) => dispatch({ type: ACTIONS.ADD_MESSAGE, payload: message }),
    setMessages: (messages) => dispatch({ type: ACTIONS.SET_MESSAGES, payload: messages }),
    setTypingUsers: (users) => dispatch({ type: ACTIONS.SET_TYPING_USERS, payload: users }),
    addTypingUser: (user) => dispatch({ type: ACTIONS.ADD_TYPING_USER, payload: user }),
    removeTypingUser: (userId) => dispatch({ type: ACTIONS.REMOVE_TYPING_USER, payload: userId }),
    setRoomUsers: (users) => dispatch({ type: ACTIONS.SET_ROOM_USERS, payload: users }),
    updateRoomStatus: (roomData) => dispatch({ type: ACTIONS.UPDATE_ROOM_STATUS, payload: roomData }),
    clearChat: () => dispatch({ type: ACTIONS.CLEAR_CHAT })
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
