import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useSocket } from '../contexts/SocketContext';
import { useTheme } from '../contexts/ThemeContext';
import { FaSun, FaMoon, FaUser, FaSmile } from 'react-icons/fa';
import { avatarOptions } from '../utils/avatarUtils';

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: ${props => props.theme.isDark ? '#1a1a1a' : '#f5f5f5'};
  color: ${props => props.theme.isDark ? '#ffffff' : '#333333'};
  transition: all 0.3s ease;
`;

const ThemeToggle = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: ${props => props.theme.isDark ? '#333' : '#fff'};
  border: 2px solid ${props => props.theme.isDark ? '#555' : '#ddd'};
  color: ${props => props.theme.isDark ? '#fff' : '#333'};
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 20px;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
`;

const LoginCard = styled.div`
  background: ${props => props.theme.isDark ? '#2d2d2d' : '#ffffff'};
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;
  border: 1px solid ${props => props.theme.isDark ? '#444' : '#e0e0e0'};
  transition: all 0.3s ease;
  margin: 20px;
  
  @media (max-width: 768px) {
    padding: 30px;
    margin: 15px;
    border-radius: 15px;
  }
  
  @media (max-width: 480px) {
    padding: 20px;
    margin: 10px;
  }
`;

const Title = styled.h1`
  margin-bottom: 30px;
  color: ${props => props.theme.isDark ? '#ffffff' : '#333333'};
  font-size: 2.5rem;
  font-weight: bold;
  
  @media (max-width: 768px) {
    font-size: 2rem;
    margin-bottom: 25px;
  }
  
  @media (max-width: 480px) {
    font-size: 1.6rem;
    margin-bottom: 20px;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InputGroup = styled.div`
  position: relative;
`;

const Input = styled.input`
  width: 100%;
  padding: 15px 20px;
  border: 2px solid ${props => props.theme.isDark ? '#555' : '#e0e0e0'};
  border-radius: 10px;
  font-size: 16px;
  background: ${props => props.theme.isDark ? '#3d3d3d' : '#ffffff'};
  color: ${props => props.theme.isDark ? '#ffffff' : '#333333'};
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
  }

  &::placeholder {
    color: ${props => props.theme.isDark ? '#aaa' : '#999'};
  }
`;

const AvatarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-top: 10px;
  
  @media (max-width: 480px) {
    gap: 10px;
  }
`;

const AvatarOption = styled.button`
  width: 60px;
  height: 60px;
  border: 3px solid ${props => props.selected ? '#007bff' : 'transparent'};
  border-radius: 50%;
  background: ${props => props.theme.isDark ? '#3d3d3d' : '#f8f9fa'};
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 0;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
  
  @media (max-width: 480px) {
    width: 50px;
    height: 50px;
  }
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
`;

const Button = styled.button`
  background: linear-gradient(135deg, #007bff, #0056b3);
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 10px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 123, 255, 0.4);
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  background: ${props => props.theme.isDark ? '#3d2d2d' : '#f8d7da'};
  border: 1px solid ${props => props.theme.isDark ? '#5d3d3d' : '#f5c6cb'};
  padding: 10px;
  border-radius: 5px;
  margin-top: 10px;
  font-size: 14px;
`;



const Login = () => {
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('avt1');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { connect, joinUser, isConnected } = useSocket();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    // Don't auto-navigate, let the user complete the login process
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      connect();
      // Wait a bit for connection to establish
      await new Promise(resolve => setTimeout(resolve, 1000));
      await joinUser(username.trim(), selectedAvatar);
      navigate('/rooms');
    } catch (err) {
      setError(err.message || 'Failed to connect. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginContainer theme={theme}>
      <ThemeToggle onClick={toggleTheme} theme={theme}>
        {theme.isDark ? <FaSun /> : <FaMoon />}
      </ThemeToggle>
      
      <LoginCard theme={theme}>
        <Title>Welcome to ChatApp</Title>
        
        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <Input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              theme={theme}
              disabled={isLoading}
            />
          </InputGroup>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '10px', 
              textAlign: 'left',
              color: theme.isDark ? '#ffffff' : '#333333',
              fontWeight: '600'
            }}>
              Choose your avatar:
            </label>
            <AvatarGrid>
              {avatarOptions.map((avatar) => (
                <AvatarOption
                  key={avatar.id}
                  selected={selectedAvatar === avatar.id}
                  onClick={() => setSelectedAvatar(avatar.id)}
                  theme={theme}
                  disabled={isLoading}
                  type="button"
                >
                  <AvatarImage src={avatar.src} alt={avatar.alt} />
                </AvatarOption>
              ))}
            </AvatarGrid>
          </div>

          {error && <ErrorMessage theme={theme}>{error}</ErrorMessage>}

          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Connecting...' : 'Start Chatting'}
          </Button>
        </Form>
      </LoginCard>
    </LoginContainer>
  );
};

export default Login;
