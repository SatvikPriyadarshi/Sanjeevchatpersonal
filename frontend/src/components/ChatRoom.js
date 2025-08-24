import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { useChat } from '../contexts/ChatContext';
import styled from 'styled-components';

const Container = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
`;

const Header = styled.div`
  background: white;
  padding: 1rem 2rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const RoomInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const RoomNumber = styled.h1`
  font-size: 1.5rem;
  color: #333;
  margin: 0;
`;

const UserCount = styled.span`
  background: #667eea;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.9rem;
  font-weight: 500;
`;

const LeaveButton = styled.button`
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s ease;
  
  &:hover {
    background: #c82333;
  }
`;

const ChatArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  gap: 1rem;
`;

const MessagesContainer = styled.div`
  flex: 1;
  background: white;
  border-radius: 15px;
  padding: 1rem;
  overflow-y: auto;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const MessageList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Message = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  
  ${props => props.isOwn && `
    flex-direction: row-reverse;
    
    .message-content {
      background: #667eea;
      color: white;
      border-radius: 18px 18px 4px 18px;
    }
    
    .message-info {
      text-align: right;
    }
  `}
`;

const MessageAvatar = styled.div`
  font-size: 2rem;
  flex-shrink: 0;
`;

const MessageContent = styled.div`
  flex: 1;
  max-width: 70%;
`;

const MessageText = styled.div`
  background: #f1f3f4;
  padding: 0.75rem 1rem;
  border-radius: 18px 18px 18px 4px;
  color: #333;
  line-height: 1.4;
  word-wrap: break-word;
`;

const MessageInfo = styled.div`
  margin-top: 0.25rem;
  font-size: 0.8rem;
  color: #666;
`;

const SystemMessage = styled.div`
  text-align: center;
  color: #666;
  font-style: italic;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 10px;
  margin: 0.5rem 0;
`;

const TypingIndicator = styled.div`
  padding: 0.5rem 1rem;
  color: #666;
  font-style: italic;
  font-size: 0.9rem;
`;

const InputArea = styled.div`
  background: white;
  padding: 1rem;
  border-radius: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const InputForm = styled.form`
  display: flex;
  gap: 1rem;
  align-items: flex-end;
`;

const Input = styled.textarea`
  flex: 1;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  padding: 0.75rem;
  font-size: 1rem;
  resize: none;
  min-height: 44px;
  max-height: 120px;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const SendButton = styled.button`
  background: #667eea;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s ease;
  
  &:hover {
    background: #5a6fd8;
  }
  
  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  color: #666;
  padding: 2rem;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid #667eea;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const ChatRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  const { 
    isConnected, 
    joinRoom, 
    leaveRoom, 
    sendMessage, 
    startTyping, 
    stopTyping 
  } = useSocket();
  
  const { 
    currentRoom, 
    messages, 
    typingUsers, 
    roomUsers, 
    clearChat 
  } = useChat();

  useEffect(() => {
    if (isConnected && roomId) {
      joinRoom(roomId);
    }
    
    return () => {
      if (isConnected) {
        leaveRoom();
      }
      clearChat();
    };
  }, [isConnected, roomId, joinRoom, leaveRoom, clearChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    sendMessage(message.trim());
    setMessage('');
    stopTyping();
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessage(value);
    
    // Handle typing indicators
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      startTyping();
    } else if (!value.trim() && isTyping) {
      setIsTyping(false);
      stopTyping();
    }
    
    // Debounce typing stop
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    if (value.trim()) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        stopTyping();
      }, 1000);
    }
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    navigate('/rooms');
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 48) {
      return 'Yesterday ' + date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }) + ' ' + date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    }
  };

  if (!isConnected) {
    return (
      <Container>
        <EmptyState>
          <LoadingSpinner />
          <p>Connecting to chat room...</p>
        </EmptyState>
      </Container>
    );
  }

  if (!currentRoom) {
    return (
      <Container>
        <EmptyState>
          <LoadingSpinner />
          <p>Joining room...</p>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <RoomInfo>
          <RoomNumber>Room {currentRoom.roomNumber}</RoomNumber>
          <UserCount>{roomUsers.length} users</UserCount>
        </RoomInfo>
        <LeaveButton onClick={handleLeaveRoom}>
          Leave Room
        </LeaveButton>
      </Header>

      <ChatArea>
        <MessagesContainer>
          {messages.length === 0 ? (
            <EmptyState>
              <p>No messages yet. Start the conversation!</p>
            </EmptyState>
          ) : (
            <MessageList>
              {messages.map((msg) => (
                <Message key={msg._id} isOwn={msg.senderId === currentRoom.userId}>
                  {msg.messageType === 'system' ? (
                    <SystemMessage>{msg.content}</SystemMessage>
                  ) : (
                    <>
                      <MessageAvatar>{msg.senderId?.avatar || '👤'}</MessageAvatar>
                      <MessageContent>
                        <MessageText className="message-content">
                          {msg.content}
                        </MessageText>
                        <MessageInfo className="message-info">
                          {msg.senderId?.username || 'Unknown'} • {formatTime(msg.timestamp)}
                        </MessageInfo>
                      </MessageContent>
                    </>
                  )}
                </Message>
              ))}
              <div ref={messagesEndRef} />
            </MessageList>
          )}
          
          {typingUsers.length > 0 && (
            <TypingIndicator>
              {typingUsers.map(user => user.username).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </TypingIndicator>
          )}
        </MessagesContainer>

        <InputArea>
          <InputForm onSubmit={handleSubmit}>
            <Input
              value={message}
              onChange={handleInputChange}
              placeholder="Type your message..."
              rows={1}
              maxLength={1000}
            />
            <SendButton type="submit" disabled={!message.trim()}>
              Send
            </SendButton>
          </InputForm>
        </InputArea>
      </ChatArea>
    </Container>
  );
};

export default ChatRoom;
