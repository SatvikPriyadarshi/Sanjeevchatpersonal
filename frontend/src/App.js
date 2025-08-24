import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './contexts/SocketContext';
import { ChatProvider } from './contexts/ChatContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './components/Login';
import RoomSelection from './components/RoomSelection';
import ChatRoom from './components/ChatRoom';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <SocketProvider>
        <ChatProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <div className="App">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/rooms" element={<RoomSelection />} />
                <Route path="/chat/:roomId" element={<ChatRoom />} />
                <Route path="/" element={<Navigate to="/login" replace />} />
              </Routes>
            </div>
          </Router>
        </ChatProvider>
      </SocketProvider>
    </ThemeProvider>
  );
}

export default App;
