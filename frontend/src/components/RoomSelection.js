import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useSocket } from '../contexts/SocketContext';
import { useTheme } from '../contexts/ThemeContext';
import { FaSun, FaMoon, FaArrowLeft, FaSignInAlt } from 'react-icons/fa';

const Container = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.isDark ? '#1a1a1a' : '#f5f5f5'};
  color: ${props => props.theme.isDark ? '#ffffff' : '#333333'};
  transition: all 0.3s ease;
`;

const Header = styled.div`
  background: ${props => props.theme.isDark ? '#2d2d2d' : '#ffffff'};
  padding: 15px 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid ${props => props.theme.isDark ? '#444' : '#e0e0e0'};
  
  @media (max-width: 768px) {
    padding: 10px 15px;
    flex-wrap: wrap;
    gap: 10px;
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  
  @media (max-width: 768px) {
    gap: 10px;
    flex: 1;
  }
`;

const BackButton = styled.button`
  background: ${props => props.theme.isDark ? '#444' : '#f8f9fa'};
  border: 1px solid ${props => props.theme.isDark ? '#555' : '#dee2e6'};
  color: ${props => props.theme.isDark ? '#fff' : '#333'};
  padding: 10px 15px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.theme.isDark ? '#555' : '#e9ecef'};
    transform: translateY(-1px);
  }
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.8rem;
  font-weight: bold;
  
  @media (max-width: 768px) {
    font-size: 1.4rem;
  }
  
  @media (max-width: 480px) {
    font-size: 1.2rem;
  }
`;

const ThemeToggle = styled.button`
  background: ${props => props.theme.isDark ? '#333' : '#fff'};
  border: 2px solid ${props => props.theme.isDark ? '#555' : '#ddd'};
  color: ${props => props.theme.isDark ? '#fff' : '#333'};
  border-radius: 50%;
  width: 45px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 18px;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
`;

const Content = styled.div`
  max-width: 500px;
  margin: 0 auto;
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: calc(100vh - 200px);
  justify-content: center;
  
  @media (max-width: 768px) {
    padding: 20px 15px;
  }
  
  @media (max-width: 480px) {
    padding: 15px 10px;
  }
`;

const RoomCard = styled.div`
  background: ${props => props.theme.isDark ? '#2d2d2d' : '#ffffff'};
  border: 2px solid ${props => props.theme.isDark ? '#444' : '#e0e0e0'};
  border-radius: 20px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  
  @media (max-width: 768px) {
    padding: 30px;
    border-radius: 15px;
  }
  
  @media (max-width: 480px) {
    padding: 25px;
  }
`;

const RoomTitle = styled.h2`
  margin: 0 0 20px 0;
  font-size: 2rem;
  font-weight: bold;
  color: ${props => props.theme.isDark ? '#ffffff' : '#333333'};
  
  @media (max-width: 768px) {
    font-size: 1.8rem;
  }
  
  @media (max-width: 480px) {
    font-size: 1.6rem;
  }
`;

const Description = styled.p`
  color: ${props => props.theme.isDark ? '#ccc' : '#666'};
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 30px;
  
  @media (max-width: 480px) {
    font-size: 1rem;
    margin-bottom: 25px;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`;

const InputGroup = styled.div`
  position: relative;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: ${props => props.theme.isDark ? '#ffffff' : '#333333'};
  font-size: 1rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 15px 20px;
  border: 2px solid ${props => props.theme.isDark ? '#555' : '#e0e0e0'};
  border-radius: 12px;
  font-size: 18px;
  text-align: center;
  background: ${props => props.theme.isDark ? '#3d3d3d' : '#ffffff'};
  color: ${props => props.theme.isDark ? '#ffffff' : '#333333'};
  transition: all 0.3s ease;
  font-weight: bold;

  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    transform: scale(1.02);
  }

  &::placeholder {
    color: ${props => props.theme.isDark ? '#aaa' : '#999'};
    font-weight: normal;
  }
  
  @media (max-width: 480px) {
    padding: 12px 16px;
    font-size: 16px;
  }
`;

const JoinButton = styled.button`
  background: linear-gradient(135deg, #007bff, #0056b3);
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 123, 255, 0.4);
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  
  @media (max-width: 480px) {
    padding: 12px 24px;
    font-size: 1rem;
  }
`;

const ErrorMessage = styled.div`
  background: ${props => props.theme.isDark ? '#3d2d2d' : '#f8d7da'};
  border: 1px solid ${props => props.theme.isDark ? '#5d3d3d' : '#f5c6cb'};
  color: #dc3545;
  padding: 12px 16px;
  border-radius: 8px;
  margin-top: 15px;
  text-align: center;
  font-size: 0.9rem;
`;

const RoomHint = styled.div`
  background: ${props => props.theme.isDark ? '#2a3f5f' : '#e3f2fd'};
  border: 1px solid ${props => props.theme.isDark ? '#3a5f7f' : '#bbdefb'};
  color: ${props => props.theme.isDark ? '#90caf9' : '#1976d2'};
  padding: 12px 16px;
  border-radius: 8px;
  margin-top: 15px;
  text-align: center;
  font-size: 0.9rem;
  line-height: 1.4;
`;

const RoomSelection = () => {
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { joinRoom, isConnected, user } = useSocket();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (!isConnected || !user) {
      navigate('/login');
    }
  }, [isConnected, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!roomId.trim()) {
      setError('Please enter a room ID');
      return;
    }

    const roomNumber = parseInt(roomId.trim());
    
    if (isNaN(roomNumber) || roomNumber < 1 || roomNumber > 5) {
      setError('Room ID must be a number between 1 and 5');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await joinRoom(roomNumber);
      navigate(`/chat/${roomNumber}`);
    } catch (err) {
      setError(err.message || 'Failed to join room. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    navigate('/login');
  };

  if (!isConnected || !user) {
    navigate('/login');
    return null;
  }

  return (
    <Container theme={theme}>
      <Header theme={theme}>
        <HeaderLeft>
          <BackButton onClick={handleLogout} theme={theme}>
            <FaArrowLeft />
            Logout
          </BackButton>
          <Title>Join Private Room</Title>
        </HeaderLeft>
        <ThemeToggle onClick={toggleTheme} theme={theme}>
          {theme.isDark ? <FaSun /> : <FaMoon />}
        </ThemeToggle>
      </Header>

      <Content>
        <RoomCard theme={theme}>
          <RoomTitle theme={theme}>Enter Room ID</RoomTitle>
          <Description theme={theme}>
            Choose a room number (1-5) to join. If another user enters the same room ID, you'll be connected for private chat.
          </Description>

          <Form onSubmit={handleSubmit}>
            <InputGroup>
              <Label theme={theme}>Room ID (1-5)</Label>
              <Input
                type="text"
                placeholder="Enter room number"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                theme={theme}
                disabled={isLoading}
                maxLength="1"
              />
            </InputGroup>

            <JoinButton type="submit" disabled={isLoading || !roomId.trim()}>
              <FaSignInAlt />
              {isLoading ? 'Joining...' : 'Join Room'}
            </JoinButton>

            {error && (
              <ErrorMessage theme={theme}>
                {error}
              </ErrorMessage>
            )}

            <RoomHint theme={theme}>
              💡 Tip: Share the same room ID with someone to start a private conversation!
            </RoomHint>
          </Form>
        </RoomCard>
      </Content>
    </Container>
  );
};

export default RoomSelection;
