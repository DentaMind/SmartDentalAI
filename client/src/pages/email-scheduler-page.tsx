import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertCircle,
  Calendar as CalendarIcon,
  Check,
  Clock,
  Mail,
  MailOpen,
  MousePointer,
  Trash2,
  User,
  Users,
} from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { PageHeader } from '@/components/layout/page-header';

// Define the email schedule schema
const emailScheduleSchema = z.object({
  recipientEmail: z.string().email('Please enter a valid email address'),
  recipientName: z.string().optional(),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Email body is required'),
  html: z.string().optional(),
  scheduledTime: z.date(),
  optimizeDeliveryTime: z.boolean().default(false),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  category: z.enum([
    'appointment_reminder',
    'treatment_followup',
    'billing_reminder',
    'lab_update',
    'patient_education',
    'recall',
    'marketing',
    'misc'
  ]).default('appointment_reminder'),
  patientId: z.number().optional(),
  providerName: z.string().optional(),
  enableTracking: z.boolean().default(true),
});

type EmailScheduleFormValues = z.infer<typeof emailScheduleSchema>;

// Define interfaces for the API response data
interface EmailSchedule {
  id: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  body: string;
  html?: string;
  scheduledTime: string;
  optimizeDeliveryTime: boolean;
  priority: 'high' | 'medium' | 'low';
  category: string;
  status: 'scheduled' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed' | 'cancelled';
  patientId?: number;
  providerName?: string;
  tracking: {
    enableOpenTracking: boolean;
    enableLinkTracking: boolean;
    unsubscribed: boolean;
    openCount?: number;
    clickCount?: number;
    lastOpenedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ScheduledEmailsResponse {
  data: EmailSchedule[];
  count: number;
  page: number;
  pageSize: number;
}

interface EmailAnalytics {
  // Summary data
  totalSent: number;
  scheduled: number;
  delivered: number;
  opened: number;
  clicked: number;
  failed: number;
  cancelled: number;
  
  // Rate calculations
  openRate: string;
  clickRate: string;
  deliveryRate: string;
  bounceRate: string;
  
  // Categorization data
  categoryCounts: Record<string, number>;
  
  // Additional analytics data
  byTime: {
    morning: number;
    afternoon: number;
    evening: number;
  };
  byDay: Record<string, number>;
  engagement: {
    openTimes: Record<string, number>;
    clickTimes: Record<string, number>;
  };
  recentPerformance: {
    date: string;
    sent: number;
    opened: number;
    clicked: number;
  }[];
}

const EmailSchedulerPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('create');

  // Query to fetch all scheduled emails
  const {
    data: scheduledEmails = { data: [], count: 0, page: 1, pageSize: 10 } as ScheduledEmailsResponse,
    isLoading,
    error,
  } = useQuery<ScheduledEmailsResponse>({
    queryKey: ['/api/email-scheduler'],
    enabled: activeTab === 'view',
  });

  // Query to fetch email analytics
  const {
    data: analytics = {} as EmailAnalytics,
    isLoading: analyticsLoading,
  } = useQuery<EmailAnalytics>({
    queryKey: ['/api/email-scheduler/analytics'],
    enabled: activeTab === 'analytics',
  });

  // Mutation to schedule a new email
  const scheduleMutation = useMutation({
    mutationFn: (data: EmailScheduleFormValues) => {
      // Transform the data for the API
      const { enableTracking, ...rest } = data;
      const apiData = {
        ...rest,
        scheduledTime: data.scheduledTime.toISOString(),
        tracking: {
          enableOpenTracking: enableTracking,
          enableLinkTracking: enableTracking,
          unsubscribed: false
        }
      };
      
      return apiRequest({
        url: '/api/email-scheduler',
        method: 'POST',
        body: apiData
      });
    },
    onSuccess: () => {
      toast({
        title: 'Email Scheduled',
        description: 'The email has been scheduled successfully.',
        variant: 'default',
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/email-scheduler'] });
      setActiveTab('view');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to schedule email. Please try again.',
        variant: 'destructive',
      });
      console.error('Schedule email error:', error);
    },
  });

  // Mutation to cancel a scheduled email
  const cancelMutation = useMutation({
    mutationFn: (id: string) => {
      return apiRequest({
        url: `/api/email-scheduler/${id}`,
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Email Cancelled',
        description: 'The scheduled email has been cancelled.',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/email-scheduler'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to cancel email. Please try again.',
        variant: 'destructive',
      });
      console.error('Cancel email error:', error);
    },
  });

  // Setup the form with default values
  const form = useForm<EmailScheduleFormValues>({
    resolver: zodResolver(emailScheduleSchema),
    defaultValues: {
      recipientEmail: '',
      recipientName: '',
      subject: '',
      body: '',
      html: '',
      scheduledTime: new Date(),
      optimizeDeliveryTime: true,
      priority: 'medium',
      category: 'appointment_reminder',
      providerName: '',
      enableTracking: true,
    },
  });

  const onSubmit = (data: EmailScheduleFormValues) => {
    scheduleMutation.mutate(data);
  };

  // Function to generate a status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      case 'sent':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Sent</Badge>;
      case 'delivered':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Delivered</Badge>;
      case 'opened':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800">Opened</Badge>;
      case 'clicked':
        return <Badge variant="outline" className="bg-indigo-100 text-indigo-800">Clicked</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Failed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Function to display a formatted date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'PPpp');
  };

  // Function to get the category display name
  const getCategoryDisplayName = (category: string) => {
    const displayNames: Record<string, string> = {
      appointment_reminder: 'Appointment Reminder',
      treatment_followup: 'Treatment Follow-up',
      billing_reminder: 'Billing Reminder',
      lab_update: 'Lab Update',
      patient_education: 'Patient Education',
      recall: 'Recall',
      marketing: 'Marketing',
      misc: 'Miscellaneous',
    };
    return displayNames[category] || category;
  };

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title="Email Scheduler"
        description="Schedule and manage time-optimized emails to patients"
      />

      <Tabs defaultValue="create" value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create">Create Schedule</TabsTrigger>
          <TabsTrigger value="view">View Scheduled Emails</TabsTrigger>
          <TabsTrigger value="analytics">Email Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Schedule a New Email</CardTitle>
              <CardDescription>
                Create a time-optimized email for patient communication.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="recipientEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recipient Email*</FormLabel>
                          <FormControl>
                            <Input placeholder="patient@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="recipientName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recipient Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject*</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Your upcoming dental appointment"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="body"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Body*</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter the email content here..."
                            className="min-h-[200px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="scheduledTime"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Scheduled Date & Time*</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className="w-full pl-3 text-left font-normal"
                                >
                                  {field.value ? (
                                    format(field.value, 'PPP')
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                              <div className="p-3 border-t border-border">
                                <Label>Time</Label>
                                <div className="flex items-center mt-2">
                                  <Input
                                    type="time"
                                    value={format(field.value, 'HH:mm')}
                                    onChange={(e) => {
                                      const [hours, minutes] = e.target.value.split(':');
                                      const newDate = new Date(field.value);
                                      newDate.setHours(parseInt(hours));
                                      newDate.setMinutes(parseInt(minutes));
                                      field.onChange(newDate);
                                    }}
                                  />
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="appointment_reminder">
                                Appointment Reminder
                              </SelectItem>
                              <SelectItem value="treatment_followup">
                                Treatment Follow-up
                              </SelectItem>
                              <SelectItem value="billing_reminder">
                                Billing Reminder
                              </SelectItem>
                              <SelectItem value="lab_update">
                                Lab Update
                              </SelectItem>
                              <SelectItem value="patient_education">
                                Patient Education
                              </SelectItem>
                              <SelectItem value="recall">
                                Recall
                              </SelectItem>
                              <SelectItem value="marketing">
                                Marketing
                              </SelectItem>
                              <SelectItem value="misc">
                                Miscellaneous
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="optimizeDeliveryTime"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Optimize Delivery Time
                            </FormLabel>
                            <FormDescription>
                              Use AI to find the best time to send this email for maximum patient engagement.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="enableTracking"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Enable Email Tracking
                            </FormLabel>
                            <FormDescription>
                              Track email opens and link clicks to measure engagement.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      className="w-full md:w-auto"
                      disabled={scheduleMutation.isPending}
                    >
                      {scheduleMutation.isPending ? 'Scheduling...' : 'Schedule Email'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="view" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Emails</CardTitle>
              <CardDescription>
                View and manage all your scheduled email communications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2">Loading scheduled emails...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex justify-center items-center h-64">
                  <div className="text-center text-red-500">
                    <AlertCircle className="h-8 w-8 mx-auto" />
                    <p className="mt-2">Error loading scheduled emails. Please try again.</p>
                  </div>
                </div>
              ) : !scheduledEmails.data || scheduledEmails.data.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                  <div className="text-center text-gray-500">
                    <Mail className="h-8 w-8 mx-auto" />
                    <p className="mt-2">No emails scheduled yet.</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setActiveTab('create')}
                    >
                      Schedule New Email
                    </Button>
                  </div>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableCaption>A list of your scheduled emails.</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Scheduled Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scheduledEmails.data?.map((email: any) => (
                        <TableRow key={email.id}>
                          <TableCell className="font-medium">
                            {email.recipientName ? (
                              <div>
                                <div>{email.recipientName}</div>
                                <div className="text-xs text-muted-foreground">
                                  {email.recipientEmail}
                                </div>
                              </div>
                            ) : (
                              email.recipientEmail
                            )}
                          </TableCell>
                          <TableCell>{email.subject}</TableCell>
                          <TableCell>
                            {getCategoryDisplayName(email.category)}
                          </TableCell>
                          <TableCell>
                            {formatDate(email.scheduledTime)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(email.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            {email.status === 'scheduled' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => cancelMutation.mutate(email.id)}
                                disabled={cancelMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Cancel
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Analytics</CardTitle>
              <CardDescription>
                Track the performance of your email communications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2">Loading analytics data...</p>
                  </div>
                </div>
              ) : !analytics || Object.keys(analytics).length === 0 ? (
                <div className="flex justify-center items-center h-64">
                  <div className="text-center text-gray-500">
                    <MailOpen className="h-8 w-8 mx-auto" />
                    <p className="mt-2">No email analytics available yet.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <Mail className="h-8 w-8 mx-auto text-primary" />
                          <h3 className="mt-2 font-semibold text-lg">Total Sent</h3>
                          <p className="text-3xl font-bold">{analytics.totalSent || 0}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <Check className="h-8 w-8 mx-auto text-green-500" />
                          <h3 className="mt-2 font-semibold text-lg">Delivered</h3>
                          <p className="text-3xl font-bold">{analytics.delivered || 0}</p>
                          <p className="text-sm text-muted-foreground">{analytics.deliveryRate || '0%'}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <MailOpen className="h-8 w-8 mx-auto text-purple-500" />
                          <h3 className="mt-2 font-semibold text-lg">Opened</h3>
                          <p className="text-3xl font-bold">{analytics.opened || 0}</p>
                          <p className="text-sm text-muted-foreground">{analytics.openRate || '0%'}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <MousePointer className="h-8 w-8 mx-auto text-indigo-500" />
                          <h3 className="mt-2 font-semibold text-lg">Clicked</h3>
                          <p className="text-3xl font-bold">{analytics.clicked || 0}</p>
                          <p className="text-sm text-muted-foreground">{analytics.clickRate || '0%'}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card>
                      <CardHeader>
                        <CardTitle>Email Statuses</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="flex items-center">
                              <span className="h-3 w-3 rounded-full bg-blue-500 mr-2"></span>
                              Scheduled
                            </span>
                            <span className="font-medium">{analytics.scheduled || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="flex items-center">
                              <span className="h-3 w-3 rounded-full bg-green-500 mr-2"></span>
                              Sent
                            </span>
                            <span className="font-medium">{analytics.totalSent || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="flex items-center">
                              <span className="h-3 w-3 rounded-full bg-purple-500 mr-2"></span>
                              Opened
                            </span>
                            <span className="font-medium">{analytics.opened || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="flex items-center">
                              <span className="h-3 w-3 rounded-full bg-indigo-500 mr-2"></span>
                              Clicked
                            </span>
                            <span className="font-medium">{analytics.clicked || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="flex items-center">
                              <span className="h-3 w-3 rounded-full bg-red-500 mr-2"></span>
                              Failed
                            </span>
                            <span className="font-medium">{analytics.failed || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="flex items-center">
                              <span className="h-3 w-3 rounded-full bg-gray-500 mr-2"></span>
                              Cancelled
                            </span>
                            <span className="font-medium">{analytics.cancelled || 0}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Email Categories</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {analytics.categoryCounts && (
                          <div className="space-y-2">
                            {Object.entries(analytics.categoryCounts).map(([category, count]: [string, any]) => (
                              <div key={category} className="flex justify-between">
                                <span>{getCategoryDisplayName(category)}</span>
                                <span className="font-medium">{count}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmailSchedulerPage;