import React, { useState, useEffect } from 'react';
import { 
  Bell, X, Info, AlertTriangle, CheckCircle, 
  MessageSquare, Calendar, User, Clock, Pill,
  DollarSign, FileText, Settings
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { usePatientNotifications } from '@/hooks/usePatientNotifications';

interface PatientNotificationCenterProps {
  maxHeight?: string;
  className?: string;
  patientId: string;
}

export const PatientNotificationCenter: React.FC<PatientNotificationCenterProps> = ({
  maxHeight = '400px',
  className,
  patientId
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    dismissNotification,
    connectionStatus
  } = usePatientNotifications(patientId);

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
      case 'appointment_reminder':
      case 'appointment_confirmed':
      case 'appointment_cancelled':
        return <Calendar className="h-5 w-5 text-primary" />;
      case 'prescription_ready':
        return <Pill className="h-5 w-5 text-indigo-500" />;
      case 'lab_result_ready':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'payment_due':
      case 'payment_received':
        return <DollarSign className="h-5 w-5 text-green-500" />;
      case 'treatment_reminder':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'dental_hygiene_reminder':
        return <Info className="h-5 w-5 text-cyan-500" />;
      case 'clinical_recommendation':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      default:
        return <MessageSquare className="h-5 w-5 text-gray-500" />;
    }
  };

  // Get priority color class
  const getPriorityColorClass = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-4 border-red-500';
      case 'high':
        return 'border-l-4 border-orange-500';
      case 'medium':
        return 'border-l-4 border-blue-500';
      case 'low':
      default:
        return '';
    }
  };

  return (
    <div className={cn("relative", className)} data-notification-center>
      {/* Notification bell icon */}
      <button
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
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
        <div className="absolute right-0 mt-2 w-96 z-50 rounded-md border bg-white dark:bg-gray-900 shadow-lg">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-medium">Your Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                >
                  Mark all as read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={() => window.location.href = '/patient/notifications/settings'}
                  className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Notification settings"
                >
                  <Settings className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Close notifications"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className={`overflow-y-auto`} style={{ maxHeight }}>
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Bell className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p>No notifications</p>
                <p className="text-xs mt-1">We'll notify you about appointments, prescriptions, and other updates here.</p>
              </div>
            ) : (
              <ul className="divide-y">
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={cn(
                      "p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
                      !notification.is_read && "bg-blue-50 dark:bg-gray-800/50",
                      getPriorityColorClass(notification.priority)
                    )}
                    onClick={() => {
                      markAsRead(notification.id);
                      if (notification.action_url) {
                        window.location.href = notification.action_url;
                      }
                    }}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-sm font-medium truncate">{notification.title}</p>
                          <div className="flex items-center ml-2">
                            <span className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                dismissNotification(notification.id);
                              }}
                              className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                              title="Dismiss"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{notification.message}</p>
                        {notification.metadata?.timestamp && (
                          <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                            <Clock className="h-3 w-3 mr-1" />
                            {format(new Date(notification.metadata.timestamp), 'MMM d, h:mm a')}
                          </div>
                        )}
                        {notification.action_url && (
                          <div className="mt-2">
                            <span className="inline-block text-xs text-primary underline cursor-pointer">
                              View details
                            </span>
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
              <a
                href="/patient/notifications"
                className="block w-full py-1.5 text-center text-xs text-primary hover:underline"
              >
                View all notifications
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 