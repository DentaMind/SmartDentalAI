import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { WebSocketStatus } from '../types/websocket';

export interface PatientNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  priority: string;
  action_url?: string;
  metadata?: any;
}

interface UsePatientNotificationsReturn {
  notifications: PatientNotification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissNotification: (id: string) => Promise<void>;
  connectionStatus: WebSocketStatus;
  refreshNotifications: () => Promise<void>;
}

/**
 * Hook for managing patient notifications both via API and WebSocket
 * 
 * @param patientId The ID of the patient to get notifications for
 * @returns Notifications state and methods
 */
export const usePatientNotifications = (patientId: string): UsePatientNotificationsReturn => {
  const [notifications, setNotifications] = useState<PatientNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Connect to the patient notifications WebSocket endpoint
  const { status, lastMessage } = useWebSocket(`/patient-notifications/ws/${patientId}`, {
    reconnectAttempts: 10,
    reconnectInterval: 2000,
    autoReconnect: true,
  });
  
  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/patient-notifications`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching patient notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Initialize by fetching from API
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);
  
  // Process incoming WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;
    
    try {
      const notification = lastMessage as PatientNotification;
      
      // Add to notifications list if it doesn't exist
      setNotifications(prevNotifications => {
        const exists = prevNotifications.some(n => n.id === notification.id);
        if (exists) return prevNotifications;
        
        return [notification, ...prevNotifications];
      });
    } catch (error) {
      console.error('Error processing notification message:', error);
    }
  }, [lastMessage]);
  
  // Mark a notification as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/patient-notifications/${id}/read`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      
      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === id
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);
  
  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch(`/api/patient-notifications/read-all`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
      
      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({ ...notification, is_read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, []);
  
  // Dismiss a notification
  const dismissNotification = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/patient-notifications/${id}/dismiss`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to dismiss notification');
      }
      
      // Remove from local state
      setNotifications(prevNotifications =>
        prevNotifications.filter(notification => notification.id !== id)
      );
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  }, []);
  
  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);
  
  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.is_read).length;
  
  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    connectionStatus: status,
    refreshNotifications
  };
}; 