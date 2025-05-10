import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Bell, Check, Award, Trash2, Calendar, DollarSign, ChevronRight, AlertCircle } from 'lucide-react';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface BonusNotification {
  id: number;
  userId: number;
  goalId: number;
  goalName: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  notificationType: 'achievement' | 'payment' | 'goal_created' | 'goal_updated' | 'system';
  bonusAmount?: number;
  relatedData?: any;
}

const BonusNotifications: React.FC = () => {
  const [filter, setFilter] = useState('all');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Get notifications for the current user
  const notificationsQuery = useQuery({
    queryKey: ['/api/bonus/notifications/user', filter],
    queryFn: async () => {
      // Get the current user's ID from the session
      // This is a placeholder - in reality you'd get this from your auth context
      const userId = 1; // Replace with actual user ID
      
      // Add filter if not 'all'
      const params = filter !== 'all' ? `?type=${filter}` : '';
      
      return apiRequest(`/api/bonus/notifications/user/${userId}${params}`);
    }
  });
  
  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest(`/api/bonus/notifications/${id}/read`, {
        method: 'PATCH'
      });
    },
    onSuccess: () => {
      // Invalidate the notifications query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/bonus/notifications/user'] });
    }
  });
  
  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest(`/api/bonus/notifications/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: "Notification deleted",
        description: "The notification has been removed",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bonus/notifications/user'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      });
    }
  });
  
  // Mark all notifications as read
  const markAllReadMutation = useMutation({
    mutationFn: () => {
      // Get the current user's ID from the session
      const userId = 1; // Replace with actual user ID
      
      return apiRequest(`/api/bonus/notifications/user/${userId}/read-all`, {
        method: 'PATCH'
      });
    },
    onSuccess: () => {
      toast({
        title: "All notifications marked as read",
        description: "Your notifications have been updated",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bonus/notifications/user'] });
    }
  });
  
  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'achievement':
        return <Award className="h-5 w-5 text-green-500" />;
      case 'payment':
        return <DollarSign className="h-5 w-5 text-blue-500" />;
      case 'goal_created':
      case 'goal_updated':
        return <Calendar className="h-5 w-5 text-amber-500" />;
      case 'system':
      default:
        return <Bell className="h-5 w-5 text-slate-500" />;
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return {
        formatted: format(date, 'MMM d, yyyy, h:mm a'),
        relative: formatDistanceToNow(date, { addSuffix: true }),
      };
    } catch (e) {
      return { formatted: 'Invalid date', relative: '' };
    }
  };
  
  // Format amount as currency
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return '';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100); // Assuming amount is in cents
  };
  
  // Get notification type label for the badge
  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'achievement':
        return 'Achievement';
      case 'payment':
        return 'Payment';
      case 'goal_created':
        return 'New Goal';
      case 'goal_updated':
        return 'Goal Updated';
      case 'system':
        return 'System';
      default:
        return 'Notification';
    }
  };
  
  // Calculate unread notifications
  const unreadCount = React.useMemo(() => {
    if (!notificationsQuery.data) return 0;
    
    return notificationsQuery.data.filter((notification: BonusNotification) => !notification.isRead).length;
  }, [notificationsQuery.data]);
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bonus Notifications</h2>
          <p className="text-muted-foreground">
            Stay updated on bonus goals and achievements
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Select
            value={filter}
            onValueChange={setFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Notifications</SelectItem>
              <SelectItem value="achievement">Achievements</SelectItem>
              <SelectItem value="payment">Payments</SelectItem>
              <SelectItem value="goal_created">New Goals</SelectItem>
              <SelectItem value="goal_updated">Goal Updates</SelectItem>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="unread">Unread Only</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            onClick={() => markAllReadMutation.mutate()}
            disabled={unreadCount === 0 || markAllReadMutation.isPending}
          >
            <Check className="h-4 w-4 mr-2" />
            {markAllReadMutation.isPending ? "Marking all as read..." : "Mark All Read"}
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Notification Center</CardTitle>
          <CardDescription>
            {unreadCount === 0 ? (
              "You're all caught up! No unread notifications."
            ) : (
              `You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}.`
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notificationsQuery.isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-16 bg-slate-200 rounded w-full"></div>
              <div className="h-16 bg-slate-200 rounded w-full"></div>
              <div className="h-16 bg-slate-200 rounded w-full"></div>
            </div>
          ) : notificationsQuery.error ? (
            <div className="flex py-12 justify-center items-center text-destructive">
              <AlertCircle className="mr-2 h-5 w-5" />
              Error loading notifications
            </div>
          ) : notificationsQuery.data && notificationsQuery.data.length > 0 ? (
            <div className="space-y-4">
              {notificationsQuery.data.map((notification: BonusNotification) => {
                const dateInfo = formatDate(notification.createdAt);
                
                return (
                  <div 
                    key={notification.id} 
                    className={`border rounded-lg p-4 ${notification.isRead ? 'bg-background' : 'bg-muted/30'}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.notificationType)}
                      </div>
                      
                      <div className="flex-grow space-y-1">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium">
                            {notification.goalName || "Bonus Notification"}
                          </h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {getNotificationTypeLabel(notification.notificationType)}
                            </Badge>
                            {!notification.isRead && (
                              <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">New</Badge>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                        
                        {notification.bonusAmount !== undefined && (
                          <p className="text-sm font-medium text-green-600">
                            Bonus Amount: {formatCurrency(notification.bonusAmount)}
                          </p>
                        )}
                        
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-xs text-muted-foreground">
                            {dateInfo.relative} · {dateInfo.formatted}
                          </span>
                          
                          <div className="flex gap-2">
                            {!notification.isRead && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => markAsReadMutation.mutate(notification.id)}
                                disabled={markAsReadMutation.isPending}
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Mark as read
                              </Button>
                            )}
                            
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => deleteNotificationMutation.mutate(notification.id)}
                              disabled={deleteNotificationMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
              <h3 className="text-lg font-medium">No notifications</h3>
              <p className="text-muted-foreground mt-2">
                You don't have any notifications at the moment.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BonusNotifications;