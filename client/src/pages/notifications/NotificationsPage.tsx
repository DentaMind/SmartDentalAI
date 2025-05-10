import React, { useState } from 'react';

interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'info' | 'warning' | 'alert';
}

const NotificationsPage: React.FC = () => {
  const [notifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'System Update',
      message: 'The system will undergo maintenance tonight from 12AM-2AM.',
      date: '2023-09-15T10:30:00',
      read: false,
      type: 'info'
    },
    {
      id: '2',
      title: 'New Feature Available',
      message: 'Treatment planning module has been enabled for your account.',
      date: '2023-09-14T14:15:00',
      read: true,
      type: 'info'
    }
  ]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>
      
      {notifications.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No notifications available</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map(notification => (
            <div 
              key={notification.id} 
              className={`p-4 border rounded-lg ${notification.read ? 'bg-gray-50' : 'bg-white border-blue-200'}`}
            >
              <div className="flex justify-between items-start">
                <h3 className={`font-medium ${!notification.read ? 'font-bold' : ''}`}>
                  {notification.title}
                </h3>
                <span className="text-xs text-gray-500">
                  {new Date(notification.date).toLocaleString()}
                </span>
              </div>
              <p className="mt-1 text-gray-600">{notification.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage; 