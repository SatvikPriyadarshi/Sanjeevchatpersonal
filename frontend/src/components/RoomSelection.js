import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { useChat } from '../contexts/ChatContext';
import styled from 'styled-components';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
`;

const Header = styled.div`
  text-align: center;
  color: white;
  margin-bottom: 3rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  opacity: 0.9;
`;

const RoomGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const RoomCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
  }
`;

const RoomHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const RoomNumber = styled.h2`
  font-size: 1.8rem;
  color: #333;
  margin: 0;
`;

const StatusBadge = styled.span`
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  
  ${props => {
    switch (props.status) {
      case 'available':
        return `
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        `;
      case 'occupied':
        return `
          background: #fff3cd;
          color: #856404;
          border: 1px solid #ffeaa7;
        `;
      case 'full':
        return `
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        `;
      default:
        return `
          background: #e2e3e5;
          color: #383d41;
          border: 1px solid #d6d8db;
        `;
    }
  }}
`;

const RoomInfo = styled.div`
  margin-bottom: 1.5rem;
`;

const UserList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
`;

const UserItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 10px;
`;

const UserAvatar = styled.span`
  font-size: 1.2rem;
`;

const UserName = styled.span`
  color: #333;
  font-weight: 500;
`;

const OnlineIndicator = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.online ? '#28a745' : '#6c757d'};
`;

const JoinButton = styled.button`
  width: 100%;
  background: ${props => {
    switch (props.status) {
      case 'available':
        return 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
      case 'occupied':
        return 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)';
      case 'full':
        return 'linear-gradient(135deg, #6c757d 0%, #495057 100%)';
      default:
        return 'linear-gradient(135deg, #6c757d 0%, #495057 100%)';
    }
  }};
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: ${props => props.status === 'full' ? 'not-allowed' : 'pointer'};
  transition: transform 0.3s ease;
  
  &:hover {
    transform: ${props => props.status === 'full' ? 'none' : 'translateY(-2px)'};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid #ffffff3d;
  border-radius: 50%;
  border-top-color: #ffffff;
  animation: spin 1s ease-in-out infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  color: white;
  padding: 3rem;
`;

const RefreshButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
  }
`;

const RoomSelection = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { isConnected, getRoomStatus } = useSocket();
  const { rooms, setRooms } = useChat();

  useEffect(() => {
    if (isConnected) {
      getRoomStatus();
    }
  }, [isConnected, getRoomStatus]);

  const handleJoinRoom = async (roomId, status) => {
    if (status === 'full') {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Navigate to chat room
      navigate(`/chat/${roomId}`);
    } catch (err) {
      setError('Failed to join room. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    if (isConnected) {
      getRoomStatus();
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'occupied':
        return '1 User';
      case 'full':
        return 'Full';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'available';
      case 'occupied':
        return 'occupied';
      case 'full':
        return 'full';
      default:
        return 'unknown';
    }
  };

  if (!isConnected) {
    return (
      <Container>
        <EmptyState>
          <h2>Connecting to server...</h2>
          <p>Please wait while we establish a connection.</p>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Choose Your Chat Room</Title>
        <Subtitle>Select from our 5 available rooms to start chatting</Subtitle>
      </Header>

      {rooms.length === 0 ? (
        <EmptyState>
          <h2>No rooms available</h2>
          <p>Please wait for rooms to be initialized or refresh the page.</p>
          <RefreshButton onClick={handleRefresh}>
            Refresh Rooms
          </RefreshButton>
        </EmptyState>
      ) : (
        <RoomGrid>
          {rooms.map((room) => (
            <RoomCard key={room.id}>
              <RoomHeader>
                <RoomNumber>Room {room.roomNumber}</RoomNumber>
                <StatusBadge status={getStatusColor(room.status)}>
                  {getStatusText(room.status)}
                </StatusBadge>
              </RoomHeader>

              <RoomInfo>
                <UserList>
                  {room.user1 && (
                    <UserItem>
                      <UserAvatar>{room.user1.avatar}</UserAvatar>
                      <UserName>{room.user1.username}</UserName>
                      <OnlineIndicator online={room.user1.isOnline} />
                    </UserItem>
                  )}
                  {room.user2 && (
                    <UserItem>
                      <UserAvatar>{room.user2.avatar}</UserAvatar>
                      <UserName>{room.user2.username}</UserName>
                      <OnlineIndicator online={room.user2.isOnline} />
                    </UserItem>
                  )}
                  {!room.user1 && !room.user2 && (
                    <p style={{ color: '#666', fontStyle: 'italic' }}>
                      No users in this room
                    </p>
                  )}
                </UserList>
              </RoomInfo>

              <JoinButton
                status={room.status}
                onClick={() => handleJoinRoom(room.id, room.status)}
                disabled={isLoading || room.status === 'full'}
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner />
                    Joining...
                  </>
                ) : room.status === 'full' ? (
                  'Room Full'
                ) : room.status === 'occupied' ? (
                  'Join Room'
                ) : (
                  'Join Room'
                )}
              </JoinButton>
            </RoomCard>
          ))}
        </RoomGrid>
      )}

      {error && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#f8d7da',
          color: '#721c24',
          padding: '1rem',
          borderRadius: '10px',
          border: '1px solid #f5c6cb',
          zIndex: 1000
        }}>
          {error}
        </div>
      )}
    </Container>
  );
};

export default RoomSelection;
