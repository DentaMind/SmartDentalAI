import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { useAuth } from './useAuth';
import { 
  WebSocketStatus, 
  ChatMessage as WSChatMessage, 
  RoomJoinedMessage,
  SendChatRequest,
  ServerMessage
} from '../types/websocket';

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  userName?: string;
  content: string;
  timestamp: string;
  isCurrentUser: boolean;
}

interface UseChatReturn {
  messages: ChatMessage[];
  sendMessage: (content: string) => boolean;
  isConnected: boolean;
  isJoined: boolean;
  connectionStatus: WebSocketStatus;
  clearMessages: () => void;
}

/**
 * Hook for chat functionality via WebSocket
 * 
 * @param roomId The ID of the room to join
 * @returns Chat state and methods
 */
export const useChat = (roomId: string): UseChatReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const { user } = useAuth();
  
  // Connect to the chat WebSocket endpoint for this room
  const { status, lastMessage, sendMessage: wssSendMessage } = useWebSocket(`ws/chat/${roomId}`, {
    reconnectAttempts: 5,
    reconnectInterval: 2000,
    autoReconnect: true,
  });
  
  // Type guards for message types
  const isRoomJoinedMessage = (message: ServerMessage): message is RoomJoinedMessage => {
    return message.type === 'room_joined';
  };
  
  const isChatMessage = (message: ServerMessage): message is WSChatMessage => {
    return message.type === 'chat_message';
  };
  
  // Process incoming WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;
    
    if (isRoomJoinedMessage(lastMessage) && lastMessage.room_id === roomId) {
      setIsJoined(true);
    } 
    else if (isChatMessage(lastMessage) && lastMessage.room_id === roomId) {
      const isCurrentUser = lastMessage.user_id === user?.id;
      
      const chatMessage: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        roomId: lastMessage.room_id,
        userId: lastMessage.user_id,
        userName: lastMessage.user_name,
        content: lastMessage.content,
        timestamp: lastMessage.timestamp,
        isCurrentUser
      };
      
      setMessages(prevMessages => [...prevMessages, chatMessage]);
    }
  }, [lastMessage, user?.id, roomId]);
  
  // Send a message to the current room
  const sendMessage = useCallback((content: string): boolean => {
    if (!content.trim() || status !== 'open' || !isJoined) {
      return false;
    }
    
    const chatRequest: SendChatRequest = {
      type: 'chat_message',
      room_id: roomId,
      content,
      timestamp: new Date().toISOString()
    };
    
    return wssSendMessage(chatRequest);
  }, [wssSendMessage, status, isJoined, roomId]);
  
  // Clear all messages from state
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);
  
  return {
    messages,
    sendMessage,
    isConnected: status === 'open',
    isJoined,
    connectionStatus: status,
    clearMessages
  };
}; 