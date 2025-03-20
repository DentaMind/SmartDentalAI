import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Mail, Clock, Settings, FileText, Inbox, Brain, Eye, List, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Email interfaces
interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: string;
  aiGenerated: boolean;
  lastUsed?: string;
}

interface EmailProvider {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  useSSL: boolean;
  isDefault: boolean;
  connected: boolean;
}

interface ScheduledEmail {
  id: string;
  recipientId: number;
  recipientName: string;
  recipientEmail: string;
  subject: string;
  body: string;
  scheduledTime: string;
  status: 'scheduled' | 'sent' | 'failed' | 'cancelled';
  createdAt: string;
  templateId?: string;
  priority: 'low' | 'normal' | 'high';
  optimizedTime: boolean;
}

export function UnifiedEmailPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { toast } = useToast();
  
  // Email provider management
  const [emailProviders, setEmailProviders] = useState<EmailProvider[]>([
    {
      id: '1',
      name: 'Office Email',
      host: 'smtp.office365.com',
      port: 587,
      username: 'office@dentamind.com',
      useSSL: true,
      isDefault: true,
      connected: true
    }
  ]);
  
  // Email templates management
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([
    {
      id: '1',
      name: 'Appointment Reminder',
      subject: 'Your upcoming dental appointment',
      body: 'Dear {{patientName}},\n\nThis is a reminder about your dental appointment with Dr. {{doctorName}} on {{appointmentDate}} at {{appointmentTime}}.\n\nPlease arrive 10 minutes early to complete any necessary paperwork.',
      type: 'reminder',
      aiGenerated: false,
      lastUsed: '2025-03-10'
    },
    {
      id: '2',
      name: 'Treatment Plan Summary',
      subject: 'Your Dental Treatment Plan',
      body: 'Dear {{patientName}},\n\nAttached is a summary of your treatment plan discussed during your recent visit.\n\nPlease review and contact us with any questions.',
      type: 'treatment',
      aiGenerated: true,
      lastUsed: '2025-03-15'
    }
  ]);
  
  // Scheduled emails management
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([
    {
      id: '1',
      recipientId: 101,
      recipientName: 'Sarah Johnson',
      recipientEmail: 'sarah.johnson@example.com',
      subject: 'Your upcoming dental appointment',
      body: 'Dear Sarah,\n\nThis is a reminder about your dental appointment...',
      scheduledTime: '2025-03-25T10:00:00Z',
      status: 'scheduled',
      createdAt: '2025-03-18T14:30:00Z',
      templateId: '1',
      priority: 'normal',
      optimizedTime: true
    },
    {
      id: '2',
      recipientId: 102,
      recipientName: 'Michael Williams',
      recipientEmail: 'michael.williams@example.com',
      subject: 'Post-operative care instructions',
      body: 'Dear Michael,\n\nFollowing your recent procedure...',
      scheduledTime: '2025-03-22T15:30:00Z',
      status: 'scheduled',
      createdAt: '2025-03-18T09:15:00Z',
      templateId: undefined,
      priority: 'high',
      optimizedTime: false
    }
  ]);
  
  // Dialog states
  const [isAddProviderOpen, setIsAddProviderOpen] = useState(false);
  const [isAddTemplateOpen, setIsAddTemplateOpen] = useState(false);
  const [isScheduleEmailOpen, setIsScheduleEmailOpen] = useState(false);
  
  // Form states
  const [newProvider, setNewProvider] = useState<Partial<EmailProvider>>({
    name: '',
    host: '',
    port: 587,
    username: '',
    useSSL: true,
    isDefault: false
  });
  
  const [newTemplate, setNewTemplate] = useState<Partial<EmailTemplate>>({
    name: '',
    subject: '',
    body: '',
    type: 'general',
    aiGenerated: false
  });
  
  const [newScheduledEmail, setNewScheduledEmail] = useState<Partial<ScheduledEmail>>({
    recipientEmail: '',
    subject: '',
    body: '',
    scheduledTime: '',
    priority: 'normal',
    optimizedTime: true
  });
  
  // Handle adding a new email provider
  const handleAddProvider = () => {
    if (!newProvider.name || !newProvider.host || !newProvider.username) {
      toast({
        title: "Error",
        description: "Please fill out all required fields",
        variant: "destructive"
      });
      return;
    }
    
    const provider: EmailProvider = {
      id: Date.now().toString(),
      name: newProvider.name || '',
      host: newProvider.host || '',
      port: newProvider.port || 587,
      username: newProvider.username || '',
      useSSL: newProvider.useSSL || true,
      isDefault: newProvider.isDefault || false,
      connected: false
    };
    
    setEmailProviders([...emailProviders, provider]);
    setNewProvider({
      name: '',
      host: '',
      port: 587,
      username: '',
      useSSL: true,
      isDefault: false
    });
    setIsAddProviderOpen(false);
    
    toast({
      title: "Provider Added",
      description: `${provider.name} has been added successfully`,
    });
  };
  
  // Handle adding a new email template
  const handleAddTemplate = () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.body) {
      toast({
        title: "Error",
        description: "Please fill out all required fields",
        variant: "destructive"
      });
      return;
    }
    
    const template: EmailTemplate = {
      id: Date.now().toString(),
      name: newTemplate.name || '',
      subject: newTemplate.subject || '',
      body: newTemplate.body || '',
      type: newTemplate.type || 'general',
      aiGenerated: newTemplate.aiGenerated || false
    };
    
    setEmailTemplates([...emailTemplates, template]);
    setNewTemplate({
      name: '',
      subject: '',
      body: '',
      type: 'general',
      aiGenerated: false
    });
    setIsAddTemplateOpen(false);
    
    toast({
      title: "Template Added",
      description: `${template.name} has been added successfully`,
    });
  };
  
  // Handle scheduling a new email
  const handleScheduleEmail = () => {
    if (!newScheduledEmail.recipientEmail || !newScheduledEmail.subject || !newScheduledEmail.body || !newScheduledEmail.scheduledTime) {
      toast({
        title: "Error",
        description: "Please fill out all required fields",
        variant: "destructive"
      });
      return;
    }
    
    const scheduledEmail: ScheduledEmail = {
      id: Date.now().toString(),
      recipientId: 0, // Would normally be set to actual patient ID
      recipientName: 'New Patient', // Would normally be set to actual patient name
      recipientEmail: newScheduledEmail.recipientEmail || '',
      subject: newScheduledEmail.subject || '',
      body: newScheduledEmail.body || '',
      scheduledTime: newScheduledEmail.scheduledTime || '',
      status: 'scheduled',
      createdAt: new Date().toISOString(),
      priority: newScheduledEmail.priority as 'low' | 'normal' | 'high' || 'normal',
      optimizedTime: newScheduledEmail.optimizedTime || true
    };
    
    setScheduledEmails([...scheduledEmails, scheduledEmail]);
    setNewScheduledEmail({
      recipientEmail: '',
      subject: '',
      body: '',
      scheduledTime: '',
      priority: 'normal',
      optimizedTime: true
    });
    setIsScheduleEmailOpen(false);
    
    toast({
      title: "Email Scheduled",
      description: `Email to ${scheduledEmail.recipientEmail} has been scheduled`,
    });
  };
  
  return (
    <DashboardLayout 
      title="Email Communication Hub" 
      description="Manage all patient email communications and automated workflows"
      actions={
        <div className="flex gap-2">
          <Button className="gap-1" onClick={() => setIsScheduleEmailOpen(true)}>
            <Plus className="h-4 w-4" />
            Schedule Email
          </Button>
          <Button className="gap-1" variant="outline" onClick={() => setIsAddTemplateOpen(true)}>
            <FileText className="h-4 w-4" />
            New Template
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-5">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="scheduler" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Scheduler
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center gap-2">
              <Inbox className="h-4 w-4" />
              Monitoring
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>
          
          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Email Activity</CardTitle>
                  <CardDescription>Recent email activity and metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col items-center justify-center rounded-lg border p-3">
                        <div className="text-2xl font-bold">24</div>
                        <div className="text-xs text-muted-foreground">Sent Today</div>
                      </div>
                      <div className="flex flex-col items-center justify-center rounded-lg border p-3">
                        <div className="text-2xl font-bold">82%</div>
                        <div className="text-xs text-muted-foreground">Open Rate</div>
                      </div>
                      <div className="flex flex-col items-center justify-center rounded-lg border p-3">
                        <div className="text-2xl font-bold">15</div>
                        <div className="text-xs text-muted-foreground">Scheduled</div>
                      </div>
                      <div className="flex flex-col items-center justify-center rounded-lg border p-3">
                        <div className="text-2xl font-bold">2</div>
                        <div className="text-xs text-muted-foreground">AI Generated</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common email tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab('scheduler')}>
                      <Clock className="mr-2 h-4 w-4" />
                      Schedule Email
                    </Button>
                    <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab('templates')}>
                      <FileText className="mr-2 h-4 w-4" />
                      Manage Templates
                    </Button>
                    <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab('monitoring')}>
                      <Inbox className="mr-2 h-4 w-4" />
                      Check Inbox
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Brain className="mr-2 h-4 w-4" />
                      Generate AI Email
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Recently Scheduled Emails</CardTitle>
                  <CardDescription>Latest scheduled patient communications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {scheduledEmails.slice(0, 3).map((email) => (
                      <div key={email.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <div className="font-medium">{email.recipientName}</div>
                          <div className="text-sm text-muted-foreground">{email.subject}</div>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge variant={email.status === 'scheduled' ? 'outline' : email.status === 'sent' ? 'default' : 'destructive'}>
                              {email.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(email.scheduledTime).toLocaleDateString()} at {new Date(email.scheduledTime).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">Edit</Button>
                          <Button variant="ghost" size="sm">Cancel</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="link" className="w-full" onClick={() => setActiveTab('scheduler')}>
                    View All Scheduled Emails
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          
          {/* Scheduler Tab */}
          <TabsContent value="scheduler">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Email Scheduler
                  </CardTitle>
                  <CardDescription>
                    Schedule and manage automated email communications with patients
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Scheduled Emails</h3>
                      <Button onClick={() => setIsScheduleEmailOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Schedule New Email
                      </Button>
                    </div>
                    
                    <div className="rounded-md border">
                      <div className="grid grid-cols-[1fr_2fr_1fr_1fr] gap-4 p-4 font-medium border-b">
                        <div>Recipient</div>
                        <div>Subject</div>
                        <div>Scheduled For</div>
                        <div>Status</div>
                      </div>
                      {scheduledEmails.map((email) => (
                        <div key={email.id} className="grid grid-cols-[1fr_2fr_1fr_1fr] gap-4 p-4 border-b last:border-0 items-center">
                          <div className="font-medium">{email.recipientName}</div>
                          <div className="text-sm">{email.subject}</div>
                          <div className="text-sm">
                            {new Date(email.scheduledTime).toLocaleDateString()} 
                            <br />
                            <span className="text-xs text-muted-foreground">
                              {new Date(email.scheduledTime).toLocaleTimeString()}
                            </span>
                          </div>
                          <div>
                            <Badge variant={email.status === 'scheduled' ? 'outline' : email.status === 'sent' ? 'default' : 'destructive'}>
                              {email.status}
                            </Badge>
                            {email.optimizedTime && (
                              <Badge variant="secondary" className="ml-2">
                                AI optimized
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Time-Based Email Triggers</CardTitle>
                  <CardDescription>Configure automatic emails based on patient events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 rounded-lg border p-4">
                      <div className="flex-1">
                        <div className="font-medium">Appointment Reminder</div>
                        <div className="text-sm text-muted-foreground">Automatically send reminders 24 hours before appointments</div>
                      </div>
                      <Switch checked={true} />
                    </div>
                    
                    <div className="flex items-center gap-4 rounded-lg border p-4">
                      <div className="flex-1">
                        <div className="font-medium">Treatment Follow-up</div>
                        <div className="text-sm text-muted-foreground">Send follow-up emails 3 days after major procedures</div>
                      </div>
                      <Switch checked={true} />
                    </div>
                    
                    <div className="flex items-center gap-4 rounded-lg border p-4">
                      <div className="flex-1">
                        <div className="font-medium">Recall Reminder</div>
                        <div className="text-sm text-muted-foreground">Send recall reminders for patients due for checkups</div>
                      </div>
                      <Switch checked={false} />
                    </div>
                    
                    <Button variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Trigger
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Templates Tab */}
          <TabsContent value="templates">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Email Templates
                  </CardTitle>
                  <CardDescription>
                    Manage templates for patient communications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Your Templates</h3>
                      <Button onClick={() => setIsAddTemplateOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Template
                      </Button>
                    </div>
                    
                    <div className="grid gap-4 sm:grid-cols-2">
                      {emailTemplates.map((template) => (
                        <Card key={template.id} className="overflow-hidden">
                          <CardHeader className="p-4">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">{template.name}</CardTitle>
                              {template.aiGenerated && (
                                <Badge variant="outline" className="ml-2">
                                  <Brain className="mr-1 h-3 w-3" />
                                  AI Generated
                                </Badge>
                              )}
                            </div>
                            <CardDescription>{template.subject}</CardDescription>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <div className="max-h-24 overflow-hidden text-sm text-muted-foreground">
                              {template.body.split('\\n').map((line, i) => (
                                <p key={i}>{line}</p>
                              ))}
                            </div>
                          </CardContent>
                          <CardFooter className="border-t bg-muted/50 p-2">
                            <div className="flex w-full justify-between">
                              <span className="text-xs text-muted-foreground">
                                Type: {template.type.charAt(0).toUpperCase() + template.type.slice(1)}
                              </span>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm">Edit</Button>
                                <Button variant="ghost" size="sm">Use</Button>
                              </div>
                            </div>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>AI Template Generation</CardTitle>
                  <CardDescription>Generate personalized templates with AI</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="rounded-lg border p-4">
                      <h3 className="font-medium mb-2">Generate a Custom Template</h3>
                      <div className="space-y-4">
                        <div className="grid gap-2">
                          <Label htmlFor="ai-template-prompt">Describe your template needs</Label>
                          <Textarea 
                            id="ai-template-prompt" 
                            placeholder="e.g. Create a friendly email template for patients who missed their appointment" 
                            rows={3}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="ai-template-type">Template Type</Label>
                          <Select defaultValue="general">
                            <SelectTrigger id="ai-template-type">
                              <SelectValue placeholder="Select a type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="general">General</SelectItem>
                              <SelectItem value="reminder">Appointment Reminder</SelectItem>
                              <SelectItem value="followup">Treatment Follow-up</SelectItem>
                              <SelectItem value="welcome">Welcome Message</SelectItem>
                              <SelectItem value="billing">Billing Information</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button className="w-full">
                          <Brain className="mr-2 h-4 w-4" />
                          Generate Template with AI
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Monitoring Tab */}
          <TabsContent value="monitoring">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Inbox className="h-5 w-5 text-primary" />
                    Email Inbox Monitoring
                  </CardTitle>
                  <CardDescription>
                    AI-powered email analysis and automated responses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">Inbox Status</h3>
                        <Badge variant="outline">Connected</Badge>
                      </div>
                      
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="rounded-lg border p-3 text-center">
                          <div className="text-2xl font-bold">12</div>
                          <div className="text-sm text-muted-foreground">Unread Messages</div>
                        </div>
                        <div className="rounded-lg border p-3 text-center">
                          <div className="text-2xl font-bold">4</div>
                          <div className="text-sm text-muted-foreground">AI Analyzed</div>
                        </div>
                        <div className="rounded-lg border p-3 text-center">
                          <div className="text-2xl font-bold">2</div>
                          <div className="text-sm text-muted-foreground">Auto-Responded</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Recent Messages</h3>
                      
                      <div className="space-y-3">
                        <div className="rounded-lg border p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="font-medium">John Smith</div>
                              <div className="text-sm text-muted-foreground">Question about upcoming appointment</div>
                            </div>
                            <Badge>New</Badge>
                          </div>
                          <div className="text-sm mt-2">
                            Hi, I was wondering if I could reschedule my appointment next week...
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <Button size="sm" variant="outline">Reply</Button>
                            <Button size="sm" variant="outline">
                              <Brain className="mr-2 h-3 w-3" />
                              AI Analysis
                            </Button>
                          </div>
                        </div>
                        
                        <div className="rounded-lg border p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="font-medium">Laboratory Services</div>
                              <div className="text-sm text-muted-foreground">Lab results for patient #1234</div>
                            </div>
                            <Badge variant="outline">Analyzed</Badge>
                          </div>
                          <div className="text-sm mt-2">
                            Please find attached the lab results for the patient...
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <Button size="sm" variant="outline">Reply</Button>
                            <Button size="sm" variant="default">
                              <Eye className="mr-2 h-3 w-3" />
                              View AI Insights
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <Button variant="link" className="px-0">
                        View All Messages
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Automatic Response Rules</CardTitle>
                  <CardDescription>Configure how AI responds to different types of emails</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 rounded-lg border p-4">
                      <div className="flex-1">
                        <div className="font-medium">Appointment Requests</div>
                        <div className="text-sm text-muted-foreground">Auto-respond with available times</div>
                      </div>
                      <Switch checked={true} />
                    </div>
                    
                    <div className="flex items-center gap-4 rounded-lg border p-4">
                      <div className="flex-1">
                        <div className="font-medium">Insurance Questions</div>
                        <div className="text-sm text-muted-foreground">Forward to billing department</div>
                      </div>
                      <Switch checked={true} />
                    </div>
                    
                    <div className="flex items-center gap-4 rounded-lg border p-4">
                      <div className="flex-1">
                        <div className="font-medium">Emergency Requests</div>
                        <div className="text-sm text-muted-foreground">Flag high priority and notify staff</div>
                      </div>
                      <Switch checked={true} />
                    </div>
                    
                    <Button variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Rule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    Email Providers
                  </CardTitle>
                  <CardDescription>
                    Configure email accounts and providers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Connected Accounts</h3>
                      <Button onClick={() => setIsAddProviderOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Provider
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      {emailProviders.map((provider) => (
                        <div key={provider.id} className="flex items-center justify-between rounded-lg border p-4">
                          <div>
                            <div className="font-medium">{provider.name}</div>
                            <div className="text-sm text-muted-foreground">{provider.username}</div>
                            <div className="mt-1 flex items-center gap-2">
                              {provider.isDefault && (
                                <Badge variant="outline">Default</Badge>
                              )}
                              {provider.connected ? (
                                <Badge variant="default" className="bg-green-600">Connected</Badge>
                              ) : (
                                <Badge variant="destructive">Disconnected</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">Edit</Button>
                            <Button variant={provider.connected ? "destructive" : "default"} size="sm">
                              {provider.connected ? "Disconnect" : "Connect"}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>AI Email Analysis Settings</CardTitle>
                  <CardDescription>Configure how AI analyzes and processes emails</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <div className="font-medium">AI Email Analysis</div>
                        <div className="text-sm text-muted-foreground">Automatic processing of incoming emails</div>
                      </div>
                      <Switch checked={true} />
                    </div>
                    
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <div className="font-medium">Smart Categorization</div>
                        <div className="text-sm text-muted-foreground">Categorize emails by type and importance</div>
                      </div>
                      <Switch checked={true} />
                    </div>
                    
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <div className="font-medium">Patient Data Extraction</div>
                        <div className="text-sm text-muted-foreground">Automatically extract and update patient data</div>
                      </div>
                      <Switch checked={true} />
                    </div>
                    
                    <div className="rounded-lg border p-4">
                      <div className="mb-4">
                        <div className="font-medium">AI Model Selection</div>
                        <div className="text-sm text-muted-foreground">Select which AI models to use for email analysis</div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="ai-model-general" checked={true} />
                          <Label htmlFor="ai-model-general">General Email Analysis</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="ai-model-dental" checked={true} />
                          <Label htmlFor="ai-model-dental">Dental-Specific Terminology</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="ai-model-appointment" checked={true} />
                          <Label htmlFor="ai-model-appointment">Appointment Recognition</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="ai-model-billing" checked={true} />
                          <Label htmlFor="ai-model-billing">Insurance & Billing Recognition</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Add Provider Dialog */}
      <Dialog open={isAddProviderOpen} onOpenChange={setIsAddProviderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Email Provider</DialogTitle>
            <DialogDescription>
              Configure a new email provider for sending and receiving emails
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="provider-name">Provider Name</Label>
              <Input 
                id="provider-name" 
                value={newProvider.name || ''} 
                onChange={(e) => setNewProvider({...newProvider, name: e.target.value})}
                placeholder="e.g. Office Email"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="provider-host">SMTP Host</Label>
              <Input 
                id="provider-host" 
                value={newProvider.host || ''} 
                onChange={(e) => setNewProvider({...newProvider, host: e.target.value})}
                placeholder="e.g. smtp.example.com"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="provider-port">SMTP Port</Label>
              <Input 
                id="provider-port" 
                type="number" 
                value={newProvider.port || 587} 
                onChange={(e) => setNewProvider({...newProvider, port: parseInt(e.target.value)})}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="provider-username">Email Username</Label>
              <Input 
                id="provider-username" 
                value={newProvider.username || ''} 
                onChange={(e) => setNewProvider({...newProvider, username: e.target.value})}
                placeholder="e.g. office@dentamind.com"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="provider-password">Email Password</Label>
              <PasswordInput 
                id="provider-password" 
                placeholder="Enter your email password"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="use-ssl" 
                checked={newProvider.useSSL || false} 
                onCheckedChange={(checked) => setNewProvider({...newProvider, useSSL: checked === true})}
              />
              <Label htmlFor="use-ssl">Use SSL/TLS Connection</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="is-default" 
                checked={newProvider.isDefault || false} 
                onCheckedChange={(checked) => setNewProvider({...newProvider, isDefault: checked === true})}
              />
              <Label htmlFor="is-default">Set as Default Provider</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddProviderOpen(false)}>Cancel</Button>
            <Button onClick={handleAddProvider}>Add Provider</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Template Dialog */}
      <Dialog open={isAddTemplateOpen} onOpenChange={setIsAddTemplateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Email Template</DialogTitle>
            <DialogDescription>
              Create a reusable email template for patient communications
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input 
                id="template-name" 
                value={newTemplate.name || ''} 
                onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                placeholder="e.g. Appointment Reminder"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="template-type">Template Type</Label>
              <Select 
                value={newTemplate.type} 
                onValueChange={(value) => setNewTemplate({...newTemplate, type: value})}
              >
                <SelectTrigger id="template-type">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="reminder">Appointment Reminder</SelectItem>
                  <SelectItem value="followup">Follow-up</SelectItem>
                  <SelectItem value="treatment">Treatment Plan</SelectItem>
                  <SelectItem value="welcome">Welcome</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="template-subject">Email Subject</Label>
              <Input 
                id="template-subject" 
                value={newTemplate.subject || ''} 
                onChange={(e) => setNewTemplate({...newTemplate, subject: e.target.value})}
                placeholder="e.g. Your upcoming dental appointment"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="template-body">Email Body</Label>
              <Textarea 
                id="template-body" 
                value={newTemplate.body || ''} 
                onChange={(e) => setNewTemplate({...newTemplate, body: e.target.value})}
                placeholder="Dear {{patientName}},

Thank you for choosing our dental practice. We are looking forward to seeing you on {{appointmentDate}}."
                rows={8}
              />
              <div className="text-sm text-muted-foreground">
                Use variables like {{patientName}}, {{appointmentDate}}, {{doctorName}} that will be replaced with actual values.
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="ai-generated" 
                checked={newTemplate.aiGenerated || false} 
                onCheckedChange={(checked) => setNewTemplate({...newTemplate, aiGenerated: checked === true})}
              />
              <Label htmlFor="ai-generated">AI Generated Template</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddTemplateOpen(false)}>Cancel</Button>
            <Button onClick={handleAddTemplate}>Create Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Schedule Email Dialog */}
      <Dialog open={isScheduleEmailOpen} onOpenChange={setIsScheduleEmailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule Email</DialogTitle>
            <DialogDescription>
              Schedule an email to be sent at a specified time
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email-recipient">Recipient Email</Label>
              <Input 
                id="email-recipient" 
                value={newScheduledEmail.recipientEmail || ''} 
                onChange={(e) => setNewScheduledEmail({...newScheduledEmail, recipientEmail: e.target.value})}
                placeholder="e.g. patient@example.com"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="email-subject">Email Subject</Label>
              <Input 
                id="email-subject" 
                value={newScheduledEmail.subject || ''} 
                onChange={(e) => setNewScheduledEmail({...newScheduledEmail, subject: e.target.value})}
                placeholder="e.g. Your upcoming dental appointment"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="email-body">Email Body</Label>
              <Textarea 
                id="email-body" 
                value={newScheduledEmail.body || ''} 
                onChange={(e) => setNewScheduledEmail({...newScheduledEmail, body: e.target.value})}
                placeholder="Enter the email content here..."
                rows={6}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="email-scheduled-time">Scheduled Time</Label>
              <Input 
                id="email-scheduled-time" 
                type="datetime-local" 
                value={newScheduledEmail.scheduledTime || ''} 
                onChange={(e) => setNewScheduledEmail({...newScheduledEmail, scheduledTime: e.target.value})}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="email-priority">Priority</Label>
              <Select 
                value={newScheduledEmail.priority || 'normal'} 
                onValueChange={(value: any) => setNewScheduledEmail({...newScheduledEmail, priority: value})}
              >
                <SelectTrigger id="email-priority">
                  <SelectValue placeholder="Select a priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="optimized-time" 
                checked={newScheduledEmail.optimizedTime || false} 
                onCheckedChange={(checked) => setNewScheduledEmail({...newScheduledEmail, optimizedTime: checked === true})}
              />
              <Label htmlFor="optimized-time">
                Use AI to optimize delivery time for better engagement
              </Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScheduleEmailOpen(false)}>Cancel</Button>
            <Button onClick={handleScheduleEmail}>Schedule Email</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

export default UnifiedEmailPage;