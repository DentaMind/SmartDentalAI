import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';
import { ServerMessage, ClientMessage, WebSocketStatus } from '../types/websocket';
import { websocketClientMonitor } from '../utils/websocketClientMonitor';

interface WebSocketOptions {
  reconnectAttempts?: number;
  reconnectInterval?: number;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (data: ServerMessage) => void;
  autoReconnect?: boolean;
  enableMessageQueue?: boolean;
  maxQueueSize?: number;
}

interface WebSocketHook {
  sendMessage: (message: ClientMessage | string) => boolean;
  status: WebSocketStatus;
  lastMessage: ServerMessage | null;
  connect: () => void;
  disconnect: () => void;
  queuedMessages: number;
}

type QueuedMessage = {
  message: ClientMessage | string;
  timestamp: number;
  attempts: number;
};

/**
 * React hook for managing WebSocket connections with authentication and offline support
 * 
 * @param url The WebSocket endpoint URL (relative or absolute)
 * @param options Configuration options for the WebSocket connection
 * @returns WebSocket hook methods and state
 */
export const useWebSocket = (
  url: string,
  options: WebSocketOptions = {}
): WebSocketHook => {
  // Default options
  const {
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    onOpen,
    onClose,
    onError,
    onMessage,
    autoReconnect = true,
    enableMessageQueue = true,
    maxQueueSize = 50,
  } = options;

  // Auth hook to get the user's token
  const { getToken } = useAuth();
  
  const [status, setStatus] = useState<WebSocketStatus>('closed');
  const [lastMessage, setLastMessage] = useState<ServerMessage | null>(null);
  const [queuedMessageCount, setQueuedMessageCount] = useState<number>(0);
  
  // Use refs to avoid dependency issues with callbacks
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttemptsLeft = useRef(reconnectAttempts);
  const reconnectTimerRef = useRef<number | null>(null);
  const backoffFactor = useRef(1);
  const messageQueue = useRef<QueuedMessage[]>([]);
  const isProcessingQueue = useRef(false);

  // Persist queue to localStorage when it changes
  const persistQueue = useCallback(() => {
    if (enableMessageQueue) {
      try {
        localStorage.setItem('ws_message_queue', JSON.stringify(messageQueue.current));
        setQueuedMessageCount(messageQueue.current.length);
      } catch (error) {
        console.error('Error persisting WebSocket message queue:', error);
      }
    }
  }, [enableMessageQueue]);

  // Load queue from localStorage on initial mount
  useEffect(() => {
    if (enableMessageQueue) {
      try {
        const savedQueue = localStorage.getItem('ws_message_queue');
        if (savedQueue) {
          messageQueue.current = JSON.parse(savedQueue);
          setQueuedMessageCount(messageQueue.current.length);
        }
      } catch (error) {
        console.error('Error loading WebSocket message queue:', error);
      }
    }
  }, [enableMessageQueue]);

  // Process the message queue
  const processQueue = useCallback(async () => {
    if (!enableMessageQueue || 
        isProcessingQueue.current || 
        messageQueue.current.length === 0 || 
        status !== 'open') {
      return;
    }

    isProcessingQueue.current = true;

    try {
      // Process messages in order (oldest first)
      const currentQueue = [...messageQueue.current];
      const failedMessages: QueuedMessage[] = [];
      
      for (const item of currentQueue) {
        // Skip messages that have been attempted too many times
        if (item.attempts >= 3) {
          continue;
        }
        
        // Try to send the message
        const success = ws.current?.readyState === WebSocket.OPEN && 
          ws.current.send(typeof item.message === 'object' ? JSON.stringify(item.message) : item.message);
        
        if (!success) {
          // If sending failed, increment attempt count and keep in queue
          item.attempts++;
          failedMessages.push(item);
        }
        
        // Small delay to avoid overwhelming the connection
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Update the queue with only failed messages
      messageQueue.current = failedMessages;
      persistQueue();
    } finally {
      isProcessingQueue.current = false;
    }
  }, [persistQueue, status, enableMessageQueue]);

  // Ensure URL is correctly formatted
  const getWebSocketUrl = useCallback(() => {
    // If absolute URL, use it directly
    if (url.startsWith('ws://') || url.startsWith('wss://')) {
      return url;
    }
    
    // Get the base URL for WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const baseUrl = `${protocol}//${host}`;
    
    // Remove leading slash if present to avoid double slash
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    
    // Append token as query parameter for authentication
    const token = getToken();
    const authParam = token ? `?token=${token}` : '';
    
    return `${baseUrl}/${cleanUrl}${authParam}`;
  }, [url, getToken]);

  // Create WebSocket connection when the component mounts
  useEffect(() => {
    if (!shouldConnect) return;

    const wsUrl = options.url || getWebSocketUrl();
    setIsConnecting(true);
    setHasBeenConnected(false);

    // Calculate reconnect delay with exponential backoff
    const reconnectDelay = Math.min(
      backoffFactor * Math.pow(2, reconnectAttempts),
      maxReconnectDelay
    );

    // Create a new WebSocket connection
    const createWebSocket = () => {
      try {
        const token = localStorage.getItem('token');
        const wsUrlWithToken = token ? `${wsUrl}?token=${token}` : wsUrl;
        const socket = new WebSocket(wsUrlWithToken);
        setSocket(socket);

        // Start monitoring this WebSocket connection
        websocketClientMonitor.monitorWebSocket(socket);
        
        // Record reconnection attempt if not first connection
        if (reconnectAttempts > 0) {
          websocketClientMonitor.recordReconnectionAttempt();
        }

        socket.onopen = () => {
          setIsConnected(true);
          setIsConnecting(false);
          setHasBeenConnected(true);
          setReconnectAttempts(0);

          // Process the message queue when connection is open
          processQueue(socket);
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setLastMessage(data);
            
            // Record message received with a success
            if (data && data.type === 'pong' && data.timestamp) {
              // For ping/pong messages, we can calculate latency
              const sendTime = parseInt(data.originalTimestamp || '0');
              if (sendTime > 0) {
                const latency = Date.now() - sendTime;
                websocketClientMonitor.recordLatency(latency);
              }
            }

            // Call message handlers
            if (onMessageCallback) {
              onMessageCallback(data);
            }
          } catch (err) {
            console.error('Error parsing WebSocket message:', err);
            websocketClientMonitor.recordMessageError();
          }
        };

        socket.onclose = (event) => {
          setIsConnected(false);
          setIsConnecting(false);
          setSocket(null);

          // If the connection was previously established, attempt to reconnect
          if (hasBeenConnected && options.autoReconnect !== false) {
            console.log(`WebSocket connection closed. Reconnecting in ${reconnectDelay}ms...`);
            setReconnectAttempts((prev) => prev + 1);
            setTimeout(createWebSocket, reconnectDelay);
          }
        };

        socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          websocketClientMonitor.recordError('websocket_error', 'WebSocket error occurred');
        };
      } catch (error) {
        console.error('Error creating WebSocket connection:', error);
        websocketClientMonitor.recordError('connection_error', 'Failed to create WebSocket connection');
        
        // Still attempt to reconnect on connection error
        if (options.autoReconnect !== false) {
          console.log(`Failed to create WebSocket. Retrying in ${reconnectDelay}ms...`);
          setReconnectAttempts((prev) => prev + 1);
          setTimeout(createWebSocket, reconnectDelay);
        }
      }
    };

    // Start the WebSocket connection
    createWebSocket();

    // Start sending periodic metrics to the server
    websocketClientMonitor.startPeriodicSync();
    
    // Clean up the WebSocket connection when the component unmounts
    return () => {
      if (socket) {
        socket.close();
      }
      
      // Stop periodic metrics sync
      websocketClientMonitor.stopPeriodicSync();
    };
  }, [shouldConnect, url, reconnectAttempts]);

  // Process message queue
  const processQueue = useCallback((socket: WebSocket) => {
    if (messageQueue.length > 0) {
      console.log(`Processing ${messageQueue.length} queued messages`);
      messageQueue.forEach((message) => {
        try {
          // Add timestamp to message for latency tracking
          const messageWithTimestamp = {
            ...message,
            clientTimestamp: Date.now().toString()
          };

          // For ping messages, add original timestamp for roundtrip calculation
          if (message.type === 'ping') {
            messageWithTimestamp.originalTimestamp = Date.now().toString();
          }
          
          socket.send(JSON.stringify(messageWithTimestamp));
        } catch (error) {
          console.error('Error processing queued message:', error);
          websocketClientMonitor.recordMessageError();
        }
      });
      setMessageQueue([]);
    }
  }, [messageQueue]);

  // Send a message through the WebSocket connection
  const sendMessage = useCallback((message: any) => {
    if (!isConnected || !socket) {
      // Queue message for later if we're not connected
      setMessageQueue((queue) => [...queue, message]);
      websocketClientMonitor.recordMessageQueued();
      return false;
    }

    try {
      // Add timestamp to message for latency tracking
      const messageWithTimestamp = {
        ...message,
        clientTimestamp: Date.now().toString()
      };
      
      // For ping messages, add original timestamp for roundtrip calculation
      if (message.type === 'ping') {
        messageWithTimestamp.originalTimestamp = Date.now().toString();
      }

      socket.send(JSON.stringify(messageWithTimestamp));
      // Note: the monitoring of sent messages happens in the patched socket.send 
      // method in websocketClientMonitor
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      websocketClientMonitor.recordMessageError();
      return false;
    }
  }, [isConnected, socket]);
  
  // Connect to WebSocket with exponential backoff
  const connect = useCallback(() => {
    // Don't try to reconnect if we're already connected or connecting
    if (ws.current?.readyState === WebSocket.OPEN || 
        ws.current?.readyState === WebSocket.CONNECTING) {
      return;
    }
    
    // Clear any existing timers
    if (reconnectTimerRef.current) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    
    setStatus('connecting');
    
    // Create new WebSocket connection
    const wsUrl = getWebSocketUrl();
    const websocket = new WebSocket(wsUrl);
    
    websocket.onopen = (event) => {
      setStatus('open');
      reconnectAttemptsLeft.current = reconnectAttempts;
      backoffFactor.current = 1; // Reset backoff on successful connection
      
      // Process any queued messages
      if (enableMessageQueue && messageQueue.current.length > 0) {
        setTimeout(() => processQueue(), 500); // Small delay to ensure connection is stable
      }
      
      if (onOpen) onOpen(event);
    };
    
    websocket.onclose = (event) => {
      setStatus('closed');
      ws.current = null;
      
      if (onClose) onClose(event);
      
      // Attempt reconnection if enabled and not a clean close
      if (autoReconnect && reconnectAttemptsLeft.current > 0) {
        reconnectAttemptsLeft.current -= 1;
        
        // Use exponential backoff
        const delay = reconnectInterval * backoffFactor.current;
        backoffFactor.current = Math.min(backoffFactor.current * 1.5, 10); // Cap at 10x
        
        console.log(`WebSocket reconnecting in ${delay}ms (attempts left: ${reconnectAttemptsLeft.current})`);
        
        reconnectTimerRef.current = window.setTimeout(() => {
          connect();
        }, delay);
      } else if (reconnectAttemptsLeft.current <= 0) {
        console.warn('WebSocket reconnection attempts exhausted');
      }
    };
    
    websocket.onerror = (event) => {
      setStatus('error');
      if (onError) onError(event);
    };
    
    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ServerMessage;
        setLastMessage(data);
        if (onMessage) onMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        if (onMessage) onMessage(event.data as any);
      }
    };
    
    ws.current = websocket;
  }, [
    getWebSocketUrl, 
    reconnectAttempts, 
    reconnectInterval, 
    onOpen, 
    onClose, 
    onError, 
    onMessage, 
    autoReconnect, 
    enableMessageQueue, 
    processQueue
  ]);
  
  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    
    if (reconnectTimerRef.current) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    
    setStatus('closed');
  }, []);
  
  // Process queue when status changes to open
  useEffect(() => {
    if (status === 'open' && enableMessageQueue && messageQueue.current.length > 0) {
      processQueue();
    }
  }, [status, enableMessageQueue, processQueue]);
  
  // Connect when mounted and when token changes
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);
  
  // Set up periodic queue processing for recovery
  useEffect(() => {
    if (!enableMessageQueue) return;
    
    const interval = setInterval(() => {
      if (status === 'open' && messageQueue.current.length > 0) {
        processQueue();
      }
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, [enableMessageQueue, status, processQueue]);
  
  return {
    sendMessage,
    status,
    lastMessage,
    connect,
    disconnect,
    queuedMessages: queuedMessageCount
  };
}; 