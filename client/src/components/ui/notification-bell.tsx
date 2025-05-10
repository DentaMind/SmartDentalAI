
import { useState } from 'react';
import { LuBell } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useWebSocket } from '@/hooks/use-websocket';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export function NotificationBell() {
  const { notifications, hasUnreadNotifications, markNotificationAsRead, markAllNotificationsAsRead } = useWebSocket();
  const [open, setOpen] = useState(false);
  
  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
  };
  
  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <LuBell className="h-5 w-5" />
          {hasUnreadNotifications && (
            <span className="absolute top-1 right-1 block w-2 h-2 rounded-full bg-red-500" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 bg-gray-50">
          <h4 className="font-medium">Notifications</h4>
          {notifications.length > 0 && (
            <Button 
              variant="link" 
              size="sm"
              onClick={() => markAllNotificationsAsRead()}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <Separator />
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p>No notifications</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-1 p-1">
              {notifications.map((notification) => (
                <Card 
                  key={notification.id}
                  className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                    notification.read ? 'bg-white' : 'bg-blue-50'
                  }`}
                  onClick={() => markNotificationAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{notification.title}</p>
                      <p className="text-sm text-gray-500">{notification.message}</p>
                    </div>
                    {notification.priority === 'high' || notification.priority === 'urgent' ? (
                      <Badge variant={notification.priority === 'urgent' ? 'destructive' : 'default'}>
                        {notification.priority}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                  {notification.actions && notification.actions.length > 0 && (
                    <div className="mt-2 flex gap-2">
                      {notification.actions.map((action, i) => (
                        <Button 
                          key={i} 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (action.url) {
                              window.location.href = action.url;
                            }
                            // Handle custom actions if needed
                          }}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
