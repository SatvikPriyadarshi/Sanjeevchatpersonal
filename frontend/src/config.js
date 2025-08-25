// Frontend Configuration
// This file centralizes all configuration settings

// Get backend URL from environment variable or use localhost as fallback
const BACKEND_URL = "https://sanjeevchatpersonal.onrender.com';

// Configuration object
const config = {
  // Backend API URL
  BACKEND_URL: BACKEND_URL,
  
  // WebSocket URL (same as backend URL)
  WEBSOCKET_URL: BACKEND_URL,
  
  // Socket.IO configuration
  SOCKET_CONFIG: {
    transports: ['websocket', 'polling'],
    autoConnect: false,
    timeout: 20000,
    forceNew: true,
  },
  
  // App metadata
  APP_NAME: 'ChatApp',
  APP_VERSION: '1.0.0',
};

// Helper functions
export const getBackendApiUrl = () => config.BACKEND_URL;
export const getWebSocketUrl = () => config.WEBSOCKET_URL;
export const getSocketConfig = () => config.SOCKET_CONFIG;

// Export default config
export default config;
