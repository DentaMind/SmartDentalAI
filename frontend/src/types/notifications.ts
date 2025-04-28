export type NotificationType = 
  | 'claim_submitted'
  | 'claim_denied'
  | 'payment_received'
  | 'appeal_submitted'
  | 'appeal_approved'
  | 'appeal_denied'
  | 'system_alert';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  claimNumber?: string;
  amount?: number;
  patientName?: string;
  insuranceCompany?: string;
  actionUrl?: string;
  metadata?: {
    [key: string]: any;
  };
}

export interface NotificationSettings {
  emailNotifications: boolean;
  inAppNotifications: boolean;
  notificationTypes: {
    [key in NotificationType]: boolean;
  };
  soundEnabled: boolean;
  desktopNotifications: boolean;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  settings: NotificationSettings;
  loading: boolean;
  error: string | null;
} 