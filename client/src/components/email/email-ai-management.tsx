import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  Mail, 
  Settings, 
  Inbox, 
  Send, 
  Loader2, 
  CheckCircle, 
  AlertTriangle, 
  RotateCw, 
  Plus,
  Edit,
  Trash2,
  Eye,
  Brain,
  FileText
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

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

interface EmailProviderForm {
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  useSSL: boolean;
  isDefault: boolean;
}

interface EmailMonitorStatus {
  status: 'connected' | 'disconnected' | 'error';
  lastCheck: string;
  unreadCount: number;
  monitoredFolders: string[];
  emailsProcessed: number;
  aiAnalyzed: number;
}

export function EmailAIManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("settings");
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [providers, setProviders] = useState<EmailProvider[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [monitorStatus, setMonitorStatus] = useState<EmailMonitorStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewProvider, setShowNewProvider] = useState(false);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [editingProvider, setEditingProvider] = useState<(EmailProvider & { password?: string }) | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [aiEnabled, setAiEnabled] = useState(false);
  const [monitorSettings, setMonitorSettings] = useState({
    enableMonitoring: false,
    checkIntervalMinutes: 5,
    monitoredFolders: 'INBOX',
    enableAutoResponder: false,
    processAttachments: true
  });

  // New provider form state
  const [newProvider, setNewProvider] = useState<EmailProviderForm>({
    name: '',
    host: '',
    port: 587,
    username: '',
    password: '',
    useSSL: true,
    isDefault: false
  });

  // New template form state
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    subject: '',
    body: '',
    type: 'general',
    aiGenerated: false
  });

  useEffect(() => {
    // Fetch configuration data
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch email providers
      const providersResponse = await fetch('/api/email-ai/providers');
      if (providersResponse.ok) {
        const providersData = await providersResponse.json();
        setProviders(providersData);
      }

      // Fetch email templates
      const templatesResponse = await fetch('/api/email-ai/templates');
      if (templatesResponse.ok) {
        const templatesData = await templatesResponse.json();
        setTemplates(templatesData);
      }

      // Fetch monitor status
      const statusResponse = await fetch('/api/email-ai/status');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setMonitorStatus(statusData);
        
        // Update settings
        setMonitorSettings({
          enableMonitoring: statusData.monitoring?.enabled || false,
          checkIntervalMinutes: statusData.monitoring?.checkInterval || 5,
          monitoredFolders: statusData.monitoring?.folders?.join(',') || 'INBOX',
          enableAutoResponder: statusData.autoResponder?.enabled || false,
          processAttachments: statusData.monitoring?.processAttachments || true
        });
        
        setAiEnabled(statusData.aiEnabled || false);
      }
    } catch (error: any) {
      console.error('Error fetching email configuration:', error);
      toast({
        title: "Failed to load configuration",
        description: "There was an error loading the email AI configuration.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveProvider = async () => {
    setIsConfiguring(true);
    try {
      const data = editingProvider || newProvider;
      const method = editingProvider ? 'PUT' : 'POST';
      const endpoint = editingProvider ? `/api/email-ai/providers/${editingProvider.id}` : '/api/email-ai/providers';
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        toast({
          title: "Provider saved",
          description: editingProvider ? "Email provider updated successfully" : "New email provider added successfully",
        });
        
        // Refresh data
        fetchData();
        
        // Reset forms
        setEditingProvider(null);
        setNewProvider({
          name: '',
          host: '',
          port: 587,
          username: '',
          password: '',
          useSSL: true,
          isDefault: false
        });
        setShowNewProvider(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save provider');
      }
    } catch (error: any) {
      console.error('Error saving provider:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save email provider",
        variant: "destructive"
      });
    } finally {
      setIsConfiguring(false);
    }
  };

  const saveTemplate = async () => {
    setIsConfiguring(true);
    try {
      const data = editingTemplate || newTemplate;
      const method = editingTemplate ? 'PUT' : 'POST';
      const endpoint = editingTemplate ? `/api/email-ai/templates/${editingTemplate.id}` : '/api/email-ai/templates';
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        toast({
          title: "Template saved",
          description: editingTemplate ? "Email template updated successfully" : "New email template added successfully",
        });
        
        // Refresh data
        fetchData();
        
        // Reset forms
        setEditingTemplate(null);
        setNewTemplate({
          name: '',
          subject: '',
          body: '',
          type: 'general',
          aiGenerated: false
        });
        setShowNewTemplate(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save template');
      }
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save email template",
        variant: "destructive"
      });
    } finally {
      setIsConfiguring(false);
    }
  };

  const testConnection = async (providerId: string) => {
    setIsTesting(true);
    try {
      const response = await fetch(`/api/email-ai/providers/${providerId}/test`, {
        method: 'POST'
      });
      
      if (response.ok) {
        toast({
          title: "Connection successful",
          description: "Successfully connected to the email server",
        });
        fetchData(); // Refresh connection status
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Connection test failed');
      }
    } catch (error: any) {
      console.error('Error testing connection:', error);
      toast({
        title: "Connection failed",
        description: error.message || "Failed to connect to the email server",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const deleteProvider = async (providerId: string) => {
    if (!confirm("Are you sure you want to delete this email provider?")) return;
    
    try {
      const response = await fetch(`/api/email-ai/providers/${providerId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast({
          title: "Provider deleted",
          description: "Email provider has been deleted successfully",
        });
        fetchData(); // Refresh data
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete provider');
      }
    } catch (error: any) {
      console.error('Error deleting provider:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete email provider",
        variant: "destructive"
      });
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this email template?")) return;
    
    try {
      const response = await fetch(`/api/email-ai/templates/${templateId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast({
          title: "Template deleted",
          description: "Email template has been deleted successfully",
        });
        fetchData(); // Refresh data
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete template');
      }
    } catch (error: any) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete email template",
        variant: "destructive"
      });
    }
  };

  const saveMonitorSettings = async () => {
    setIsConfiguring(true);
    try {
      const response = await fetch('/api/email-ai/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          monitoring: {
            enabled: monitorSettings.enableMonitoring,
            checkInterval: monitorSettings.checkIntervalMinutes,
            folders: monitorSettings.monitoredFolders.split(',').map(f => f.trim()),
            processAttachments: monitorSettings.processAttachments
          },
          autoResponder: {
            enabled: monitorSettings.enableAutoResponder
          },
          aiEnabled: aiEnabled
        })
      });
      
      if (response.ok) {
        toast({
          title: "Settings saved",
          description: "Email monitoring settings have been updated",
        });
        fetchData(); // Refresh data
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save settings');
      }
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save email monitoring settings",
        variant: "destructive"
      });
    } finally {
      setIsConfiguring(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: "Missing information",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }
    
    setIsTesting(true);
    try {
      const response = await fetch('/api/email-ai/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: testEmail })
      });
      
      if (response.ok) {
        toast({
          title: "Test email sent",
          description: `A test email has been sent to ${testEmail}`,
        });
        setTestEmail('');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send test email');
      }
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send test email",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const refreshStatus = async () => {
    try {
      const response = await fetch('/api/email-ai/status');
      if (response.ok) {
        const statusData = await response.json();
        setMonitorStatus(statusData);
        
        toast({
          title: "Status refreshed",
          description: "Email AI monitoring status has been updated",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to refresh status');
      }
    } catch (error: any) {
      console.error('Error refreshing status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to refresh status",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        <span>Loading Email AI Configuration...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto mb-10">
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-3">
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Email Templates
            </TabsTrigger>
            <TabsTrigger value="monitor" className="flex items-center gap-2">
              <Inbox className="h-4 w-4" />
              Email Monitoring
            </TabsTrigger>
          </TabsList>
          
          {/* Configuration Tab */}
          <TabsContent value="settings">
            <div className="space-y-6">
              <Card className="border border-gray-200 bg-card text-card-foreground shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Email Provider Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure the email providers for AI integration and automation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Email Providers</h3>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowNewProvider(true)}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Provider
                      </Button>
                    </div>
                    
                    {providers.length === 0 ? (
                      <div className="mt-4 p-6 border border-dashed rounded-lg text-center">
                        <p className="text-muted-foreground mb-2">No email providers configured</p>
                        <Button 
                          variant="default" 
                          onClick={() => setShowNewProvider(true)}
                          className="mt-2"
                        >
                          Configure Email Provider
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-4">
                        {providers.map((provider) => (
                          <Card key={provider.id} className="border border-gray-100 shadow-sm">
                            <CardHeader className="p-4 pb-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <CardTitle className="text-base">{provider.name}</CardTitle>
                                  {provider.isDefault && (
                                    <Badge className="bg-green-500 hover:bg-green-600">Default</Badge>
                                  )}
                                  {provider.connected ? (
                                    <Badge className="bg-green-500 hover:bg-green-600">Connected</Badge>
                                  ) : (
                                    <Badge className="bg-red-500 hover:bg-red-600">Disconnected</Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => setEditingProvider(provider)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => deleteProvider(provider.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </div>
                              <CardDescription>
                                {provider.host}:{provider.port}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 pt-2">
                              <div className="text-sm text-muted-foreground">
                                <p>Username: {provider.username}</p>
                                <p>SSL: {provider.useSSL ? 'Enabled' : 'Disabled'}</p>
                              </div>
                            </CardContent>
                            <CardFooter className="p-4 border-t justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                disabled={isTesting}
                                onClick={() => testConnection(provider.id)}
                              >
                                {isTesting ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                )}
                                Test Connection
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <div className="w-full flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch 
                        id="ai-enabled" 
                        checked={aiEnabled}
                        onCheckedChange={setAiEnabled}
                      />
                      <Label htmlFor="ai-enabled" className="flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        Enable AI Email Integration
                      </Label>
                    </div>
                    <Button onClick={saveMonitorSettings} disabled={isConfiguring}>
                      {isConfiguring ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      )}
                      Save Configuration
                    </Button>
                  </div>
                </CardFooter>
              </Card>
              
              <Card className="border border-gray-200 bg-card text-card-foreground shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Send Test Email
                  </CardTitle>
                  <CardDescription>
                    Test your email configuration by sending a test message
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label htmlFor="test-email">Recipient Email Address</Label>
                      <Input 
                        id="test-email" 
                        placeholder="email@example.com" 
                        className="mt-1"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button 
                        variant="default" 
                        disabled={isTesting || !testEmail}
                        onClick={sendTestEmail}
                      >
                        {isTesting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="mr-2 h-4 w-4" />
                        )}
                        Send Test Email
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Templates Tab */}
          <TabsContent value="templates">
            <div className="space-y-6">
              <Card className="border border-gray-200 bg-card text-card-foreground shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Email Templates
                  </CardTitle>
                  <CardDescription>
                    Manage email templates for automated responses and notifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Email Templates</h3>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowNewTemplate(true)}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Template
                      </Button>
                    </div>
                    
                    {templates.length === 0 ? (
                      <div className="mt-4 p-6 border border-dashed rounded-lg text-center">
                        <p className="text-muted-foreground mb-2">No email templates configured</p>
                        <Button 
                          variant="default" 
                          onClick={() => setShowNewTemplate(true)}
                          className="mt-2"
                        >
                          Create Template
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {templates.map((template) => (
                          <Card key={template.id} className="border border-gray-100 shadow-sm">
                            <CardHeader className="p-4 pb-2">
                              <div className="flex items-center justify-between">
                                <div className="flex flex-col gap-1">
                                  <CardTitle className="text-base">{template.name}</CardTitle>
                                  <div className="flex items-center gap-2">
                                    <Badge className="bg-gray-200 text-gray-700 hover:bg-gray-300">
                                      {template.type}
                                    </Badge>
                                    {template.aiGenerated && (
                                      <Badge className="bg-indigo-500 hover:bg-indigo-600">
                                        AI Generated
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => setEditingTemplate(template)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => deleteTemplate(template.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-2">
                              <div className="text-sm text-muted-foreground">
                                <p><span className="font-medium">Subject:</span> {template.subject}</p>
                                <p className="mt-2 line-clamp-2">{template.body}</p>
                              </div>
                            </CardContent>
                            <CardFooter className="p-4 border-t">
                              <div className="w-full flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                  {template.lastUsed ? `Last used: ${new Date(template.lastUsed).toLocaleDateString()}` : 'Never used'}
                                </span>
                                <Button variant="ghost" size="sm">
                                  <Eye className="mr-1 h-4 w-4" />
                                  Preview
                                </Button>
                              </div>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Monitor Tab */}
          <TabsContent value="monitor">
            <div className="space-y-6">
              <Card className="border border-gray-200 bg-card text-card-foreground shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Email Monitoring Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure settings for email monitoring and AI-powered responses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Switch 
                        id="enable-monitoring" 
                        checked={monitorSettings.enableMonitoring}
                        onCheckedChange={(checked) => 
                          setMonitorSettings({...monitorSettings, enableMonitoring: checked})
                        }
                      />
                      <Label htmlFor="enable-monitoring">Enable Email Monitoring</Label>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="check-interval">Check Interval (minutes)</Label>
                        <Input 
                          id="check-interval" 
                          type="number" 
                          min="1" 
                          max="60" 
                          value={monitorSettings.checkIntervalMinutes}
                          onChange={(e) => 
                            setMonitorSettings({
                              ...monitorSettings, 
                              checkIntervalMinutes: parseInt(e.target.value) || 5
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="monitored-folders">Monitored Folders (comma separated)</Label>
                        <Input 
                          id="monitored-folders" 
                          value={monitorSettings.monitoredFolders}
                          onChange={(e) => 
                            setMonitorSettings({...monitorSettings, monitoredFolders: e.target.value})
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch 
                        id="process-attachments" 
                        checked={monitorSettings.processAttachments}
                        onCheckedChange={(checked) => 
                          setMonitorSettings({...monitorSettings, processAttachments: checked})
                        }
                      />
                      <Label htmlFor="process-attachments">Process Email Attachments</Label>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch 
                        id="enable-autoresponder" 
                        checked={monitorSettings.enableAutoResponder}
                        onCheckedChange={(checked) => 
                          setMonitorSettings({...monitorSettings, enableAutoResponder: checked})
                        }
                      />
                      <Label htmlFor="enable-autoresponder">Enable AI Auto-Responder</Label>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="justify-end border-t p-4">
                  <Button onClick={saveMonitorSettings} disabled={isConfiguring}>
                    {isConfiguring ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Save Settings
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className="border border-gray-200 bg-card text-card-foreground shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Inbox className="h-5 w-5" />
                    Email Monitor Status
                  </CardTitle>
                  <CardDescription>
                    Current status of email monitoring and AI integration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {monitorStatus ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Status:</span>
                          {monitorStatus.status === 'connected' ? (
                            <Badge className="bg-green-500">Connected</Badge>
                          ) : monitorStatus.status === 'disconnected' ? (
                            <Badge className="bg-gray-500">Disconnected</Badge>
                          ) : (
                            <Badge className="bg-red-500">Error</Badge>
                          )}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={refreshStatus}
                          className="flex items-center gap-1"
                        >
                          <RotateCw className="h-4 w-4" />
                          Refresh Status
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border border-gray-100">
                          <CardHeader className="p-3 pb-1">
                            <CardTitle className="text-sm font-medium">Unread Emails</CardTitle>
                          </CardHeader>
                          <CardContent className="p-3 pt-1">
                            <p className="text-2xl font-bold">{monitorStatus.unreadCount}</p>
                          </CardContent>
                        </Card>
                        
                        <Card className="border border-gray-100">
                          <CardHeader className="p-3 pb-1">
                            <CardTitle className="text-sm font-medium">Emails Processed</CardTitle>
                          </CardHeader>
                          <CardContent className="p-3 pt-1">
                            <p className="text-2xl font-bold">{monitorStatus.emailsProcessed}</p>
                          </CardContent>
                        </Card>
                        
                        <Card className="border border-gray-100">
                          <CardHeader className="p-3 pb-1">
                            <CardTitle className="text-sm font-medium">AI Analyzed</CardTitle>
                          </CardHeader>
                          <CardContent className="p-3 pt-1">
                            <p className="text-2xl font-bold">{monitorStatus.aiAnalyzed}</p>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <div className="mt-4">
                        <h3 className="text-sm font-medium mb-2">Monitored Folders:</h3>
                        <div className="flex flex-wrap gap-2">
                          {monitorStatus.monitoredFolders.map((folder, index) => (
                            <Badge key={index} variant="outline">{folder}</Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        Last check: {monitorStatus.lastCheck ? new Date(monitorStatus.lastCheck).toLocaleString() : 'Never'}
                      </div>
                    </div>
                  ) : (
                    <Alert className="bg-yellow-50 border-yellow-200">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertTitle>Not Configured</AlertTitle>
                      <AlertDescription>
                        Email monitoring has not been configured or is not active. 
                        Setup an email provider and enable monitoring.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Add Provider Dialog */}
      <Dialog open={showNewProvider} onOpenChange={setShowNewProvider}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Email Provider</DialogTitle>
            <DialogDescription>
              Add a new email provider for AI email integration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="provider-name">Provider Name</Label>
                <Input 
                  id="provider-name" 
                  value={newProvider.name}
                  onChange={(e) => setNewProvider({...newProvider, name: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="provider-host">Host</Label>
                <Input 
                  id="provider-host" 
                  value={newProvider.host}
                  onChange={(e) => setNewProvider({...newProvider, host: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="provider-port">Port</Label>
                <Input 
                  id="provider-port" 
                  type="number" 
                  value={newProvider.port}
                  onChange={(e) => setNewProvider({...newProvider, port: parseInt(e.target.value) || 587})}
                  className="mt-1"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="provider-username">Username</Label>
                <Input 
                  id="provider-username" 
                  value={newProvider.username}
                  onChange={(e) => setNewProvider({...newProvider, username: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="provider-password">Password</Label>
                <PasswordInput 
                  id="provider-password" 
                  value={newProvider.password}
                  onChange={(e) => setNewProvider({...newProvider, password: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <Switch 
                  id="provider-ssl" 
                  checked={newProvider.useSSL}
                  onCheckedChange={(checked) => setNewProvider({...newProvider, useSSL: checked})}
                />
                <Label htmlFor="provider-ssl">Use SSL</Label>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <Switch 
                  id="provider-default" 
                  checked={newProvider.isDefault}
                  onCheckedChange={(checked) => setNewProvider({...newProvider, isDefault: checked})}
                />
                <Label htmlFor="provider-default">Set as Default Provider</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewProvider(false)}>Cancel</Button>
            <Button type="submit" onClick={saveProvider} disabled={isConfiguring}>
              {isConfiguring && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Provider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Template Dialog */}
      <Dialog open={showNewTemplate} onOpenChange={setShowNewTemplate}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Email Template</DialogTitle>
            <DialogDescription>
              Create a new email template for automated responses
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="template-name">Template Name</Label>
              <Input 
                id="template-name" 
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="template-type">Template Type</Label>
              <Select 
                value={newTemplate.type}
                onValueChange={(value) => setNewTemplate({...newTemplate, type: value})}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select template type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="appointment">Appointment</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                  <SelectItem value="welcome">Welcome</SelectItem>
                  <SelectItem value="follow-up">Follow-up</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="template-subject">Email Subject</Label>
              <Input 
                id="template-subject" 
                value={newTemplate.subject}
                onChange={(e) => setNewTemplate({...newTemplate, subject: e.target.value})}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="template-body">Email Body</Label>
              <Textarea 
                id="template-body" 
                value={newTemplate.body}
                onChange={(e) => setNewTemplate({...newTemplate, body: e.target.value})}
                className="mt-1 min-h-[200px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch 
                id="template-ai" 
                checked={newTemplate.aiGenerated}
                onCheckedChange={(checked) => setNewTemplate({...newTemplate, aiGenerated: checked})}
              />
              <Label htmlFor="template-ai">AI Generated Template</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewTemplate(false)}>Cancel</Button>
            <Button type="submit" onClick={saveTemplate} disabled={isConfiguring}>
              {isConfiguring && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Provider Dialog */}
      {editingProvider && (
        <Dialog open={!!editingProvider} onOpenChange={(open) => !open && setEditingProvider(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Email Provider</DialogTitle>
              <DialogDescription>
                Update the email provider configuration
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="edit-provider-name">Provider Name</Label>
                  <Input 
                    id="edit-provider-name" 
                    value={editingProvider.name}
                    onChange={(e) => setEditingProvider({...editingProvider, name: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-provider-host">Host</Label>
                  <Input 
                    id="edit-provider-host" 
                    value={editingProvider.host}
                    onChange={(e) => setEditingProvider({...editingProvider, host: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-provider-port">Port</Label>
                  <Input 
                    id="edit-provider-port" 
                    type="number" 
                    value={editingProvider.port}
                    onChange={(e) => setEditingProvider({...editingProvider, port: parseInt(e.target.value) || 587})}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit-provider-username">Username</Label>
                  <Input 
                    id="edit-provider-username" 
                    value={editingProvider.username}
                    onChange={(e) => setEditingProvider({...editingProvider, username: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit-provider-password">Password (leave blank to keep unchanged)</Label>
                  <PasswordInput 
                    id="edit-provider-password" 
                    onChange={(e) => setEditingProvider({...editingProvider, password: e.target.value || undefined})}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <Switch 
                    id="edit-provider-ssl" 
                    checked={editingProvider.useSSL}
                    onCheckedChange={(checked) => setEditingProvider({...editingProvider, useSSL: checked})}
                  />
                  <Label htmlFor="edit-provider-ssl">Use SSL</Label>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <Switch 
                    id="edit-provider-default" 
                    checked={editingProvider.isDefault}
                    onCheckedChange={(checked) => setEditingProvider({...editingProvider, isDefault: checked})}
                  />
                  <Label htmlFor="edit-provider-default">Set as Default Provider</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingProvider(null)}>Cancel</Button>
              <Button type="submit" onClick={saveProvider} disabled={isConfiguring}>
                {isConfiguring && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Provider
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Edit Template Dialog */}
      {editingTemplate && (
        <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Email Template</DialogTitle>
              <DialogDescription>
                Update the email template configuration
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-template-name">Template Name</Label>
                <Input 
                  id="edit-template-name" 
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({...editingTemplate, name: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-template-type">Template Type</Label>
                <Select 
                  value={editingTemplate.type}
                  onValueChange={(value) => setEditingTemplate({...editingTemplate, type: value})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select template type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="appointment">Appointment</SelectItem>
                    <SelectItem value="reminder">Reminder</SelectItem>
                    <SelectItem value="welcome">Welcome</SelectItem>
                    <SelectItem value="follow-up">Follow-up</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-template-subject">Email Subject</Label>
                <Input 
                  id="edit-template-subject" 
                  value={editingTemplate.subject}
                  onChange={(e) => setEditingTemplate({...editingTemplate, subject: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-template-body">Email Body</Label>
                <Textarea 
                  id="edit-template-body" 
                  value={editingTemplate.body}
                  onChange={(e) => setEditingTemplate({...editingTemplate, body: e.target.value})}
                  className="mt-1 min-h-[200px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  id="edit-template-ai" 
                  checked={editingTemplate.aiGenerated}
                  onCheckedChange={(checked) => setEditingTemplate({...editingTemplate, aiGenerated: checked})}
                />
                <Label htmlFor="edit-template-ai">AI Generated Template</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingTemplate(null)}>Cancel</Button>
              <Button type="submit" onClick={saveTemplate} disabled={isConfiguring}>
                {isConfiguring && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}