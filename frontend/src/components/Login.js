import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import styled from 'styled-components';

const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
`;

const LoginCard = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;
`;

const Title = styled.h1`
  color: #333;
  margin-bottom: 1rem;
  font-size: 2rem;
  font-weight: 600;
`;

const Subtitle = styled.p`
  color: #666;
  margin-bottom: 2rem;
  font-size: 1rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const InputGroup = styled.div`
  text-align: left;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
  font-size: 0.9rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e1e5e9;
  border-radius: 10px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const AvatarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const AvatarOption = styled.button`
  background: ${props => props.selected ? '#667eea' : '#f8f9fa'};
  color: ${props => props.selected ? 'white' : '#333'};
  border: 2px solid ${props => props.selected ? '#667eea' : '#e1e5e9'};
  border-radius: 10px;
  padding: 0.5rem;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.1);
    border-color: #667eea;
  }
`;

const Button = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  background: #fdf2f2;
  padding: 0.75rem;
  border-radius: 10px;
  border: 1px solid #fecaca;
  font-size: 0.9rem;
  margin-top: 1rem;
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

const Login = () => {
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('👤');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { connect, isConnected, joinUser } = useSocket();

  const avatars = ['👤', '👨', '👩', '🧑', '👶', '👴', '👵', '👨‍💼', '👩‍💼', '🦸', '🦸‍♀️', '🤖'];

  useEffect(() => {
    // Connect to socket when component mounts
    connect();
  }, [connect]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    if (username.trim().length < 2) {
      setError('Username must be at least 2 characters long');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Wait for connection if not connected
      if (!isConnected) {
        await new Promise(resolve => {
          const checkConnection = () => {
            if (isConnected) {
              resolve();
            } else {
              setTimeout(checkConnection, 100);
            }
          };
          checkConnection();
        });
      }

      // Join user
      joinUser(username.trim(), selectedAvatar);
      
      // Navigate to rooms after a short delay
      setTimeout(() => {
        navigate('/rooms');
      }, 500);

    } catch (err) {
      setError('Failed to connect. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        <Title>Welcome to ChatApp</Title>
        <Subtitle>Join the conversation with a unique username and avatar</Subtitle>
        
        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              maxLength={20}
              disabled={isLoading}
            />
          </InputGroup>

          <InputGroup>
            <Label>Choose Avatar</Label>
            <AvatarGrid>
              {avatars.map((avatar) => (
                <AvatarOption
                  key={avatar}
                  type="button"
                  selected={selectedAvatar === avatar}
                  onClick={() => setSelectedAvatar(avatar)}
                  disabled={isLoading}
                >
                  {avatar}
                </AvatarOption>
              ))}
            </AvatarGrid>
          </InputGroup>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <LoadingSpinner />
                Connecting...
              </>
            ) : (
              'Start Chatting'
            )}
          </Button>
        </Form>

        {error && <ErrorMessage>{error}</ErrorMessage>}
      </LoginCard>
    </LoginContainer>
  );
};

export default Login;
