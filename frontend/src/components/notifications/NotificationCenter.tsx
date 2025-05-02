import React, { useState, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Bell, X, Info, AlertTriangle, CheckCircle, MessageSquare, Calendar, User, Clock } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface NotificationCenterProps {
  maxHeight?: string;
  className?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  maxHeight = '400px',
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearNotifications,
    connectionStatus
  } = useNotifications();

  // Close the notification panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isOpen && !target.closest('[data-notification-center]')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Mark notifications as read when panel opens
  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      markAllAsRead();
    }
  }, [isOpen, unreadCount, markAllAsRead]);

  // Get the appropriate icon for a notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment_created':
      case 'appointment_updated':
        return <Calendar className="h-5 w-5 text-primary" />;
      case 'patient_arrived':
        return <User className="h-5 w-5 text-indigo-500" />;
      case 'notification_alert':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'chat_message':
        return <MessageSquare className="h-5 w-5 text-emerald-500" />;
      case 'notification_success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className={cn("relative", className)} data-notification-center>
      {/* Notification bell icon */}
      <button
        className="relative p-2 rounded-full hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-destructive text-xs text-white flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Connection status indicator */}
      {connectionStatus !== 'open' && (
        <span 
          className={cn(
            "absolute -top-1 -left-1 h-3 w-3 rounded-full",
            connectionStatus === 'connecting' ? "bg-amber-500" : "bg-red-500"
          )}
          title={`WebSocket is ${connectionStatus}`}
        />
      )}

      {/* Notification panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 z-50 rounded-md border bg-background shadow-lg">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-medium">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Mark all as read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1 hover:bg-muted"
                aria-label="Close notifications"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className={`overflow-y-auto`} style={{ maxHeight }}>
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <p>No notifications</p>
              </div>
            ) : (
              <ul className="divide-y">
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={cn(
                      "p-4 hover:bg-muted transition-colors",
                      !notification.read && "bg-muted/50"
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-sm font-medium truncate">{notification.title}</p>
                          <span className="flex-shrink-0 text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                        {notification.data?.timestamp && (
                          <div className="flex items-center mt-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            {format(new Date(notification.data.timestamp), 'MMM d, h:mm a')}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-2 border-t">
              <button
                onClick={clearNotifications}
                className="w-full py-1.5 text-xs rounded-md hover:bg-muted"
              >
                Clear all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 