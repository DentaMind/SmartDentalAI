import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { 
  WebSocketStatus, 
  AppointmentCreatedMessage, 
  AppointmentUpdatedMessage,
  PatientArrivedMessage,
  NotificationAlertMessage,
  NotificationMessageMessage,
  ServerMessage
} from '../types/websocket';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  connectionStatus: WebSocketStatus;
}

type NotificationMessage = 
  | AppointmentCreatedMessage 
  | AppointmentUpdatedMessage 
  | PatientArrivedMessage 
  | NotificationAlertMessage 
  | NotificationMessageMessage;

/**
 * Hook for managing real-time notifications via WebSocket
 * 
 * @returns Notifications state and methods
 */
export const useNotifications = (): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Connect to the notifications WebSocket endpoint
  const { status, lastMessage } = useWebSocket('ws/notifications', {
    reconnectAttempts: 10,
    reconnectInterval: 2000,
    autoReconnect: true,
  });
  
  // Check if a message is a notification type
  const isNotificationMessage = (message: ServerMessage): message is NotificationMessage => {
    return (
      message.type === 'appointment_created' ||
      message.type === 'appointment_updated' ||
      message.type === 'patient_arrived' ||
      message.type === 'notification_alert' ||
      message.type === 'notification_message'
    );
  };
  
  // Process incoming WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;
    
    // Handle different notification types
    if (isNotificationMessage(lastMessage)) {
      // Create a standardized notification object
      const newNotification: Notification = {
        id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: lastMessage.type,
        title: getNotificationTitle(lastMessage),
        message: getNotificationMessage(lastMessage),
        timestamp: lastMessage.timestamp,
        read: false,
        data: lastMessage
      };
      
      // Add to notifications list
      setNotifications(prevNotifications => [
        newNotification,
        ...prevNotifications
      ].slice(0, 100)); // Keep only the most recent 100 notifications
    }
  }, [lastMessage]);
  
  // Helper function to determine notification title based on type
  const getNotificationTitle = (message: NotificationMessage): string => {
    switch (message.type) {
      case 'appointment_created':
        return 'New Appointment';
      case 'appointment_updated':
        return 'Appointment Updated';
      case 'patient_arrived':
        return 'Patient Check-in';
      case 'notification_alert':
        return message.title;
      case 'notification_message':
        return message.title;
      default:
        // This should never happen due to the type guard
        return 'Notification';
    }
  };
  
  // Helper function to create user-friendly notification message
  const getNotificationMessage = (message: NotificationMessage): string => {
    switch (message.type) {
      case 'appointment_created':
        const apptPatient = message.appointment?.patientName || 'A patient';
        const apptDate = new Date(message.appointment?.startTime).toLocaleDateString();
        const apptTime = new Date(message.appointment?.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `${apptPatient} has a new appointment on ${apptDate} at ${apptTime}`;
        
      case 'appointment_updated':
        return `Appointment for ${message.appointment?.patientName || 'a patient'} has been updated`;
        
      case 'patient_arrived':
        return `${message.patient?.name || 'A patient'} has arrived for their appointment`;
        
      case 'notification_alert':
      case 'notification_message':
        return message.message;
        
      default:
        // This should never happen due to the type guard
        return 'You have a new notification';
    }
  };
  
  // Mark a notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
  }, []);
  
  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => ({ ...notification, read: true }))
    );
  }, []);
  
  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);
  
  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    connectionStatus: status
  };
}; 