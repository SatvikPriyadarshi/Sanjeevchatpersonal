import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useSocket } from "../contexts/SocketContext";
import { useChat } from "../contexts/ChatContext";
import { useTheme } from "../contexts/ThemeContext";
import {
  FaSun,
  FaMoon,
  FaArrowLeft,
  FaPaperPlane,
  FaUsers,
  FaEdit,
  FaTrash,
  FaBroom,
  FaCheck,
  FaTimes,
  FaSmile,
  FaImage,
  FaReply,
  FaHeart,
  FaCopy,
  FaShare,
  FaStar,
  FaThumbtack,
  FaInfoCircle,
  FaQuoteLeft,
  FaLanguage,
  FaSave,
  FaFlag,
  FaShareAlt,
} from "react-icons/fa";
import { getAvatarImage } from "../utils/avatarUtils";

const Container = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${(props) =>
    props.theme.isDark
      ? "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)"
      : "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)"};
  color: ${(props) => (props.theme.isDark ? "#ffffff" : "#333333")};
  transition: all 0.3s ease;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${(props) =>
      props.theme.isDark
        ? "radial-gradient(circle at 20% 80%, rgba(0, 123, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(40, 167, 69, 0.1) 0%, transparent 50%)"
        : "radial-gradient(circle at 20% 80%, rgba(0, 123, 255, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(40, 167, 69, 0.05) 0%, transparent 50%)"};
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
`;

const Header = styled.div`
  background: ${(props) =>
    props.theme.isDark
      ? "linear-gradient(135deg, rgba(45, 45, 45, 0.95) 0%, rgba(60, 60, 60, 0.95) 100%)"
      : "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 249, 250, 0.95) 100%)"};
  backdrop-filter: blur(20px);
  padding: 20px 25px;
  border-bottom: 1px solid
    ${(props) =>
      props.theme.isDark
        ? "rgba(68, 68, 68, 0.5)"
        : "rgba(224, 224, 224, 0.5)"};
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: ${(props) =>
    props.theme.isDark
      ? "0 8px 32px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2)"
      : "0 8px 32px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05)"};
  border-radius: 0 0 20px 20px;

  @media (max-width: 768px) {
    padding: 15px 20px;
    border-radius: 0 0 15px 15px;
  }

  @media (max-width: 480px) {
    padding: 12px 15px;
    border-radius: 0 0 12px 12px;
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;

  @media (max-width: 768px) {
    gap: 15px;
  }

  @media (max-width: 480px) {
    gap: 10px;
  }
`;

const BackButton = styled.button`
  background: ${(props) =>
    props.theme.isDark
      ? "linear-gradient(135deg, #444 0%, #555 100%)"
      : "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)"};
  border: 1px solid
    ${(props) =>
      props.theme.isDark
        ? "rgba(85, 85, 85, 0.5)"
        : "rgba(222, 226, 230, 0.5)"};
  color: ${(props) => (props.theme.isDark ? "#fff" : "#333")};
  padding: 10px 16px;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 14px;
  font-weight: 500;
  box-shadow: ${(props) =>
    props.theme.isDark
      ? "0 4px 12px rgba(0, 0, 0, 0.3)"
      : "0 4px 12px rgba(0, 0, 0, 0.1)"};

  &:hover {
    background: ${(props) =>
      props.theme.isDark
        ? "linear-gradient(135deg, #555 0%, #666 100%)"
        : "linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%)"};
    transform: translateY(-2px);
    box-shadow: ${(props) =>
      props.theme.isDark
        ? "0 6px 20px rgba(0, 0, 0, 0.4)"
        : "0 6px 20px rgba(0, 0, 0, 0.15)"};
  }

  &:active {
    transform: translateY(0);
  }
`;

const RoomInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const RoomTitle = styled.h2`
  margin: 0;
  font-size: 1.6rem;
  font-weight: 700;
  background: ${(props) =>
    props.theme.isDark
      ? "linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)"
      : "linear-gradient(135deg, #333333 0%, #555555 100%)"};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;

  @media (max-width: 768px) {
    font-size: 1.4rem;
  }

  @media (max-width: 480px) {
    font-size: 1.2rem;
  }
`;

const UserCount = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${(props) => (props.theme.isDark ? "#ccc" : "#666")};
  font-size: 0.9rem;
  background: ${(props) =>
    props.theme.isDark ? "rgba(0, 123, 255, 0.1)" : "rgba(0, 123, 255, 0.05)"};
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid
    ${(props) =>
      props.theme.isDark ? "rgba(0, 123, 255, 0.2)" : "rgba(0, 123, 255, 0.1)"};
  font-weight: 500;

  svg {
    color: #007bff;
  }
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ActionButton = styled.button`
  background: ${(props) => (props.theme.isDark ? "#333" : "#fff")};
  border: 2px solid ${(props) => (props.theme.isDark ? "#555" : "#ddd")};
  color: ${(props) => (props.theme.isDark ? "#fff" : "#333")};
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 16px;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  &.danger {
    border-color: #dc3545;
    color: #dc3545;

    &:hover {
      background: #dc3545;
      color: white;
    }
  }
`;

const MessageWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  margin-bottom: 4px;
  transition: all 0.2s ease;

  &:hover {
    transform: translateX(${(props) => (props.isOwn ? "-2px" : "2px")});
  }

  &.message-wrapper:hover .message-actions {
    opacity: 1;
    transform: translateY(0);
  }
`;

const MessageActions = styled.div`
  opacity: 0;
  transition: all 0.3s ease;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
  transform: translateY(5px);

  .message-wrapper:hover & {
    opacity: 1;
    transform: translateY(0);
  }
`;

const MessageActionButton = styled.button`
  background: ${(props) =>
    props.theme.isDark ? "rgba(68, 68, 68, 0.8)" : "rgba(248, 249, 250, 0.9)"};
  backdrop-filter: blur(10px);
  border: 1px solid
    ${(props) =>
      props.theme.isDark
        ? "rgba(85, 85, 85, 0.5)"
        : "rgba(222, 226, 230, 0.5)"};
  color: ${(props) => (props.theme.isDark ? "#fff" : "#333")};
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
  box-shadow: ${(props) =>
    props.theme.isDark
      ? "0 2px 8px rgba(0, 0, 0, 0.3)"
      : "0 2px 8px rgba(0, 0, 0, 0.1)"};

  &:hover {
    background: ${(props) =>
      props.theme.isDark
        ? "rgba(85, 85, 85, 0.9)"
        : "rgba(233, 236, 239, 0.9)"};
    transform: translateY(-2px);
    box-shadow: ${(props) =>
      props.theme.isDark
        ? "0 4px 12px rgba(0, 0, 0, 0.4)"
        : "0 4px 12px rgba(0, 0, 0, 0.15)"};
  }

  &.danger {
    color: #dc3545;
    border-color: rgba(220, 53, 69, 0.3);

    &:hover {
      background: rgba(220, 53, 69, 0.1);
      border-color: #dc3545;
      color: #dc3545;
    }
  }

  &:active {
    transform: translateY(0);
  }
`;

const EditInput = styled.input`
  background: ${(props) => (props.theme.isDark ? "#3d3d3d" : "#ffffff")};
  border: 2px solid #007bff;
  color: ${(props) => (props.theme.isDark ? "#ffffff" : "#333333")};
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 0.95rem;
  width: 100%;

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
  }
`;

const EditActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
  justify-content: flex-end;
`;

const EditActionButton = styled.button`
  background: ${(props) => (props.primary ? "#007bff" : "transparent")};
  border: 1px solid ${(props) => (props.primary ? "#007bff" : "#ccc")};
  color: ${(props) =>
    props.primary ? "white" : props.theme.isDark ? "#fff" : "#333"};
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) =>
      props.primary ? "#0056b3" : props.theme.isDark ? "#444" : "#f8f9fa"};
  }
`;

const ChatArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 80px; /* Extra space for typing indicator */
  display: flex;
  flex-direction: column;
  gap: 4px;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: ${(props) => (props.theme.isDark ? "#2d2d2d" : "#f1f1f1")};
  }

  &::-webkit-scrollbar-thumb {
    background: ${(props) => (props.theme.isDark ? "#555" : "#c1c1c1")};
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${(props) => (props.theme.isDark ? "#666" : "#a8a8a8")};
  }

  @media (max-width: 768px) {
    padding: 12px;
    padding-bottom: 70px;
    gap: 3px;
  }

  @media (max-width: 480px) {
    padding: 8px;
    padding-bottom: 60px;
    gap: 2px;
  }
`;

const Message = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  max-width: 100%;
  margin-bottom: 12px;
  flex-direction: ${(props) => (props.isOwn ? "row-reverse" : "row")};
  animation: messageSlideIn 0.3s ease-out;
  transform: translateX(${(props) => props.swipeOffset || 0}px);
  transition: transform 0.2s ease-out;
  position: relative;

  @keyframes messageSlideIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  ${(props) =>
    props.isSystem &&
    `
    justify-content: center;
    margin: 8px 0;
  `}

  @media (max-width: 768px) {
    gap: 10px;
    margin-bottom: 10px;
  }
`;

const MessageBubbleContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 70%;
  align-items: ${(props) => (props.isOwn ? "flex-end" : "flex-start")};

  @media (max-width: 768px) {
    max-width: 80%;
  }

  @media (max-width: 480px) {
    max-width: 85%;
  }
`;

const MessageHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
  flex-direction: ${(props) => (props.isOwn ? "row-reverse" : "row")};
`;

const Avatar = styled.img`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid
    ${(props) =>
      props.theme.isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)"};
  flex-shrink: 0;
  transition: all 0.3s ease;
  box-shadow: ${(props) =>
    props.theme.isDark
      ? "0 4px 12px rgba(0, 0, 0, 0.3)"
      : "0 4px 12px rgba(0, 0, 0, 0.1)"};

  &:hover {
    transform: scale(1.1);
    border-color: #007bff;
    box-shadow: ${(props) =>
      props.theme.isDark
        ? "0 6px 20px rgba(0, 123, 255, 0.3)"
        : "0 6px 20px rgba(0, 123, 255, 0.2)"};
  }

  @media (max-width: 480px) {
    width: 40px;
    height: 40px;
  }
`;

const Username = styled.span`
  font-weight: 600;
  font-size: 0.85rem;
  color: ${(props) => (props.theme.isDark ? "#ccc" : "#666")};

  @media (max-width: 480px) {
    font-size: 0.8rem;
  }
`;

const Timestamp = styled.span`
  font-size: 0.75rem;
  color: ${(props) => (props.theme.isDark ? "#888" : "#999")};
  margin-left: 8px;

  @media (max-width: 480px) {
    font-size: 0.7rem;
  }
`;

const MessageContent = styled.div`
  background: ${(props) => {
    if (props.isSystem) return "transparent";
    if (props.isOwn)
      return props.theme.isDark
        ? "linear-gradient(135deg, #007bff 0%, #0056b3 100%)"
        : "linear-gradient(135deg, #007bff 0%, #0056b3 100%)";
    return props.theme.isDark
      ? "linear-gradient(135deg, #404040 0%, #4a4a4a 100%)"
      : "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)";
  }};

  color: ${(props) => {
    if (props.isSystem) return props.theme.isDark ? "#888" : "#666";
    if (props.isOwn) return "#ffffff";
    return props.theme.isDark ? "#ffffff" : "#333333";
  }};

  padding: ${(props) => (props.isSystem ? "8px 16px" : "12px 16px")};

  border-radius: ${(props) => {
    if (props.isSystem) return "25px";
    if (props.isOwn) return "20px 20px 6px 20px";
    return "20px 20px 20px 6px";
  }};

  border: ${(props) => {
    if (props.isSystem)
      return `2px dashed ${props.theme.isDark ? "#555" : "#ccc"}`;
    if (!props.isOwn && !props.isSystem)
      return props.theme.isDark
        ? "1px solid rgba(255, 255, 255, 0.1)"
        : "1px solid rgba(0, 0, 0, 0.05)";
    return "none";
  }};

  word-wrap: break-word;
  font-size: 0.95rem;
  line-height: 1.5;
  font-style: ${(props) => (props.isSystem ? "italic" : "normal")};
  text-align: ${(props) => (props.isSystem ? "center" : "left")};
  font-weight: ${(props) => (props.isSystem ? "400" : "500")};

  box-shadow: ${(props) => {
    if (props.isSystem) return "none";
    if (props.isOwn)
      return props.theme.isDark
        ? "0 4px 12px rgba(0, 123, 255, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)"
        : "0 4px 12px rgba(0, 123, 255, 0.2), 0 2px 4px rgba(0, 0, 0, 0.1)";
    return props.theme.isDark
      ? "0 4px 12px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)"
      : "0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)";
  }};

  position: relative;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: ${(props) => {
      if (props.isSystem) return "none";
      if (props.isOwn)
        return props.theme.isDark
          ? "0 6px 20px rgba(0, 123, 255, 0.4), 0 4px 8px rgba(0, 0, 0, 0.3)"
          : "0 6px 20px rgba(0, 123, 255, 0.3), 0 4px 8px rgba(0, 0, 0, 0.15)";
      return props.theme.isDark
        ? "0 6px 20px rgba(0, 0, 0, 0.4), 0 4px 8px rgba(0, 0, 0, 0.3)"
        : "0 6px 20px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)";
    }};
  }

  ${(props) =>
    props.isSystem &&
    `
    margin: 8px auto;
    max-width: 320px;
    backdrop-filter: blur(10px);
  `}

  @media (max-width: 480px) {
    font-size: 0.9rem;
    padding: ${(props) => (props.isSystem ? "8px 16px" : "12px 16px")};
  }
`;

const TypingIndicator = styled.div`
  position: absolute;
  bottom: 100px; /* Position above input area */
  left: 20px;
  right: 20px;
  padding: 10px 20px;
  color: ${(props) => (props.theme.isDark ? "#888" : "#666")};
  font-style: italic;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;
  animation: fadeIn 0.3s ease-in;
  background: ${(props) =>
    props.theme.isDark
      ? "rgba(45, 45, 45, 0.95)"
      : "rgba(255, 255, 255, 0.95)"};
  border-radius: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid ${(props) => (props.theme.isDark ? "#444" : "#e0e0e0")};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 768px) {
    bottom: 90px;
    left: 15px;
    right: 15px;
    padding: 8px 16px;
    font-size: 0.85rem;
  }

  @media (max-width: 480px) {
    bottom: 80px;
    left: 10px;
    right: 10px;
    padding: 8px 16px;
    font-size: 0.85rem;
  }
`;

const TypingDots = styled.div`
  display: flex;
  gap: 3px;

  span {
    width: 8px;
    height: 8px;
    background: ${(props) => (props.theme.isDark ? "#007bff" : "#007bff")};
    border-radius: 50%;
    animation: typing 1.4s infinite ease-in-out;

    &:nth-child(1) {
      animation-delay: 0s;
    }
    &:nth-child(2) {
      animation-delay: 0.2s;
    }
    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }

  @keyframes typing {
    0%,
    60%,
    100% {
      transform: translateY(0);
      opacity: 0.4;
      background: ${(props) => (props.theme.isDark ? "#666" : "#999")};
    }
    30% {
      transform: translateY(-8px);
      opacity: 1;
      background: ${(props) => (props.theme.isDark ? "#007bff" : "#007bff")};
    }
  }
`;

const InputArea = styled.div`
  background: ${(props) =>
    props.theme.isDark
      ? "linear-gradient(135deg, rgba(45, 45, 45, 0.95) 0%, rgba(60, 60, 60, 0.95) 100%)"
      : "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 249, 250, 0.95) 100%)"};
  backdrop-filter: blur(20px);
  padding: 25px;
  border-top: 1px solid
    ${(props) =>
      props.theme.isDark
        ? "rgba(68, 68, 68, 0.5)"
        : "rgba(224, 224, 224, 0.5)"};
  border-radius: 20px 20px 0 0;
  box-shadow: ${(props) =>
    props.theme.isDark
      ? "0 -8px 32px rgba(0, 0, 0, 0.3), 0 -2px 8px rgba(0, 0, 0, 0.2)"
      : "0 -8px 32px rgba(0, 0, 0, 0.1), 0 -2px 8px rgba(0, 0, 0, 0.05)"};
  flex-shrink: 0;

  @media (max-width: 768px) {
    padding: 16px;
    border-radius: 15px 15px 0 0;
  }

  @media (max-width: 480px) {
    padding: 12px;
    border-radius: 12px 12px 0 0;
    min-height: auto;
  }
`;

const InputContainer = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: nowrap;

  @media (max-width: 768px) {
    gap: 8px;
  }

  @media (max-width: 480px) {
    gap: 6px;
    flex-wrap: nowrap;
    overflow-x: visible;
  }
`;

const Input = styled.input`
  flex: 1;
  min-width: 0;
  padding: 16px 20px;
  border: 2px solid
    ${(props) =>
      props.theme.isDark
        ? "rgba(85, 85, 85, 0.5)"
        : "rgba(224, 224, 224, 0.5)"};
  border-radius: 25px;
  font-size: 15px;
  height: 50px;
  background: ${(props) =>
    props.theme.isDark
      ? "linear-gradient(135deg, rgba(61, 61, 61, 0.8) 0%, rgba(80, 80, 80, 0.8) 100%)"
      : "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 249, 250, 0.9) 100%)"};
  backdrop-filter: blur(10px);
  color: ${(props) => (props.theme.isDark ? "#ffffff" : "#333333")};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
  box-shadow: ${(props) =>
    props.theme.isDark
      ? "inset 0 2px 4px rgba(0, 0, 0, 0.2)"
      : "inset 0 2px 4px rgba(0, 0, 0, 0.05)"};

  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: ${(props) =>
      props.theme.isDark
        ? "0 0 0 4px rgba(0, 123, 255, 0.2), inset 0 2px 4px rgba(0, 0, 0, 0.2)"
        : "0 0 0 4px rgba(0, 123, 255, 0.1), inset 0 2px 4px rgba(0, 0, 0, 0.05)"};
    transform: translateY(-1px);
  }

  &::placeholder {
    color: ${(props) => (props.theme.isDark ? "#aaa" : "#999")};
    font-weight: 400;
  }

  @media (max-width: 480px) {
    padding: 12px 16px;
    height: 44px;
    font-size: 14px;
    border-radius: 22px;
  }
`;

const SendButton = styled.button`
  background: ${(props) =>
    props.disabled
      ? props.theme.isDark
        ? "#555"
        : "#ccc"
      : "linear-gradient(135deg, #007bff 0%, #0056b3 100%)"};
  color: white;
  border: none;
  padding: 12px;
  border-radius: 50%;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  font-size: 16px;
  flex-shrink: 0;
  box-shadow: ${(props) =>
    props.disabled
      ? "none"
      : props.theme.isDark
      ? "0 4px 12px rgba(0, 123, 255, 0.4), 0 2px 4px rgba(0, 0, 0, 0.2)"
      : "0 4px 12px rgba(0, 123, 255, 0.3), 0 2px 4px rgba(0, 0, 0, 0.1)"};

  &:hover:not(:disabled) {
    transform: translateY(-3px) scale(1.05);
    box-shadow: ${(props) =>
      props.theme.isDark
        ? "0 8px 25px rgba(0, 123, 255, 0.5), 0 4px 8px rgba(0, 0, 0, 0.3)"
        : "0 8px 25px rgba(0, 123, 255, 0.4), 0 4px 8px rgba(0, 0, 0, 0.15)"};
    background: linear-gradient(135deg, #0056b3 0%, #004085 100%);
  }

  &:active:not(:disabled) {
    transform: translateY(-1px) scale(1.02);
  }

  &:disabled {
    opacity: 0.6;
  }

  @media (max-width: 480px) {
    width: 44px;
    height: 44px;
    padding: 10px;
    font-size: 14px;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${(props) => (props.theme.isDark ? "#ccc" : "#666")};
  text-align: center;
  padding: 40px 20px;

  h3 {
    font-size: 1.5rem;
    margin-bottom: 12px;
    background: ${(props) =>
      props.theme.isDark
        ? "linear-gradient(135deg, #ffffff 0%, #cccccc 100%)"
        : "linear-gradient(135deg, #333333 0%, #666666 100%)"};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  p {
    font-size: 1rem;
    opacity: 0.8;
    max-width: 300px;
    line-height: 1.5;
  }
`;

const ReplyPreview = styled.div`
  background: ${(props) =>
    props.theme.isDark ? "rgba(68, 68, 68, 0.8)" : "rgba(248, 249, 250, 0.9)"};
  backdrop-filter: blur(10px);
  border-left: 4px solid #007bff;
  padding: 12px 16px;
  margin-bottom: 12px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  animation: slideDown 0.3s ease-out;

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const ReplyContent = styled.div`
  flex: 1;

  .reply-to {
    font-size: 0.8rem;
    color: #007bff;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .reply-message {
    font-size: 0.9rem;
    color: ${(props) => (props.theme.isDark ? "#ccc" : "#666")};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 200px;
  }
`;

const ReplyCloseButton = styled.button`
  background: transparent;
  border: none;
  color: ${(props) => (props.theme.isDark ? "#ccc" : "#666")};
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;

  &:hover {
    background: ${(props) =>
      props.theme.isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)"};
    color: #dc3545;
  }
`;

const SwipeIndicator = styled.div`
  position: absolute;
  right: ${(props) => (props.isOwn ? "auto" : "10px")};
  left: ${(props) => (props.isOwn ? "10px" : "auto")};
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 123, 255, 0.8);
  color: white;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${(props) => (props.show ? 1 : 0)};
  transition: opacity 0.2s ease;
  z-index: 10;
`;

const ReplyMessagePreview = styled.div`
  background: ${(props) =>
    props.theme.isDark ? "rgba(68, 68, 68, 0.6)" : "rgba(248, 249, 250, 0.8)"};
  border-left: 3px solid #007bff;
  padding: 8px 12px;
  margin-bottom: 6px;
  border-radius: 8px;
  font-size: 0.85rem;
  color: ${(props) => (props.theme.isDark ? "#ccc" : "#666")};
  backdrop-filter: blur(5px);
  border: 1px solid
    ${(props) =>
      props.theme.isDark ? "rgba(0, 123, 255, 0.2)" : "rgba(0, 123, 255, 0.1)"};

  .reply-username {
    color: #007bff;
    font-weight: 600;
    font-size: 0.8rem;
    margin-bottom: 2px;
    display: flex;
    align-items: center;
    gap: 4px;

    &::before {
      content: "↳";
      font-size: 0.9rem;
      opacity: 0.7;
    }
  }

  .reply-content {
    opacity: 0.8;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
    font-style: italic;
  }
`;

const MessageReactions = styled.div`
  display: flex;
  gap: 6px;
  margin-top: 6px;
  align-items: center;
  justify-content: ${(props) => (props.isOwn ? "flex-end" : "flex-start")};
  padding: 0 4px;

  /* Position reactions slightly overlapping the message bubble */
  margin-top: -8px;
  position: relative;
  z-index: 2;
`;

const ReactionButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  position: relative;

  &:hover {
    background: rgba(231, 76, 60, 0.1);
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.9);
  }

  &::before {
    content: "";
    position: absolute;
    inset: -2px;
    border-radius: 50%;
    background: linear-gradient(45deg, #ff6b6b, #ee5a24);
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: -1;
  }

  &:hover::before {
    opacity: 0.1;
  }
`;

const InputActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;

  @media (max-width: 480px) {
    gap: 2px;
  }
`;

const ActionIcon = styled.button`
  background: transparent;
  border: none;
  color: ${(props) => (props.theme.isDark ? "#ccc" : "#666")};
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;

  &:hover {
    background: ${(props) =>
      props.theme.isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)"};
    color: #007bff;
    transform: scale(1.1);
  }

  @media (max-width: 480px) {
    width: 28px;
    height: 28px;
    padding: 4px;
  }
`;

const ContextMenuOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const ContextMenuContainer = styled.div`
  background: ${(props) =>
    props.theme.isDark
      ? "linear-gradient(135deg, #2d2d2d 0%, #404040 100%)"
      : "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)"};
  border-radius: 16px;
  padding: 8px;
  box-shadow: ${(props) =>
    props.theme.isDark
      ? "0 20px 60px rgba(0, 0, 0, 0.5), 0 8px 24px rgba(0, 0, 0, 0.3)"
      : "0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 24px rgba(0, 0, 0, 0.1)"};
  border: 1px solid
    ${(props) =>
      props.theme.isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)"};
  backdrop-filter: blur(20px);
  max-width: 90vw;
  max-height: 80vh;
  overflow-y: auto;
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: ${(props) => (props.theme.isDark ? "#555" : "#ccc")};
    border-radius: 3px;
  }
`;

const ContextMenuGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
  max-width: 480px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
    max-width: 360px;
  }

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
    max-width: 280px;
  }
`;

const ContextMenuItem = styled.button`
  background: ${(props) =>
    props.theme.isDark ? "rgba(68, 68, 68, 0.6)" : "rgba(248, 249, 250, 0.8)"};
  border: 1px solid
    ${(props) =>
      props.theme.isDark
        ? "rgba(85, 85, 85, 0.4)"
        : "rgba(222, 226, 230, 0.4)"};
  color: ${(props) => {
    if (props.danger) return "#dc3545";
    if (props.primary) return "#007bff";
    return props.theme.isDark ? "#ffffff" : "#333333";
  }};
  padding: 12px 8px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 500;
  text-align: center;
  backdrop-filter: blur(10px);
  min-height: 70px;
  justify-content: center;

  &:hover {
    background: ${(props) => {
      if (props.danger) return "rgba(220, 53, 69, 0.1)";
      if (props.primary) return "rgba(0, 123, 255, 0.1)";
      return props.theme.isDark
        ? "rgba(85, 85, 85, 0.8)"
        : "rgba(233, 236, 239, 0.9)";
    }};
    transform: translateY(-2px) scale(1.02);
    box-shadow: ${(props) =>
      props.theme.isDark
        ? "0 8px 20px rgba(0, 0, 0, 0.4)"
        : "0 8px 20px rgba(0, 0, 0, 0.15)"};
    border-color: ${(props) => {
      if (props.danger) return "rgba(220, 53, 69, 0.3)";
      if (props.primary) return "rgba(0, 123, 255, 0.3)";
      return props.theme.isDark
        ? "rgba(85, 85, 85, 0.6)"
        : "rgba(222, 226, 230, 0.6)";
    }};
  }

  &:active {
    transform: translateY(0) scale(0.98);
  }

  svg {
    font-size: 16px;
    opacity: 0.8;
  }

  span {
    line-height: 1.2;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const MessagePreview = styled.div`
  background: ${(props) =>
    props.theme.isDark ? "rgba(45, 45, 45, 0.9)" : "rgba(255, 255, 255, 0.95)"};
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid
    ${(props) =>
      props.theme.isDark
        ? "rgba(85, 85, 85, 0.5)"
        : "rgba(222, 226, 230, 0.5)"};
  backdrop-filter: blur(10px);

  .preview-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;

    .avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      object-fit: cover;
    }

    .username {
      font-weight: 600;
      font-size: 0.9rem;
      color: ${(props) => (props.theme.isDark ? "#ccc" : "#666")};
    }

    .timestamp {
      font-size: 0.8rem;
      color: ${(props) => (props.theme.isDark ? "#888" : "#999")};
      margin-left: auto;
    }
  }

  .preview-content {
    color: ${(props) => (props.theme.isDark ? "#ffffff" : "#333333")};
    font-size: 0.9rem;
    line-height: 1.4;
    max-height: 60px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }
`;

const ConversationBar = styled.div`
  position: sticky;
  top: 0;
  z-index: 100;
  background: ${(props) =>
    props.theme.isDark
      ? "linear-gradient(135deg, rgba(45, 45, 45, 0.95) 0%, rgba(60, 60, 60, 0.95) 100%)"
      : "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 249, 250, 0.95) 100%)"};
  backdrop-filter: blur(20px);
  border-bottom: 1px solid
    ${(props) =>
      props.theme.isDark
        ? "rgba(85, 85, 85, 0.3)"
        : "rgba(222, 226, 230, 0.3)"};
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: ${(props) =>
    props.theme.isDark
      ? "0 2px 20px rgba(0, 0, 0, 0.3)"
      : "0 2px 20px rgba(0, 0, 0, 0.1)"};

  .conversation-info {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;

    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid
        ${(props) =>
          props.theme.isDark
            ? "rgba(255, 255, 255, 0.1)"
            : "rgba(0, 0, 0, 0.1)"};
    }

    .details {
      display: flex;
      flex-direction: column;

      .name {
        font-weight: 600;
        font-size: 1rem;
        color: ${(props) => (props.theme.isDark ? "#ffffff" : "#333333")};
        margin: 0;
      }

      .status {
        font-size: 0.8rem;
        color: ${(props) => (props.theme.isDark ? "#aaa" : "#666")};
        margin: 0;
        display: flex;
        align-items: center;
        gap: 4px;

        .online-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #4caf50;
        }
      }
    }
  }

  .conversation-actions {
    display: flex;
    gap: 8px;
  }
`;

const ChatRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const {
    socket,
    leaveRoom,
    joinRoom,
    isConnected,
    sendMessage,
    startTyping,
    stopTyping,
    user,
  } = useSocket();
  const { messages, typingUsers, roomUsers } = useChat();
  const { theme, toggleTheme } = useTheme();
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);

  const [contextMenu, setContextMenu] = useState(null);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const touchStartRef = useRef(null);
  const touchEndRef = useRef(null);
  const doubleTapTimeoutRef = useRef(null);

  console.log("🏠 ChatRoom: Component rendered with:", {
    roomId,
    isConnected,
    user: user?.username,
    messagesCount: messages.length,
    typingUsersCount: typingUsers.length,
    roomUsersCount: roomUsers.length,
  });

  useEffect(() => {
    if (!isConnected || !user) {
      navigate("/login");
      return;
    }

    // Join the room when component mounts
    const joinCurrentRoom = async () => {
      try {
        console.log("🏠 ChatRoom: Attempting to join room:", roomId);
        await joinRoom(roomId);
        console.log("✅ ChatRoom: Successfully joined room:", roomId);
      } catch (error) {
        console.error("❌ ChatRoom: Failed to join room:", error);
        navigate("/rooms");
      }
    };

    joinCurrentRoom();
  }, [isConnected, user, navigate, joinRoom, roomId]);

  useEffect(() => {
    console.log("📝 ChatRoom: Messages updated, count:", messages.length);
    console.log("📝 ChatRoom: Current messages:", messages);
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    console.log("⌨️ ChatRoom: Typing users updated:", typingUsers);
  }, [typingUsers]);

  useEffect(() => {
    console.log("👥 ChatRoom: Room users updated:", roomUsers);
  }, [roomUsers]);

  useEffect(() => {
    if (isTyping) {
      console.log("⌨️ ChatRoom: Starting typing indicator");
      startTyping();
    } else {
      console.log("⌨️ ChatRoom: Stopping typing indicator");
      stopTyping();
    }
  }, [isTyping, startTyping, stopTyping]);

  // Cleanup long press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [longPressTimer]);

  // Handle keyboard events for context menu
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && contextMenu) {
        closeContextMenu();
      }
    };

    if (contextMenu) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [contextMenu]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    console.log("📨 ChatRoom: Attempting to send message:", newMessage.trim());

    try {
      if (replyingTo) {
        // Send message with reply data
        if (socket && isConnected) {
          socket.emit("chat-message", {
            content: newMessage.trim(),
            replyTo: replyingTo.id,
          });
        }
      } else {
        // Send regular message
        sendMessage(newMessage.trim());
      }

      setNewMessage("");
      setReplyingTo(null);
      setIsTyping(false);
      console.log("✅ ChatRoom: Message sent successfully");
    } catch (err) {
      console.error("❌ ChatRoom: Failed to send message:", err);
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Start typing if not already
    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
    }

    // Set new timeout to stop typing
    if (e.target.value.trim()) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 2000); // Stop typing after 2 seconds of inactivity
    } else {
      setIsTyping(false);
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleLeaveRoom = () => {
    console.log("🚪 ChatRoom: User clicked leave room");
    leaveRoom();
    navigate("/rooms");
  };

  const handleEditMessage = (messageId, currentContent) => {
    setEditingMessageId(messageId);
    setEditingContent(currentContent);
  };

  const handleLongPress = (message, event) => {
    event.preventDefault();
    setContextMenu({
      message,
      x: event.clientX || (event.touches && event.touches[0].clientX) || 0,
      y: event.clientY || (event.touches && event.touches[0].clientY) || 0,
    });
  };

  const handleMouseDown = (message, event) => {
    const timer = setTimeout(() => {
      handleLongPress(message, event);
    }, 500); // 500ms for long press
    setLongPressTimer(timer);
  };

  const handleMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const handleContextAction = (action, message) => {
    console.log(`Context action: ${action}`, message);

    switch (action) {
      case "reply":
        setReplyingTo(message);
        break;
      case "copy":
        navigator.clipboard.writeText(message.content);
        break;
      case "edit":
        if (message.userId === user?.id) {
          handleEditMessage(message.id, message.content);
        }
        break;
      case "delete":
        if (message.userId === user?.id) {
          handleDeleteMessage(message.id);
        }
        break;
      case "forward":
        // Implement forward functionality
        console.log("Forward message:", message.content);
        break;
      case "star":
        // Add heart reaction like double tap
        if (socket && isConnected) {
          socket.emit("message-reaction", {
            messageId: message._id,
            reaction: "heart",
            action: "add",
          });
        }
        break;
      case "pin":
        // Implement pin functionality
        console.log("Pin message:", message.id);
        break;
      case "info":
        // Show message info
        console.log("Message info:", message);
        break;
      case "translate":
        // Implement translation
        console.log("Translate message:", message.content);
        break;
      case "quote":
        // Quote message
        setNewMessage(`"${message.content}" - ${message.username}\n\n`);
        break;
      case "save":
        // Save message locally
        const savedMessages = JSON.parse(
          localStorage.getItem("savedMessages") || "[]"
        );
        savedMessages.push(message);
        localStorage.setItem("savedMessages", JSON.stringify(savedMessages));
        break;
      case "share":
        if (navigator.share) {
          navigator.share({
            title: "Shared Message",
            text: `${message.username}: ${message.content}`,
          });
        }
        break;
      case "report":
        // Implement report functionality
        console.log("Report message:", message.id);
        break;
      default:
        console.log(`Action ${action} not implemented yet`);
    }

    closeContextMenu();
  };

  const contextMenuItems = [
    { id: "reply", label: "Reply", icon: FaReply, primary: true },
    { id: "copy", label: "Copy", icon: FaCopy },
    { id: "forward", label: "Forward", icon: FaShareAlt },
    { id: "star", label: "Star", icon: FaStar },
    { id: "pin", label: "Pin", icon: FaThumbtack },
    { id: "info", label: "Info", icon: FaInfoCircle },
    { id: "edit", label: "Edit", icon: FaEdit },
    { id: "delete", label: "Delete", icon: FaTrash, danger: true },
    { id: "quote", label: "Quote", icon: FaQuoteLeft },
    { id: "translate", label: "Translate", icon: FaLanguage },
    { id: "save", label: "Save", icon: FaSave },
    { id: "share", label: "Share", icon: FaShare },
    { id: "report", label: "Report", icon: FaFlag, danger: true },
  ];

  const handleSaveEdit = () => {
    if (!editingContent.trim()) return;

    // Emit edit message event
    if (socket && isConnected) {
      socket.emit("edit-message", {
        messageId: editingMessageId,
        newContent: editingContent.trim(),
      });
    }

    setEditingMessageId(null);
    setEditingContent("");
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent("");
  };

  const handleDeleteMessage = (messageId) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      // Emit delete message event
      if (socket && isConnected) {
        socket.emit("delete-message", { messageId });
      }
    }
  };

  const handleClearAllMessages = () => {
    if (
      window.confirm(
        "Are you sure you want to clear all messages in this room? This action cannot be undone."
      )
    ) {
      // Emit clear all messages event
      if (socket && isConnected) {
        socket.emit("clear-all-messages", { roomId });
      }
    }
  };

  const handleReplyToMessage = (message) => {
    setReplyingTo({
      id: message._id,
      username: message.senderId?.username || "Unknown",
      content: message.content,
    });
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleDoubleTap = (message) => {
    if (message.messageType === "system") return;

    // Emit reaction to server - the server will broadcast the update
    if (socket && isConnected) {
      socket.emit("message-reaction", {
        messageId: message._id,
        reaction: "heart",
        action: "add",
      });
    }
  };

  const handleTouchStart = (e, message) => {
    if (message.messageType === "system") return;

    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
      messageId: message._id,
    };

    // Start long press timer
    const timer = setTimeout(() => {
      handleLongPress(message, e);
    }, 500);
    setLongPressTimer(timer);
  };

  const handleTouchMove = (e, message) => {
    if (!touchStartRef.current || message.messageType === "system") return;

    const currentX = e.touches[0].clientX;
    const deltaX = currentX - touchStartRef.current.x;

    // Only allow swipe in the correct direction
    const isOwnMessage =
      message.senderId &&
      user &&
      (message.senderId._id === user.userId ||
        message.senderId === user.userId ||
        message.senderId.toString() === user.userId.toString());

    const maxSwipe = 60;
    const swipeThreshold = 30;

    if ((isOwnMessage && deltaX < 0) || (!isOwnMessage && deltaX > 0)) {
      const swipeOffset =
        Math.min(Math.abs(deltaX), maxSwipe) * (deltaX < 0 ? -1 : 1);

      // Update the message transform
      const messageElement = e.currentTarget;
      messageElement.style.transform = `translateX(${swipeOffset}px)`;

      // Show/hide swipe indicator
      const indicator = messageElement.querySelector(".swipe-indicator");
      if (indicator) {
        indicator.style.opacity =
          Math.abs(swipeOffset) > swipeThreshold ? "1" : "0";
      }
    }
  };

  const handleTouchEnd = (e, message) => {
    // Clear long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    if (!touchStartRef.current || message.messageType === "system") return;

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
      time: Date.now(),
    };

    const deltaX = touchEnd.x - touchStartRef.current.x;
    const deltaY = touchEnd.y - touchStartRef.current.y;
    const deltaTime = touchEnd.time - touchStartRef.current.time;

    // Reset transform
    const messageElement = e.currentTarget;
    messageElement.style.transform = "translateX(0px)";

    // Hide swipe indicator
    const indicator = messageElement.querySelector(".swipe-indicator");
    if (indicator) {
      indicator.style.opacity = "0";
    }

    // Check for swipe gesture (horizontal swipe > 30px and < 300ms)
    if (Math.abs(deltaX) > 30 && Math.abs(deltaY) < 50 && deltaTime < 300) {
      handleReplyToMessage(message);
    }
    // Check for double tap (< 300ms and < 10px movement)
    else if (
      deltaTime < 300 &&
      Math.abs(deltaX) < 10 &&
      Math.abs(deltaY) < 10
    ) {
      if (doubleTapTimeoutRef.current) {
        // This is a double tap
        clearTimeout(doubleTapTimeoutRef.current);
        doubleTapTimeoutRef.current = null;
        handleDoubleTap(message);
      } else {
        // This might be the first tap of a double tap
        doubleTapTimeoutRef.current = setTimeout(() => {
          doubleTapTimeoutRef.current = null;
        }, 300);
      }
    }

    touchStartRef.current = null;
  };

  if (!isConnected || !user) {
    return (
      <Container theme={theme}>
        <EmptyState theme={theme}>
          <h3>Connecting to server...</h3>
          <p>Please wait while we establish a connection.</p>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container theme={theme}>
      <Header theme={theme}>
        <HeaderLeft>
          <BackButton onClick={handleLeaveRoom} theme={theme}>
            <FaArrowLeft />
            Back
          </BackButton>
          <RoomInfo>
            <RoomTitle>Room {roomId}</RoomTitle>
            <UserCount theme={theme}>
              <FaUsers />
              {roomUsers.length}/2
            </UserCount>
          </RoomInfo>
        </HeaderLeft>
        <HeaderRight>
          <ActionButton
            onClick={handleClearAllMessages}
            theme={theme}
            className="danger"
            title="Clear all messages"
          >
            <FaBroom />
          </ActionButton>
          <ActionButton
            onClick={toggleTheme}
            theme={theme}
            title="Toggle theme"
          >
            {theme.isDark ? <FaSun /> : <FaMoon />}
          </ActionButton>
        </HeaderRight>
      </Header>

      {/* Sticky Conversation Bar */}
      <ConversationBar theme={theme}>
        <div className="conversation-info">
          {(() => {
            const otherUser = roomUsers.find((u) => u.userId !== user?.userId);

            if (roomUsers.length === 0) {
              // Loading state
              return (
                <>
                  <img
                    className="avatar"
                    src={getAvatarImage("default")}
                    alt="Room avatar"
                  />
                  <div className="details">
                    <p className="name">Connecting...</p>
                    <p className="status">Loading room...</p>
                  </div>
                </>
              );
            } else if (roomUsers.length === 1) {
              // Only you in the room
              return (
                <>
                  <img
                    className="avatar"
                    src={getAvatarImage("default")}
                    alt="Waiting"
                  />
                  <div className="details">
                    <p className="name">Waiting for someone...</p>
                    <p className="status">
                      Share room {roomId} to invite others
                    </p>
                  </div>
                </>
              );
            } else if (roomUsers.length === 2 && otherUser) {
              // 1-on-1 conversation
              return (
                <>
                  <img
                    className="avatar"
                    src={getAvatarImage(otherUser.avatar || "default")}
                    alt={`${otherUser.username}'s avatar`}
                  />
                  <div className="details">
                    <p className="name">{otherUser.username}</p>
                    <p className="status">
                      <span className="online-dot"></span>
                      Online
                    </p>
                  </div>
                </>
              );
            } else {
              // Group conversation
              return (
                <>
                  <img
                    className="avatar"
                    src={getAvatarImage("group")}
                    alt="Group chat"
                  />
                  <div className="details">
                    <p className="name">{roomUsers.length} participants</p>
                    <p className="status">
                      <span className="online-dot"></span>
                      {roomUsers.length} online
                    </p>
                  </div>
                </>
              );
            }
          })()}
        </div>

        <div className="conversation-actions">
          <ActionIcon theme={theme} title="Room Info">
            <FaInfoCircle />
          </ActionIcon>
        </div>
      </ConversationBar>

      <ChatArea>
        <MessagesContainer theme={theme}>
          {messages.length === 0 ? (
            <EmptyState theme={theme}>
              <h3>No messages yet</h3>
              <p>Start the conversation by sending a message!</p>
            </EmptyState>
          ) : (
            messages.map((message, index) => {
              const isOwnMessage =
                message.senderId &&
                user &&
                (message.senderId._id === user.userId ||
                  message.senderId === user.userId ||
                  message.senderId.toString() === user.userId.toString());

              // Debug: Log message reactions
              if (message.reactions) {
                console.log(
                  "💖 Message reactions:",
                  message._id,
                  message.reactions
                );
              }

              return (
                <MessageWrapper
                  key={message._id || index}
                  className="message-wrapper"
                  isOwn={isOwnMessage}
                >
                  <Message
                    isOwn={isOwnMessage}
                    isSystem={message.messageType === "system"}
                    onMouseDown={(e) => handleMouseDown(message, e)}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={(e) => handleTouchStart(e, message)}
                    onTouchEnd={(e) => handleTouchEnd(e, message)}
                    onTouchCancel={(e) => handleTouchEnd(e, message)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      handleLongPress(message, e);
                    }}
                  >
                    {message.messageType !== "system" && (
                      <>
                        <SwipeIndicator
                          className="swipe-indicator"
                          isOwn={isOwnMessage}
                          show={false}
                        >
                          <FaReply />
                        </SwipeIndicator>
                        <Avatar
                          src={getAvatarImage(message.senderId?.avatar)}
                          alt={`${message.senderId?.username || "User"} avatar`}
                          theme={theme}
                        />
                      </>
                    )}

                    <MessageBubbleContainer isOwn={isOwnMessage}>
                      {message.messageType !== "system" && (
                        <MessageHeader isOwn={isOwnMessage}>
                          <Username theme={theme}>
                            {message.senderId?.username || "Unknown"}
                          </Username>
                          <Timestamp theme={theme}>
                            {new Date(
                              message.timestamp || message.createdAt
                            ).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                            {message.isEdited && (
                              <span
                                style={{
                                  marginLeft: "5px",
                                  fontSize: "0.7rem",
                                }}
                              >
                                (edited)
                              </span>
                            )}
                          </Timestamp>
                        </MessageHeader>
                      )}

                      {editingMessageId === message._id ? (
                        <div>
                          <EditInput
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleSaveEdit();
                              } else if (e.key === "Escape") {
                                handleCancelEdit();
                              }
                            }}
                            theme={theme}
                            autoFocus
                          />
                          <EditActions>
                            <EditActionButton
                              onClick={handleCancelEdit}
                              theme={theme}
                            >
                              <FaTimes /> Cancel
                            </EditActionButton>
                            <EditActionButton
                              onClick={handleSaveEdit}
                              primary
                              theme={theme}
                            >
                              <FaCheck /> Save
                            </EditActionButton>
                          </EditActions>
                        </div>
                      ) : (
                        <div>
                          {/* Show replied message if this is a reply */}
                          {message.replyTo && (
                            <ReplyMessagePreview theme={theme}>
                              <div className="reply-username">
                                {messages.find((m) => m._id === message.replyTo)
                                  ?.senderId?.username || "Unknown"}
                              </div>
                              <div className="reply-content">
                                {messages.find((m) => m._id === message.replyTo)
                                  ?.content || "Message not found"}
                              </div>
                            </ReplyMessagePreview>
                          )}
                          <MessageContent
                            isOwn={isOwnMessage}
                            isSystem={message.messageType === "system"}
                            theme={theme}
                          >
                            {message.content}
                          </MessageContent>
                        </div>
                      )}

                      {/* Message reactions - positioned directly under the message bubble */}
                      {message.messageType !== "system" &&
                        message.reactions &&
                        message.reactions.heart > 0 && (
                          <MessageReactions isOwn={isOwnMessage}>
                            <ReactionButton theme={theme} title="Liked">
                              <FaHeart
                                style={{ color: "#e74c3c", fontSize: "16px" }}
                              />
                            </ReactionButton>
                          </MessageReactions>
                        )}
                    </MessageBubbleContainer>
                  </Message>

                  {/* Show actions for own messages only (not system messages) */}
                  {isOwnMessage &&
                    message.messageType !== "system" &&
                    editingMessageId !== message._id && (
                      <MessageActions className="message-actions">
                        <MessageActionButton
                          onClick={() =>
                            handleEditMessage(message._id, message.content)
                          }
                          theme={theme}
                          title="Edit message"
                        >
                          <FaEdit /> Edit
                        </MessageActionButton>
                        <MessageActionButton
                          onClick={() => handleDeleteMessage(message._id)}
                          theme={theme}
                          className="danger"
                          title="Delete message"
                        >
                          <FaTrash /> Delete
                        </MessageActionButton>
                      </MessageActions>
                    )}
                </MessageWrapper>
              );
            })
          )}

          <div ref={messagesEndRef} />
        </MessagesContainer>

        {typingUsers.length > 0 && (
          <TypingIndicator theme={theme}>
            {typingUsers.length === 1 ? (
              <img
                src={getAvatarImage(typingUsers[0].avatar)}
                alt={`${typingUsers[0].username} avatar`}
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  border: "2px solid #007bff",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div style={{ display: "flex", marginLeft: "-8px" }}>
                {typingUsers.slice(0, 3).map((user, index) => (
                  <img
                    key={user.userId}
                    src={getAvatarImage(user.avatar)}
                    alt={`${user.username} avatar`}
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      border: "2px solid #007bff",
                      objectFit: "cover",
                      marginLeft: index > 0 ? "-6px" : "0",
                      zIndex: 3 - index,
                    }}
                  />
                ))}
              </div>
            )}
            <TypingDots theme={theme}>
              <span></span>
              <span></span>
              <span></span>
            </TypingDots>
            <span>
              <strong>
                {typingUsers.map((user) => user.username).join(", ")}
              </strong>{" "}
              {typingUsers.length === 1 ? "is" : "are"} typing...
            </span>
          </TypingIndicator>
        )}

        <InputArea theme={theme}>
          {replyingTo && (
            <ReplyPreview theme={theme}>
              <ReplyContent theme={theme}>
                <div className="reply-to">
                  Replying to {replyingTo.username}
                </div>
                <div className="reply-message">{replyingTo.content}</div>
              </ReplyContent>
              <ReplyCloseButton onClick={handleCancelReply} theme={theme}>
                <FaTimes />
              </ReplyCloseButton>
            </ReplyPreview>
          )}
          <InputContainer>
            <Input
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              placeholder={
                replyingTo
                  ? `Reply to ${replyingTo.username}...`
                  : "Type your message..."
              }
              theme={theme}
            />
            <InputActions>
              <ActionIcon theme={theme} title="Add emoji">
                <FaSmile />
              </ActionIcon>
              <ActionIcon theme={theme} title="Attach image">
                <FaImage />
              </ActionIcon>
            </InputActions>
            <SendButton
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              theme={theme}
            >
              <FaPaperPlane />
            </SendButton>
          </InputContainer>
        </InputArea>
      </ChatArea>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenuOverlay onClick={closeContextMenu}>
          <ContextMenuContainer
            theme={theme}
            onClick={(e) => e.stopPropagation()}
          >
            <MessagePreview theme={theme}>
              <div className="preview-header">
                <img
                  className="avatar"
                  src={getAvatarImage(contextMenu.message.senderId?.avatar)}
                  alt={`${
                    contextMenu.message.senderId?.username || "User"
                  } avatar`}
                />
                <span className="username">
                  {contextMenu.message.senderId?.username || "Unknown"}
                </span>
                <span className="timestamp">
                  {new Date(
                    contextMenu.message.timestamp ||
                      contextMenu.message.createdAt
                  ).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </span>
              </div>
              <div className="preview-content">
                {contextMenu.message.content}
              </div>
            </MessagePreview>

            <ContextMenuGrid>
              {contextMenuItems.map((item) => {
                const Icon = item.icon;
                const isOwn =
                  contextMenu.message.senderId &&
                  user &&
                  (contextMenu.message.senderId._id === user.userId ||
                    contextMenu.message.senderId === user.userId ||
                    contextMenu.message.senderId.toString() ===
                      user.userId.toString());

                // Hide edit/delete for non-own messages
                if ((item.id === "edit" || item.id === "delete") && !isOwn) {
                  return null;
                }

                return (
                  <ContextMenuItem
                    key={item.id}
                    theme={theme}
                    danger={item.danger}
                    primary={item.primary}
                    onClick={() =>
                      handleContextAction(item.id, contextMenu.message)
                    }
                  >
                    <Icon />
                    <span>{item.label}</span>
                  </ContextMenuItem>
                );
              })}
            </ContextMenuGrid>
          </ContextMenuContainer>
        </ContextMenuOverlay>
      )}
    </Container>
  );
};

export default ChatRoom;
