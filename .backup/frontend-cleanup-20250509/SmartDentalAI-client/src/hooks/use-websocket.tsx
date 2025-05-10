
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './use-auth';

interface WebSocketContextType {
  isConnected: boolean;
  error: string | null;
  send: (data: any) => void;
  subscribe: (topic: string) => Promise<boolean>;
  notifications: Notification[];
  hasUnreadNotifications: boolean;
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  createdAt: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actions?: Array<{
    label: string;
    url?: string;
    action?: string;
  }>;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Connect to WebSocket when user is authenticated
  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }
    
    // Get the token
    const token = localStorage.getItem('token');
    if (!token) return;
    
    // Create WebSocket connection
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
    
    const newSocket = new WebSocket(wsUrl);
    
    newSocket.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setError(null);
      
      // Authenticate with the server
      newSocket.send(JSON.stringify({
        type: 'auth',
        token
      }));
    };
    
    newSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message:', data);
        
        // Handle different message types
        if (data.type === 'notifications') {
          setNotifications(data.notifications.map((n: any) => ({
            ...n,
            createdAt: new Date(n.createdAt)
          })));
        }
        else if (data.type === 'notification') {
          setNotifications(prev => [
            {
              ...data.notification,
              createdAt: new Date(data.notification.createdAt)
            },
            ...prev
          ]);
        }
        else if (data.type === 'error') {
          setError(data.message);
        }
      } catch (err) {
        console.error('WebSocket message parse error:', err);
      }
    };
    
    newSocket.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      
      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (user) {
          // Only reconnect if still logged in
          console.log('Attempting to reconnect WebSocket...');
        }
      }, 3000);
    };
    
    newSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('WebSocket connection error');
    };
    
    setSocket(newSocket);
    
    // Clean up on unmount
    return () => {
      newSocket.close();
    };
  }, [user]);
  
  // Send a message through the WebSocket
  const send = (data: any) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return;
    }
    
    socket.send(JSON.stringify(data));
  };
  
  // Subscribe to a topic
  const subscribe = async (topic: string): Promise<boolean> => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return false;
    }
    
    return new Promise((resolve) => {
      // Set up a one-time listener for the subscribe response
      const messageHandler = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'subscribe_success' && data.topic === topic) {
            socket.removeEventListener('message', messageHandler);
            resolve(true);
          } 
          else if (data.type === 'error' && data.topic === topic) {
            socket.removeEventListener('message', messageHandler);
            resolve(false);
          }
        } catch (err) {
          // Ignore parsing errors for this listener
        }
      };
      
      socket.addEventListener('message', messageHandler);
      
      // Send the subscription request
      send({
        type: 'subscribe',
        topic
      });
      
      // Set a timeout to resolve as failure if no response
      setTimeout(() => {
        socket.removeEventListener('message', messageHandler);
        resolve(false);
      }, 5000);
    });
  };
  
  // Check if there are any unread notifications
  const hasUnreadNotifications = notifications.some(n => !n.read);
  
  // Mark a notification as read
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        credentials: 'include'
      });
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };
  
  // Mark all notifications as read
  const markAllNotificationsAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        credentials: 'include'
      });
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };
  
  return (
    <WebSocketContext.Provider 
      value={{ 
        isConnected, 
        error, 
        send,
        subscribe,
        notifications,
        hasUnreadNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
