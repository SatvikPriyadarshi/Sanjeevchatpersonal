import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChatProvider } from './contexts/ChatContext';
import { SocketProvider } from './contexts/SocketContext';
import Login from './components/Login';
import RoomSelection from './components/RoomSelection';
import ChatRoom from './components/ChatRoom';
import './App.css';

function App() {
  return (
    <SocketProvider>
      <ChatProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/rooms" element={<RoomSelection />} />
              <Route path="/chat/:roomId" element={<ChatRoom />} />
            </Routes>
          </div>
        </Router>
      </ChatProvider>
    </SocketProvider>
  );
}

export default App;
