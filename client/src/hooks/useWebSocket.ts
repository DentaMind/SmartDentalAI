/**
 * WebSocket Hook
 * 
 * React hook for using the WebSocket service with type-safety and proper
 * cleanup when components unmount.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import websocketService, { WebSocketEvents } from '../services/websocketService';
import { 
  ServerMessage, 
  ClientMessage, 
  WebSocketStatus,
  MessageHandler,
  isMessageType
} from '../types/websocket-contracts';
import { getToken } from '../utils/auth';

// WebSocket hook options
export interface UseWebSocketOptions {
  autoConnect?: boolean;
  onOpen?: WebSocketEvents['open'];
  onClose?: WebSocketEvents['close'];
  onError?: WebSocketEvents['error'];
  onMessage?: WebSocketEvents['message'];
  onStatusChange?: WebSocketEvents['statusChange'];
  onReconnect?: WebSocketEvents['reconnect'];
}

// WebSocket hook return type
export interface UseWebSocketResult {
  status: WebSocketStatus;
  sendMessage: (message: ClientMessage) => boolean;
  connect: () => void;
  disconnect: () => void;
  lastMessage: ServerMessage | null;
  isConnected: boolean;
}

/**
 * React hook for WebSocket functionality
 */
export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketResult {
  // Track connection status
  const [status, setStatus] = useState<WebSocketStatus>(websocketService.getStatus());
  
  // Track the last received message
  const [lastMessage, setLastMessage] = useState<ServerMessage | null>(null);
  
  // Keep track of whether component is mounted
  const isMounted = useRef(true);
  
  // Handle status changes
  const handleStatusChange = useCallback((newStatus: WebSocketStatus) => {
    if (isMounted.current) {
      setStatus(newStatus);
    }
    
    // Call user handler if provided
    if (options.onStatusChange) {
      options.onStatusChange(newStatus);
    }
  }, [options.onStatusChange]);
  
  // Handle received messages
  const handleMessage = useCallback((message: ServerMessage) => {
    if (isMounted.current) {
      setLastMessage(message);
    }
    
    // Call user handler if provided
    if (options.onMessage) {
      options.onMessage(message);
    }
  }, [options.onMessage]);
  
  // Connect to WebSocket
  const connect = useCallback(() => {
    // Authenticate on connect if we have a token
    const token = getToken();
    if (token) {
      // Register one-time handler for when connection opens
      const handleOpen = () => {
        websocketService.send({
          type: 'auth',
          token
        });
        
        // Remove this one-time handler
        websocketService.off('open', handleOpen);
      };
      
      websocketService.on('open', handleOpen);
    }
    
    websocketService.connect();
  }, []);
  
  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    websocketService.disconnect();
  }, []);
  
  // Send a message
  const sendMessage = useCallback((message: ClientMessage): boolean => {
    return websocketService.send(message);
  }, []);
  
  // Setup event listeners when component mounts
  useEffect(() => {
    // Set the mounted flag
    isMounted.current = true;
    
    // Register event handlers
    websocketService.on('statusChange', handleStatusChange);
    websocketService.on('message', handleMessage);
    
    if (options.onOpen) websocketService.on('open', options.onOpen);
    if (options.onClose) websocketService.on('close', options.onClose);
    if (options.onError) websocketService.on('error', options.onError);
    if (options.onReconnect) websocketService.on('reconnect', options.onReconnect);
    
    // Auto-connect if specified and not already connected
    if (options.autoConnect !== false && status === 'closed') {
      connect();
    }
    
    // Cleanup when component unmounts
    return () => {
      isMounted.current = false;
      
      // Remove event handlers
      websocketService.off('statusChange', handleStatusChange);
      websocketService.off('message', handleMessage);
      
      if (options.onOpen) websocketService.off('open', options.onOpen);
      if (options.onClose) websocketService.off('close', options.onClose);
      if (options.onError) websocketService.off('error', options.onError);
      if (options.onReconnect) websocketService.off('reconnect', options.onReconnect);
    };
  }, [
    handleStatusChange, 
    handleMessage, 
    options.onOpen, 
    options.onClose, 
    options.onError,
    options.onReconnect,
    options.autoConnect,
    status,
    connect
  ]);
  
  return {
    status,
    sendMessage,
    connect,
    disconnect,
    lastMessage,
    isConnected: status === 'open'
  };
}

/**
 * Hook for subscribing to specific message types
 */
export function useWebSocketMessage<T extends ServerMessage['type']>(
  messageType: T,
  handler: MessageHandler<Extract<ServerMessage, { type: T }>>,
  deps: any[] = []
): void {
  useEffect(() => {
    // Add handler for this message type
    websocketService.onMessageType(messageType, handler);
    
    // Remove handler when component unmounts or deps change
    return () => {
      websocketService.offMessageType(messageType, handler);
    };
  }, [messageType, handler, ...deps]);
}

/**
 * Hook for tracking notifications
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<ServerMessage[]>([]);
  const { status, lastMessage, sendMessage } = useWebSocket();
  
  // Process incoming notification messages
  useEffect(() => {
    if (lastMessage && isMessageType(lastMessage, 'notification')) {
      setNotifications(prev => [...prev, lastMessage]);
    }
  }, [lastMessage]);
  
  // Mark a notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, is_read: true } 
          : notification
      )
    );
    
    // Also notify the server
    if (status === 'open') {
      sendMessage({
        type: 'mark_notification_read',
        notification_id: notificationId
      } as any);
    }
  }, [status, sendMessage]);
  
  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, is_read: true }))
    );
    
    // Also notify the server
    if (status === 'open') {
      sendMessage({
        type: 'mark_all_notifications_read'
      } as any);
    }
  }, [status, sendMessage]);
  
  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.is_read).length;
  
  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  };
}

export default useWebSocket; 