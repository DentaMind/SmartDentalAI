'use client';

import { useEffect, useState } from 'react';
import { Bell, Calendar, Tooth, Flask, CreditCard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useRouter } from 'next/navigation';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'appointment_created':
      return <Calendar className="w-4 h-4 text-blue-500" />;
    case 'diagnosis_added':
      return <Tooth className="w-4 h-4 text-green-500" />;
    case 'lab_case_overdue':
      return <Flask className="w-4 h-4 text-purple-500" />;
    case 'insurance_claim_rejected':
      return (
        <div className="flex items-center gap-1">
          <CreditCard className="w-4 h-4 text-red-500" />
          <X className="w-3 h-3 text-red-500" />
        </div>
      );
    default:
      return <Bell className="w-4 h-4 text-gray-500" />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'appointment_created':
      return 'border-blue-200 bg-blue-50';
    case 'diagnosis_added':
      return 'border-green-200 bg-green-50';
    case 'lab_case_overdue':
      return 'border-purple-200 bg-purple-50';
    case 'insurance_claim_rejected':
      return 'border-red-200 bg-red-50';
    default:
      return 'border-gray-200 bg-gray-50';
  }
};

export function NotificationBell({ userId }: { userId: number }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const router = useRouter();

  const fetchNotifications = async () => {
    const res = await fetch(`/api/notifications?userId=${userId}`);
    const data = await res.json();
    setNotifications(data.notifications);
    setUnreadCount(data.notifications.filter((n: any) => !n.read).length);
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  async function markAsRead(id: number) {
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }

  const handleNotificationClick = (n: any) => {
    markAsRead(n.id);
    const patientId = n.metadata?.patientId;
    if (patientId) {
      router.push(`/patients/${patientId}`);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute top-0 right-0 text-xs px-1">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 max-h-96 overflow-y-auto p-2 space-y-2">
        {notifications.length === 0 && (
          <p className="text-sm text-gray-500">No notifications</p>
        )}
        {notifications.map(n => (
          <div
            key={n.id}
            className={`border rounded p-2 cursor-pointer flex items-start gap-2 ${
              n.read ? 'bg-white' : getNotificationColor(n.type)
            }`}
            onClick={() => handleNotificationClick(n)}
          >
            <div className="mt-0.5">{getNotificationIcon(n.type)}</div>
            <div className="flex-1">
              <div className="text-sm font-medium">
                {n.message}
                {n.metadata?.patientName && (
                  <span className="ml-1 italic text-gray-600">
                    ({n.metadata.patientName})
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {new Date(n.createdAt).toLocaleString()} –{' '}
                {n.type.replace(/_/g, ' ')}
              </div>
            </div>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
} 