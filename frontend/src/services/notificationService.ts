import { io, Socket } from 'socket.io-client';
import { Notification, NotificationType, NotificationSettings } from '../types/notifications';
import axios from 'axios';

class NotificationService {
  private socket: Socket | null = null;
  private listeners: ((notification: Notification) => void)[] = [];

  constructor() {
    this.connect();
  }

  private connect() {
    this.socket = io(process.env.REACT_APP_WS_URL || 'ws://localhost:8000', {
      path: '/ws/notifications',
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Connected to notification server');
    });

    this.socket.on('notification', (notification: Notification) => {
      this.listeners.forEach(listener => listener(notification));
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from notification server');
    });

    this.socket.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
    });
  }

  public subscribe(listener: (notification: Notification) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public async getNotifications(): Promise<Notification[]> {
    try {
      const response = await axios.get('/api/notifications');
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  public async markAsRead(notificationId: string): Promise<void> {
    try {
      await axios.post(`/api/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  public async markAllAsRead(): Promise<void> {
    try {
      await axios.post('/api/notifications/read-all');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  public async dismiss(notificationId: string): Promise<void> {
    try {
      await axios.delete(`/api/notifications/${notificationId}`);
    } catch (error) {
      console.error('Error dismissing notification:', error);
      throw error;
    }
  }

  public async getSettings(): Promise<NotificationSettings> {
    try {
      const response = await axios.get('/api/notifications/settings');
      return response.data;
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      throw error;
    }
  }

  public async updateSettings(settings: Partial<NotificationSettings>): Promise<void> {
    try {
      await axios.put('/api/notifications/settings', settings);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const notificationService = new NotificationService(); 