import React, { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import { getWebSocketUrl, getSocketConfig } from "../config";

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState(() => {
    // Try to restore user from localStorage
    const savedUser = localStorage.getItem("chatapp-user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    // Initialize socket connection using centralized config
    const websocketUrl = getWebSocketUrl();
    const socketConfig = getSocketConfig();
    
    console.log("🔌 SocketContext: Connecting to WebSocket URL:", websocketUrl);
    console.log("🌍 SocketContext: Environment REACT_APP_BACKEND_URL:", process.env.REACT_APP_BACKEND_URL);
    console.log("⚙️ SocketContext: Socket config:", socketConfig);
    
    const newSocket = io(websocketUrl, socketConfig);

    // Connection events
    newSocket.on("connect", () => {
      console.log("✅ SocketContext: Successfully connected to server at:", websocketUrl);
      console.log("🔗 SocketContext: Socket ID:", newSocket.id);
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from server");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ SocketContext: Connection error to", websocketUrl, ":", error);
      console.error("🔍 SocketContext: Error details:", error.message);
      setIsConnected(false);
    });

    // User events
    newSocket.on("user-joined", (userData) => {
      console.log("User joined:", userData);
      setUser(userData);
      localStorage.setItem("chatapp-user", JSON.stringify(userData));
    });

    newSocket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    newSocket.on("join-room-error", (error) => {
      console.error("Join room error:", error);
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

  // Logout user
  const logout = () => {
    setUser(null);
    localStorage.removeItem("chatapp-user");
    if (socket && isConnected) {
      socket.disconnect();
    }
  };

  // Join user with username
  const joinUser = (username, avatar) => {
    return new Promise((resolve, reject) => {
      if (socket && isConnected) {
        socket.emit("join-user", { username, avatar });

        const timeout = setTimeout(() => {
          socket.off("user-joined");
          socket.off("join-user-error");
          reject(new Error("Timeout joining user"));
        }, 5000);

        socket.once("user-joined", (userData) => {
          clearTimeout(timeout);
          setUser(userData);
          localStorage.setItem("chatapp-user", JSON.stringify(userData));
          resolve(userData);
        });

        socket.once("join-user-error", (error) => {
          clearTimeout(timeout);
          reject(new Error(error.message || "Failed to join"));
        });
      } else {
        reject(new Error("Socket not connected"));
      }
    });
  };

  // Join a room
  const joinRoom = (roomId) => {
    return new Promise((resolve, reject) => {
      if (socket && isConnected) {
        socket.emit("join-room", { roomId });

        const timeout = setTimeout(() => {
          socket.off("room-joined");
          socket.off("join-room-error");
          reject(new Error("Timeout joining room"));
        }, 5000);

        socket.once("room-joined", (roomData) => {
          clearTimeout(timeout);
          console.log("🏠 Frontend: Room joined successfully:", roomData);
          resolve(roomData);
        });

        socket.once("join-room-error", (error) => {
          clearTimeout(timeout);
          reject(new Error(error.message || "Failed to join room"));
        });
      } else {
        reject(new Error("Socket not connected"));
      }
    });
  };

  // Leave room
  const leaveRoom = () => {
    if (socket && isConnected) {
      socket.emit("leave-room");
    }
  };

  // Send chat message
  const sendMessage = (content) => {
    if (socket && isConnected) {
      console.log("📨 Frontend: Sending message:", content);
      socket.emit("chat-message", { content });
    } else {
      console.log(
        "❌ Frontend: Cannot send message - socket connected:",
        isConnected
      );
    }
  };

  // Start typing indicator
  const startTyping = () => {
    if (socket && isConnected) {
      console.log("⌨️ Frontend: Starting typing indicator");
      socket.emit("typing-start");
    } else {
      console.log(
        "❌ Frontend: Cannot start typing - socket connected:",
        isConnected
      );
    }
  };

  // Stop typing indicator
  const stopTyping = () => {
    if (socket && isConnected) {
      console.log("⌨️ Frontend: Stopping typing indicator");
      socket.emit("typing-stop");
    } else {
      console.log(
        "❌ Frontend: Cannot stop typing - socket connected:",
        isConnected
      );
    }
  };

  // Get room status
  const getRoomStatus = () => {
    return new Promise((resolve, reject) => {
      if (socket && isConnected) {
        socket.emit("get-room-status");

        // Listen for the response
        const timeout = setTimeout(() => {
          socket.off("room-status-response");
          reject(new Error("Timeout waiting for room status"));
        }, 5000);

        socket.once("room-status-response", (rooms) => {
          clearTimeout(timeout);
          resolve(rooms || []);
        });
      } else {
        reject(new Error("Socket not connected"));
      }
    });
  };

  const value = {
    socket,
    isConnected,
    user,
    connect,
    disconnect,
    logout,
    joinUser,
    joinRoom,
    leaveRoom,
    sendMessage,
    startTyping,
    stopTyping,
    getRoomStatus,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
