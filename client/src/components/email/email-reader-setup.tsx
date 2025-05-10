import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Mail, CheckCircle, XCircle, Settings, Inbox, Play, Square, RefreshCcw } from 'lucide-react';

// Email configuration schema
const emailConfigSchema = z.object({
  user: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
  host: z.string().min(1, { message: "IMAP server is required" }),
  port: z.coerce.number().int().positive({ message: "Port must be a positive number" }),
  tls: z.boolean().default(true),
  folderNames: z.array(z.string()).optional(),
  practiceId: z.string().optional()
});

// Email processing settings schema
const settingsSchema = z.object({
  autoRespond: z.boolean().default(false),
  categorizeEmails: z.boolean().default(true),
  extractAppointmentRequests: z.boolean().default(true),
  notifyStaff: z.boolean().default(true),
  maxEmailsToProcess: z.coerce.number().int().positive().default(50)
});

type EmailConfig = z.infer<typeof emailConfigSchema>;
type EmailSettings = z.infer<typeof settingsSchema>;

interface ProcessedEmail {
  messageId: string;
  subject: string;
  from: string;
  sentDate: string;
  category: string;
  priority: string;
  requiresResponse: boolean;
  summary: string;
}

const EmailReaderSetup: React.FC = () => {
  const { toast } = useToast();
  const [isConfigured, setIsConfigured] = useState(false);
  const [isProcessingEmails, setIsProcessingEmails] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unchecked' | 'success' | 'failed'>('unchecked');
  const [processedEmails, setProcessedEmails] = useState<ProcessedEmail[]>([]);
  const [processingStats, setProcessingStats] = useState({
    totalEmails: 0,
    appointmentRequests: 0,
    lastProcessed: ''
  });
  
  // Config form
  const configForm = useForm<EmailConfig>({
    resolver: zodResolver(emailConfigSchema),
    defaultValues: {
      user: '',
      password: '',
      host: '',
      port: 993,
      tls: true,
      folderNames: ['INBOX', 'Sent'],
      practiceId: `practice_${Date.now()}`
    }
  });
  
  // Settings form
  const settingsForm = useForm<EmailSettings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      autoRespond: false,
      categorizeEmails: true,
      extractAppointmentRequests: true,
      notifyStaff: true,
      maxEmailsToProcess: 50
    }
  });
  
  // Test connection
  const testConnection = async (data: EmailConfig) => {
    try {
      setConnectionStatus('unchecked');
      const response = await axios.post('/api/email-reader/test-connection', data);
      
      if (response.data.success) {
        setConnectionStatus('success');
        toast({
          title: 'Connection successful',
          description: 'Successfully connected to the email server.',
          variant: 'default'
        });
      } else {
        setConnectionStatus('failed');
        toast({
          title: 'Connection failed',
          description: response.data.message || 'Failed to connect to the email server.',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      setConnectionStatus('failed');
      let errorMessage = 'Failed to connect to the email server.';
      
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      toast({
        title: 'Connection failed',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };
  
  // Save configuration
  const saveConfiguration = async (data: EmailConfig) => {
    try {
      const response = await axios.post('/api/email-reader/configure', data);
      
      if (response.data.success) {
        setIsConfigured(true);
        toast({
          title: 'Configuration saved',
          description: 'Email configuration has been saved successfully.',
          variant: 'default'
        });
      } else {
        toast({
          title: 'Configuration failed',
          description: response.data.message || 'Failed to save email configuration.',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      let errorMessage = 'Failed to save email configuration.';
      
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      toast({
        title: 'Configuration failed',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };
  
  // Save settings
  const saveSettings = async (data: EmailSettings) => {
    try {
      const response = await axios.post('/api/email-reader/settings', data);
      
      if (response.data.success) {
        toast({
          title: 'Settings saved',
          description: 'Email processing settings have been saved successfully.',
          variant: 'default'
        });
      } else {
        toast({
          title: 'Settings update failed',
          description: response.data.message || 'Failed to save email processing settings.',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      let errorMessage = 'Failed to save email processing settings.';
      
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      toast({
        title: 'Settings update failed',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };
  
  // Start email processing
  const startProcessing = async () => {
    try {
      const practiceId = configForm.getValues('practiceId');
      const response = await axios.post('/api/email-reader/start', { practiceId });
      
      if (response.data.success) {
        setIsProcessingEmails(true);
        toast({
          title: 'Processing started',
          description: 'Email processing has been started successfully.',
          variant: 'default'
        });
      } else {
        toast({
          title: 'Start processing failed',
          description: response.data.message || 'Failed to start email processing.',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      let errorMessage = 'Failed to start email processing.';
      
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      toast({
        title: 'Start processing failed',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };
  
  // Stop email processing
  const stopProcessing = async () => {
    try {
      const practiceId = configForm.getValues('practiceId');
      const response = await axios.post('/api/email-reader/stop', { practiceId });
      
      if (response.data.success) {
        setIsProcessingEmails(false);
        toast({
          title: 'Processing stopped',
          description: 'Email processing has been stopped successfully.',
          variant: 'default'
        });
      } else {
        toast({
          title: 'Stop processing failed',
          description: response.data.message || 'Failed to stop email processing.',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      let errorMessage = 'Failed to stop email processing.';
      
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      toast({
        title: 'Stop processing failed',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };
  
  // Fetch status
  const fetchStatus = async () => {
    try {
      const practiceId = configForm.getValues('practiceId');
      const response = await axios.get('/api/email-reader/status', {
        params: { practiceId }
      });
      
      setIsProcessingEmails(response.data.isProcessing || false);
      setIsConfigured(response.data.isConfigured || false);
      
      if (response.data.status) {
        setProcessingStats({
          totalEmails: response.data.stats?.totalProcessed || 0,
          appointmentRequests: response.data.stats?.appointmentRequestsFound || 0,
          lastProcessed: response.data.stats?.lastProcessedTime || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch email processing status:', error);
    }
  };
  
  // Fetch processed emails
  const fetchProcessedEmails = async () => {
    try {
      const practiceId = configForm.getValues('practiceId');
      const response = await axios.get('/api/email-reader/processed-emails', {
        params: { practiceId, page: 1, limit: 20 }
      });
      
      setProcessedEmails(response.data.items || []);
    } catch (error) {
      console.error('Failed to fetch processed emails:', error);
    }
  };
  
  // Load configuration and status on component mount
  useEffect(() => {
    fetchStatus();
    fetchProcessedEmails();
    
    // Poll for status updates every 30 seconds
    const intervalId = setInterval(fetchStatus, 30000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Email Integration</h2>
        <div className="flex items-center space-x-2">
          <Badge variant={isConfigured ? "default" : "outline"} className={isConfigured ? "bg-green-500" : ""}>
            {isConfigured ? "Configured" : "Not Configured"}
          </Badge>
          <Badge variant={isProcessingEmails ? "default" : "outline"} className={isProcessingEmails ? "bg-green-500" : ""}>
            {isProcessingEmails ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>
      
      <Tabs defaultValue="configuration" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="configuration">
            <Mail className="w-4 h-4 mr-2" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="processed-emails">
            <Inbox className="w-4 h-4 mr-2" />
            Processed Emails
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="configuration" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Account Configuration</CardTitle>
              <CardDescription>
                Connect DentaMind to your practice email account to enable AI-driven email processing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...configForm}>
                <form onSubmit={configForm.handleSubmit(saveConfiguration)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={configForm.control}
                      name="user"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input placeholder="practice@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={configForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={configForm.control}
                      name="host"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>IMAP Server</FormLabel>
                          <FormControl>
                            <Input placeholder="imap.example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={configForm.control}
                      name="port"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Port</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="993" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={configForm.control}
                    name="tls"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 mt-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Use SSL/TLS</FormLabel>
                          <FormDescription>
                            Enable secure connection to the email server
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-between mt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => testConnection(configForm.getValues())}
                    >
                      {connectionStatus === 'unchecked' ? (
                        <>Test Connection</>
                      ) : connectionStatus === 'success' ? (
                        <><CheckCircle className="w-4 h-4 mr-2" />Connection Successful</>
                      ) : (
                        <><XCircle className="w-4 h-4 mr-2" />Connection Failed</>
                      )}
                    </Button>
                    <Button type="submit">Save Configuration</Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Email Processing Status</CardTitle>
              <CardDescription>
                Control the email processing service and view its current status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-medium">Total Emails Processed</p>
                  <p className="text-2xl font-bold">{processingStats.totalEmails}</p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-medium">Appointment Requests</p>
                  <p className="text-2xl font-bold">{processingStats.appointmentRequests}</p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-medium">Last Processed</p>
                  <p className="text-sm font-medium">
                    {processingStats.lastProcessed 
                      ? new Date(processingStats.lastProcessed).toLocaleString() 
                      : 'Never'}
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline"
                onClick={fetchStatus}
              >
                <RefreshCcw className="w-4 h-4 mr-2" />
                Refresh Status
              </Button>
              
              {isProcessingEmails ? (
                <Button 
                  variant="destructive"
                  onClick={stopProcessing}
                  disabled={!isConfigured}
                >
                  <Square className="w-4 h-4 mr-2" />
                  Stop Email Processing
                </Button>
              ) : (
                <Button 
                  variant="default"
                  onClick={startProcessing}
                  disabled={!isConfigured}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Email Processing
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Processing Settings</CardTitle>
              <CardDescription>
                Configure how DentaMind's AI should process your practice emails.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...settingsForm}>
                <form onSubmit={settingsForm.handleSubmit(saveSettings)} className="space-y-4">
                  <FormField
                    control={settingsForm.control}
                    name="autoRespond"
                    render={({ field }) => (
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <Label htmlFor="auto-respond">Automatic Responses</Label>
                          <div className="text-sm text-muted-foreground">
                            Allow AI to automatically respond to common patient inquiries
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            id="auto-respond"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </div>
                    )}
                  />
                  
                  <FormField
                    control={settingsForm.control}
                    name="categorizeEmails"
                    render={({ field }) => (
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <Label htmlFor="categorize-emails">Categorize Emails</Label>
                          <div className="text-sm text-muted-foreground">
                            Analyze emails to categorize by type (appointment, inquiry, clinical, billing)
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            id="categorize-emails"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </div>
                    )}
                  />
                  
                  <FormField
                    control={settingsForm.control}
                    name="extractAppointmentRequests"
                    render={({ field }) => (
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <Label htmlFor="extract-appointments">Extract Appointment Requests</Label>
                          <div className="text-sm text-muted-foreground">
                            Detect appointment requests and automatically create scheduling suggestions
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            id="extract-appointments"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </div>
                    )}
                  />
                  
                  <FormField
                    control={settingsForm.control}
                    name="notifyStaff"
                    render={({ field }) => (
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <Label htmlFor="notify-staff">Staff Notifications</Label>
                          <div className="text-sm text-muted-foreground">
                            Send notifications to staff for high-priority or urgent emails
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            id="notify-staff"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </div>
                    )}
                  />
                  
                  <FormField
                    control={settingsForm.control}
                    name="maxEmailsToProcess"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Emails to Process</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormDescription>
                          Maximum number of emails to process in each check cycle
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full">
                    Save Settings
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="processed-emails" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Processed Emails</CardTitle>
              <CardDescription>
                View emails that have been processed by the AI system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {processedEmails.length > 0 ? (
                <div className="space-y-4">
                  {processedEmails.map((email) => (
                    <div key={email.messageId} className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold">{email.subject}</h3>
                        <Badge variant={email.priority === 'high' ? 'destructive' : 
                                         email.priority === 'medium' ? 'default' : 'outline'}>
                          {email.priority}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        From: {email.from} • {new Date(email.sentDate).toLocaleString()}
                      </div>
                      <div className="flex space-x-2">
                        <Badge variant="secondary">{email.category}</Badge>
                        {email.requiresResponse && (
                          <Badge variant="destructive">Requires Response</Badge>
                        )}
                      </div>
                      <p className="text-sm">{email.summary}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <Inbox className="w-10 h-10 mx-auto mb-2" />
                  <p>No processed emails yet</p>
                  <p className="text-sm">
                    Start the email processing to begin analyzing your practice emails
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={fetchProcessedEmails}>
                <RefreshCcw className="w-4 h-4 mr-2" />
                Refresh Emails
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmailReaderSetup;