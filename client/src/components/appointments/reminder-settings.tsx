import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface ReminderType {
  timeframe: string;
  priority: string;
  method: string;
}

interface ReminderSettings {
  enabled: boolean;
  reminderTypes: ReminderType[];
  lastRunTime: string;
  remindersSentToday: number;
  remindersSentThisWeek: number;
  deliveryStats: {
    email: {
      sent: number;
      opened: number;
      failureRate: number;
    };
    sms: {
      sent: number;
      delivered: number;
      failureRate: number;
    };
  };
}

interface ReminderLogEntry {
  id: string;
  timestamp: string;
  patientId: number;
  patientName: string;
  timeframe: '24h' | '48h' | '1week' | string;
  sentTo: string;
  status: 'sent' | 'delivered' | 'opened' | 'failed';
  method?: 'email' | 'sms';
  appointmentId: number;
}

export function ReminderSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch reminder settings
  const { data: settings, isLoading: isLoadingSettings } = useQuery<ReminderSettings>({
    queryKey: ['/api/scheduler/reminders/settings'],
    retry: 1,
    refetchOnWindowFocus: false
  });

  // Fetch reminder stats
  const { data: reminderStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/scheduler/reminders/stats'],
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: activeTab === 'overview'
  });
  
  interface ReminderLogResponse {
    items: ReminderLogEntry[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }
  
  // Fetch reminder logs
  const { data: reminderLog, isLoading: isLoadingLog } = useQuery<ReminderLogResponse>({
    queryKey: ['/api/scheduler/reminders/logs'],
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: activeTab === 'logs'
  });

  // Update reminder settings 
  const updateSettingsMutation = useMutation({
    mutationFn: (newSettings: Partial<ReminderSettings>) => api.post('/api/scheduler/reminders/settings', newSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduler/reminders/settings'] });
      toast({
        title: 'Reminder settings updated',
        description: 'Appointment reminder settings have been successfully updated.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update reminder settings',
        description: 'There was an error updating the reminder settings.',
        variant: 'destructive',
      });
    }
  });

  // Toggle reminders enabled/disabled 
  const toggleRemindersMutation = useMutation({
    mutationFn: (enabled: boolean) => {
      // Create a new settings object with the updated enabled status
      const updatedSettings = {
        enabled,
        reminderTypes: settings?.reminderTypes || []
      };
      return api.post('/api/scheduler/reminders/settings', updatedSettings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduler/reminders/settings'] });
      toast({
        title: 'Reminder settings updated',
        description: `Appointment reminders have been ${settings?.enabled ? 'disabled' : 'enabled'}.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update reminder settings',
        description: 'There was an error updating the reminder settings.',
        variant: 'destructive',
      });
    }
  });

  // Run reminders now
  const runRemindersMutation = useMutation({
    mutationFn: (timeframe: '24h' | '48h' | '1week' | 'all' = 'all') => 
      api.post('/api/scheduler/reminders/send', { timeframe }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduler/reminders/settings'] });
      toast({
        title: 'Reminders sent',
        description: `Successfully sent ${data.data.count} appointment reminders.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to send reminders',
        description: 'There was an error sending appointment reminders.',
        variant: 'destructive',
      });
    }
  });

  if (isLoadingSettings && activeTab === 'overview') {
    return (
      <div className="flex items-center justify-center h-80">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const formattedReminderTypes = settings?.reminderTypes.map(type => {
    // Convert timeframe to readable format
    let timeframeText = type.timeframe;
    switch (type.timeframe) {
      case '24h': timeframeText = '24 hours before'; break;
      case '48h': timeframeText = '48 hours before'; break;
      case '1week': timeframeText = '1 week before'; break;
    }
    
    // Convert method to readable list
    const methods = type.method.split(',').map(m => m.trim());
    
    return {
      ...type,
      timeframeText,
      methods
    };
  }) || [];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Appointment Reminder Settings</CardTitle>
        <CardDescription>
          Configure and monitor automated appointment reminders sent to patients
        </CardDescription>
      </CardHeader>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="overview">
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Status</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="reminders-enabled">Automated reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable or disable all appointment reminders
                    </p>
                  </div>
                  <Switch 
                    id="reminders-enabled" 
                    checked={settings?.enabled} 
                    onCheckedChange={(checked) => toggleRemindersMutation.mutate(checked)}
                    disabled={toggleRemindersMutation.isPending}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Last run</p>
                    <p className="text-sm text-muted-foreground">
                      {settings ? new Date(settings.lastRunTime).toLocaleString() : 'Never'}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => runRemindersMutation.mutate('all')}
                    disabled={!settings?.enabled || runRemindersMutation.isPending}
                  >
                    {runRemindersMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Running...
                      </>
                    ) : "Run Now"}
                  </Button>
                </div>
                
                <h3 className="text-lg font-medium pt-2">Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-muted-foreground text-sm">Today</p>
                    <p className="text-2xl font-bold">{settings?.remindersSentToday || 0}</p>
                    <p className="text-xs text-muted-foreground">reminders sent</p>
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-muted-foreground text-sm">This Week</p>
                    <p className="text-2xl font-bold">{settings?.remindersSentThisWeek || 0}</p>
                    <p className="text-xs text-muted-foreground">reminders sent</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Active Reminder Types</h3>
                <div className="space-y-3">
                  {formattedReminderTypes.map((type, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Badge variant={type.priority === 'high' ? 'destructive' : 'default'}>
                            {type.timeframeText}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          {type.methods.includes('email') && (
                            <Badge variant="outline">Email</Badge>
                          )}
                          {type.methods.includes('sms') && (
                            <Badge variant="outline">SMS</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 space-y-3">
                  <h3 className="text-lg font-medium">Delivery Stats</h3>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Email</h4>
                    <div className="flex items-center text-sm">
                      <div className="flex-1">
                        <span className="text-muted-foreground">Sent:</span> {settings?.deliveryStats.email.sent}
                      </div>
                      <div className="flex-1">
                        <span className="text-muted-foreground">Opened:</span> {settings?.deliveryStats.email.opened}
                      </div>
                      <div className="flex-1">
                        <span className="text-muted-foreground">Failure Rate:</span> {(settings?.deliveryStats.email.failureRate || 0) * 100}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">SMS</h4>
                    <div className="flex items-center text-sm">
                      <div className="flex-1">
                        <span className="text-muted-foreground">Sent:</span> {settings?.deliveryStats.sms.sent}
                      </div>
                      <div className="flex-1">
                        <span className="text-muted-foreground">Delivered:</span> {settings?.deliveryStats.sms.delivered}
                      </div>
                      <div className="flex-1">
                        <span className="text-muted-foreground">Failure Rate:</span> {(settings?.deliveryStats.sms.failureRate || 0) * 100}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </TabsContent>
        
        <TabsContent value="logs">
          <CardContent>
            {isLoadingLog ? (
              <div className="flex items-center justify-center h-60">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div>
                <div className="flex justify-between mb-4">
                  <h3 className="text-lg font-medium">Recent Reminder Logs</h3>
                  <Button variant="outline" size="sm">Export Logs</Button>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Mock data for display - will be replaced with actual data */}
                      {(reminderLog?.items || []).map((log: ReminderLogEntry) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            {new Date(log.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell>{log.patientName}</TableCell>
                          <TableCell>
                            {log.timeframe === '24h' ? '24 hours' : 
                             log.timeframe === '48h' ? '48 hours' : 
                             log.timeframe === '1week' ? '1 week' : log.timeframe}
                          </TableCell>
                          <TableCell>{log.sentTo.includes('@') ? 'Email' : 'SMS'}</TableCell>
                          <TableCell>
                            <Badge variant={
                              log.status === 'delivered' || log.status === 'opened' ? 'default' :
                              log.status === 'sent' ? 'outline' : 'destructive'
                            }>
                              {log.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {/* Show a message when there are no logs */}
                      {(!reminderLog?.items || reminderLog.items.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4">
                            No reminder logs found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </TabsContent>
        
        <TabsContent value="settings">
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Reminder Configuration</h3>
                <div className="grid gap-4">
                  {formattedReminderTypes.map((type, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium">{type.timeframeText}</h4>
                        <Switch checked={true} />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="mb-1 block">Priority</Label>
                          <select className="w-full p-2 border rounded">
                            <option value="low" selected={type.priority === 'low'}>Low</option>
                            <option value="medium" selected={type.priority === 'medium'}>Medium</option>
                            <option value="high" selected={type.priority === 'high'}>High</option>
                          </select>
                        </div>
                        
                        <div>
                          <Label className="mb-1 block">Notification Methods</Label>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <input 
                                type="checkbox" 
                                id={`email-${index}`} 
                                checked={type.methods.includes('email')}
                              />
                              <label htmlFor={`email-${index}`}>Email</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input 
                                type="checkbox" 
                                id={`sms-${index}`} 
                                checked={type.methods.includes('sms')}
                              />
                              <label htmlFor={`sms-${index}`}>SMS</label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-4">General Settings</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="time-window">Reminder Time Window</Label>
                      <select id="time-window" className="w-full p-2 border rounded">
                        <option>8:00 AM - 5:00 PM</option>
                        <option>9:00 AM - 6:00 PM</option>
                        <option>10:00 AM - 7:00 PM</option>
                      </select>
                      <p className="text-xs text-muted-foreground">
                        Only send reminders during these hours
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="max-daily">Maximum Daily Reminders</Label>
                      <input
                        id="max-daily"
                        type="number" 
                        min="1"
                        defaultValue="1" 
                        className="w-full p-2 border rounded"
                      />
                      <p className="text-xs text-muted-foreground">
                        Max number of reminders to send to the same patient per day
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="weekend-reminders">Weekend Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Send reminders on weekends
                      </p>
                    </div>
                    <Switch 
                      id="weekend-reminders" 
                      checked={true}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>
      
      <CardFooter className="border-t px-6 py-4 flex justify-end">
        <Button
          disabled={activeTab !== 'settings'}
          size="sm"
          className={activeTab === 'settings' ? '' : 'hidden'}
        >
          Save Changes
        </Button>
      </CardFooter>
    </Card>
  );
}