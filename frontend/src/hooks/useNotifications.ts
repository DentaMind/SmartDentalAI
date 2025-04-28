import { useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService';
import { Notification, NotificationSettings, NotificationState } from '../types/notifications';

export const useNotifications = () => {
  const [state, setState] = useState<NotificationState>({
    notifications: [],
    unreadCount: 0,
    settings: {
      emailNotifications: true,
      inAppNotifications: true,
      notificationTypes: {
        claim_submitted: true,
        claim_denied: true,
        payment_received: true,
        appeal_submitted: true,
        appeal_approved: true,
        appeal_denied: true,
        system_alert: true,
      },
      soundEnabled: true,
      desktopNotifications: true,
    },
    loading: true,
    error: null,
  });

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [notifications, settings] = await Promise.all([
          notificationService.getNotifications(),
          notificationService.getSettings(),
        ]);

        setState(prev => ({
          ...prev,
          notifications,
          unreadCount: notifications.filter(n => !n.read).length,
          settings,
          loading: false,
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to load notifications',
          loading: false,
        }));
      }
    };

    loadInitialData();

    const unsubscribe = notificationService.subscribe((notification) => {
      setState(prev => ({
        ...prev,
        notifications: [notification, ...prev.notifications],
        unreadCount: prev.unreadCount + 1,
      }));

      // Play notification sound if enabled
      if (prev.settings.soundEnabled) {
        const audio = new Audio('/notification.mp3');
        audio.play().catch(console.error);
      }

      // Show desktop notification if enabled
      if (prev.settings.desktopNotifications && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/logo.png',
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: prev.unreadCount - 1,
      }));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const dismiss = async (id: string) => {
    try {
      await notificationService.dismiss(id);
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.filter(n => n.id !== id),
        unreadCount: prev.unreadCount - (prev.notifications.find(n => n.id === id)?.read ? 0 : 1),
      }));
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  const updateSettings = async (settings: Partial<NotificationSettings>) => {
    try {
      await notificationService.updateSettings(settings);
      setState(prev => ({
        ...prev,
        settings: { ...prev.settings, ...settings },
      }));
    } catch (error) {
      console.error('Error updating notification settings:', error);
    }
  };

  return {
    ...state,
    markAsRead,
    markAllAsRead,
    dismiss,
    updateSettings,
  };
}; 