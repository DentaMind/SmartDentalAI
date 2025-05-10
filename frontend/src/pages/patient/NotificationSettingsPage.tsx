import React, { useState, useEffect } from 'react';
import { 
  Bell,
  Calendar,
  Pill,
  FileText,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';

interface NotificationPreference {
  notification_type: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  in_app_enabled: boolean;
  push_enabled: boolean;
}

type NotificationPreferences = Record<string, NotificationPreference>;

// Labels for notification types
const notificationTypeLabels: Record<string, string> = {
  appointment_reminder: 'Appointment Reminders',
  appointment_confirmed: 'Appointment Confirmations',
  appointment_cancelled: 'Appointment Cancellations',
  prescription_ready: 'Prescription Notifications',
  lab_result_ready: 'Lab Result Notifications',
  treatment_reminder: 'Treatment Reminders',
  payment_due: 'Payment Due Reminders',
  payment_received: 'Payment Confirmations',
  insurance_update: 'Insurance Updates',
  dental_hygiene_reminder: 'Dental Hygiene Reminders',
  general_announcement: 'General Announcements',
  clinical_recommendation: 'Clinical Recommendations'
};

// Icons for notification types
const notificationTypeIcons: Record<string, React.ReactNode> = {
  appointment_reminder: <Calendar className="h-5 w-5" />,
  appointment_confirmed: <Calendar className="h-5 w-5" />,
  appointment_cancelled: <Calendar className="h-5 w-5" />,
  prescription_ready: <Pill className="h-5 w-5" />,
  lab_result_ready: <FileText className="h-5 w-5" />,
  treatment_reminder: <AlertTriangle className="h-5 w-5" />,
  payment_due: <DollarSign className="h-5 w-5" />,
  payment_received: <DollarSign className="h-5 w-5" />,
  insurance_update: <Info className="h-5 w-5" />,
  dental_hygiene_reminder: <Info className="h-5 w-5" />,
  general_announcement: <Bell className="h-5 w-5" />,
  clinical_recommendation: <CheckCircle className="h-5 w-5" />
};

const NotificationSettingsPage: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Fetch notification preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/patient-notifications/preferences');
        
        if (!response.ok) {
          throw new Error('Failed to fetch notification preferences');
        }
        
        const data = await response.json();
        setPreferences(data);
      } catch (error) {
        console.error('Error fetching notification preferences:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPreferences();
  }, []);
  
  // Handle toggle changes
  const handleToggleChange = (
    notificationType: string,
    channelKey: 'email_enabled' | 'sms_enabled' | 'in_app_enabled' | 'push_enabled'
  ) => {
    setPreferences(prev => {
      const updatedPreferences = { ...prev };
      updatedPreferences[notificationType] = {
        ...updatedPreferences[notificationType],
        [channelKey]: !updatedPreferences[notificationType][channelKey]
      };
      return updatedPreferences;
    });
  };
  
  // Save updated preferences
  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Save each notification type preference
      const savePromises = Object.entries(preferences).map(([type, pref]) => {
        return fetch(`/api/patient-notifications/preferences/${type}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email_enabled: pref.email_enabled,
            sms_enabled: pref.sms_enabled,
            in_app_enabled: pref.in_app_enabled,
            push_enabled: pref.push_enabled
          })
        });
      });
      
      await Promise.all(savePromises);
      setSaveStatus('success');
      
      // Reset save status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">Notification Settings</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Choose how you would like to receive notifications from DentaMind
        </p>
      </header>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Bell className="h-5 w-5 mr-2 text-primary" />
            <h2 className="text-lg font-medium">Notification Preferences</h2>
          </div>
          <div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
            
            {saveStatus === 'success' && (
              <span className="ml-2 text-sm text-green-500">Preferences saved!</span>
            )}
            
            {saveStatus === 'error' && (
              <span className="ml-2 text-sm text-red-500">Error saving preferences</span>
            )}
          </div>
        </div>
        
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-2">Notification Type</th>
              <th className="text-center py-3 px-2">Email</th>
              <th className="text-center py-3 px-2">SMS</th>
              <th className="text-center py-3 px-2">In-App</th>
              <th className="text-center py-3 px-2">Push</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(preferences).map(([type, pref]) => (
              <tr key={type} className="border-b">
                <td className="py-4 px-2">
                  <div className="flex items-center">
                    <div className="mr-3 text-gray-500 dark:text-gray-400">
                      {notificationTypeIcons[type] || <Bell className="h-5 w-5" />}
                    </div>
                    <span>{notificationTypeLabels[type] || type}</span>
                  </div>
                </td>
                <td className="text-center py-4 px-2">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={pref.email_enabled}
                      onChange={() => handleToggleChange(type, 'email_enabled')}
                    />
                    <div className={`relative w-10 h-5 rounded-full transition-colors ${
                      pref.email_enabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                    }`}>
                      <div className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        pref.email_enabled ? 'transform translate-x-5' : ''
                      }`}></div>
                    </div>
                  </label>
                </td>
                <td className="text-center py-4 px-2">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={pref.sms_enabled}
                      onChange={() => handleToggleChange(type, 'sms_enabled')}
                    />
                    <div className={`relative w-10 h-5 rounded-full transition-colors ${
                      pref.sms_enabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                    }`}>
                      <div className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        pref.sms_enabled ? 'transform translate-x-5' : ''
                      }`}></div>
                    </div>
                  </label>
                </td>
                <td className="text-center py-4 px-2">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={pref.in_app_enabled}
                      onChange={() => handleToggleChange(type, 'in_app_enabled')}
                    />
                    <div className={`relative w-10 h-5 rounded-full transition-colors ${
                      pref.in_app_enabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                    }`}>
                      <div className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        pref.in_app_enabled ? 'transform translate-x-5' : ''
                      }`}></div>
                    </div>
                  </label>
                </td>
                <td className="text-center py-4 px-2">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={pref.push_enabled}
                      onChange={() => handleToggleChange(type, 'push_enabled')}
                    />
                    <div className={`relative w-10 h-5 rounded-full transition-colors ${
                      pref.push_enabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                    }`}>
                      <div className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        pref.push_enabled ? 'transform translate-x-5' : ''
                      }`}></div>
                    </div>
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
          <h3 className="text-md font-medium mb-2">About Notifications</h3>
          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span><strong>Email notifications</strong> will be sent to your registered email address.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span><strong>SMS notifications</strong> will be sent to your registered phone number.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span><strong>In-app notifications</strong> appear in the notification center when you're using DentaMind.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span><strong>Push notifications</strong> will be sent to your devices if you have the DentaMind mobile app installed.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettingsPage; 