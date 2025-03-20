import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Mail, RefreshCw, Calendar, File, FileText, AlertTriangle } from 'lucide-react';

// Email provider schema
const emailProviderSchema = z.object({
  type: z.enum(['gmail', 'outlook', 'smtp']),
  email: z.string().email(),
  authType: z.enum(['oauth2', 'password']).default('oauth2'),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional()
});

// Email template schema
const emailTemplateSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Template name is required"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  category: z.enum([
    'appointment', 
    'lab_update', 
    'insurance', 
    'prescription', 
    'patient_education',
    'marketing',
    'follow_up',
    'billing'
  ]),
  variables: z.array(z.string()).optional(),
});

// Email test schema
const testEmailSchema = z.object({
  to: z.string().email("A valid email address is required"),
  templateId: z.string().min(1, "Template selection is required"),
  data: z.record(z.string()).optional()
});

type EmailProvider = z.infer<typeof emailProviderSchema>;
type EmailTemplate = z.infer<typeof emailTemplateSchema>;
type TestEmail = z.infer<typeof testEmailSchema>;

export function EmailAIManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('config');

  // Load email configuration
  const { 
    data: configData, 
    isLoading: configLoading, 
    error: configError,
    refetch: refetchConfig
  } = useQuery({
    queryKey: ['/api/email/configuration'],
    retry: false,
  });

  // Load email templates
  const { 
    data: templatesData, 
    isLoading: templatesLoading, 
    error: templatesError,
    refetch: refetchTemplates
  } = useQuery({
    queryKey: ['/api/email/templates'],
    retry: false,
  });

  // Load email providers
  const { 
    data: providersData, 
    isLoading: providersLoading, 
    error: providersError,
    refetch: refetchProviders
  } = useQuery({
    queryKey: ['/api/email/providers'],
    retry: false,
  });

  // Handle template creation/update
  const templateMutation = useMutation({
    mutationFn: (template: EmailTemplate) => {
      return apiRequest('/api/email/templates', {
        method: 'POST',
        data: template
      });
    },
    onSuccess: () => {
      toast({
        title: "Template saved",
        description: "Email template has been saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/email/templates'] });
      templateForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error saving template",
        description: error.message || "Failed to save email template",
        variant: "destructive",
      });
    }
  });

  // Handle provider configuration
  const providerMutation = useMutation({
    mutationFn: (provider: EmailProvider) => {
      return apiRequest('/api/email/providers', {
        method: 'POST',
        data: provider
      });
    },
    onSuccess: () => {
      toast({
        title: "Provider configured",
        description: "Email provider has been configured successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/email/providers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/email/configuration'] });
      providerForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error configuring provider",
        description: error.message || "Failed to configure email provider",
        variant: "destructive",
      });
    }
  });

  // Handle test email sending
  const testEmailMutation = useMutation({
    mutationFn: (testData: TestEmail) => {
      return apiRequest('/api/email/send', {
        method: 'POST',
        data: {
          templateId: testData.templateId,
          to: testData.to,
          data: testData.data || {}
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Test email sent",
        description: "The test email has been sent successfully",
      });
      testEmailForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error sending test email",
        description: error.message || "Failed to send test email",
        variant: "destructive",
      });
    }
  });

  // Setup forms
  const providerForm = useForm<EmailProvider>({
    resolver: zodResolver(emailProviderSchema),
    defaultValues: {
      type: 'gmail',
      email: '',
      authType: 'oauth2',
      name: '',
      description: ''
    }
  });

  const templateForm = useForm<EmailTemplate>({
    resolver: zodResolver(emailTemplateSchema),
    defaultValues: {
      name: '',
      subject: '',
      body: '',
      category: 'appointment',
      variables: []
    }
  });

  const testEmailForm = useForm<TestEmail>({
    resolver: zodResolver(testEmailSchema),
    defaultValues: {
      to: '',
      templateId: '',
      data: {}
    }
  });

  // Handlers
  const handleProviderSubmit = (data: EmailProvider) => {
    providerMutation.mutate(data);
  };

  const handleTemplateSubmit = (data: EmailTemplate) => {
    templateMutation.mutate(data);
  };

  const handleTestEmailSubmit = (data: TestEmail) => {
    testEmailMutation.mutate(data);
  };

  const handleRefreshConfig = () => {
    refetchConfig();
    refetchTemplates();
    refetchProviders();
    toast({
      title: "Refreshed",
      description: "Configuration data has been refreshed",
    });
  };

  // Select a template for editing
  const handleSelectTemplate = (template: EmailTemplate) => {
    templateForm.reset(template);
    setActiveTab('templates');
  };

  // Generate placeholder template form data by category
  const handleTemplateCategory = (category: string) => {
    const placeholders: Record<string, { subject: string, variables: string[] }> = {
      appointment: {
        subject: 'Your upcoming appointment with {{doctorName}}',
        variables: ['patientName', 'doctorName', 'appointmentDate', 'appointmentTime']
      },
      lab_update: {
        subject: 'Update on your lab case',
        variables: ['patientName', 'labStatus', 'completionDate', 'caseNumber']
      },
      insurance: {
        subject: 'Insurance claim status update',
        variables: ['patientName', 'claimNumber', 'insuranceProvider', 'status', 'amount']
      },
      prescription: {
        subject: 'Your prescription information',
        variables: ['patientName', 'doctorName', 'medicationName', 'dosage', 'frequency', 'duration']
      },
      patient_education: {
        subject: 'Information about your dental condition',
        variables: ['patientName', 'conditionName', 'treatmentOptions', 'preventionTips']
      },
      marketing: {
        subject: 'Special offer from DentaMind',
        variables: ['patientName', 'offerDetails', 'expirationDate', 'savings']
      },
      follow_up: {
        subject: 'Follow-up on your recent dental visit',
        variables: ['patientName', 'doctorName', 'visitDate', 'procedureName']
      },
      billing: {
        subject: 'Your recent invoice from DentaMind',
        variables: ['patientName', 'invoiceNumber', 'invoiceDate', 'dueDate', 'amount']
      }
    };

    if (placeholders[category]) {
      templateForm.setValue('subject', placeholders[category].subject);
      templateForm.setValue('variables', placeholders[category].variables);
      
      // Generate a sample body with variables
      const variables = placeholders[category].variables;
      let sampleBody = `Dear {{${variables[0] || 'patientName'}}},\n\n`;
      
      sampleBody += `This is a sample template for ${category.replace('_', ' ')} emails.\n\n`;
      
      variables.forEach(variable => {
        sampleBody += `{{${variable}}}\n`;
      });
      
      sampleBody += '\n\nBest regards,\nThe DentaMind Team';
      
      templateForm.setValue('body', sampleBody);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Email AI Management</h2>
          <p className="text-muted-foreground">
            Configure email integration and AI for automated communications
          </p>
        </div>
        <Button onClick={handleRefreshConfig} variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {configError && (
        <Card className="mb-6 border-destructive">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Configuration Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{configError instanceof Error ? configError.message : 'Failed to load configuration'}</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => refetchConfig()}>
              Retry
            </Button>
          </CardFooter>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Email Status</CardTitle>
              <CardDescription>
                Current configuration status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {configLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 rounded-full animate-pulse bg-primary"></div>
                  <span>Checking configuration...</span>
                </div>
              ) : configData ? (
                <>
                  <div className="flex items-center justify-between">
                    <span>Email provider:</span>
                    {configData.configured ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
                        <Check className="h-3 w-3 mr-1" /> Configured
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50">
                        <X className="h-3 w-3 mr-1" /> Not configured
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Templates:</span>
                    {templatesData && templatesData.length > 0 ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
                        {templatesData.length} available
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50">
                        None defined
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground mt-2">
                    {configData.status}
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground">
                  Configuration status not available
                </div>
              )}
            </CardContent>
          </Card>

          {templatesData && templatesData.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Templates</CardTitle>
                <CardDescription>
                  Available email templates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {templatesData.map((template: any) => (
                  <div 
                    key={template.id}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer"
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <div>
                      <div className="font-medium text-sm">{template.name}</div>
                      <div className="text-xs text-muted-foreground">{template.category}</div>
                    </div>
                    <Badge variant="outline" className="text-xs">{template.id}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
        
        <div className="md:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="config">
                <Mail className="h-4 w-4 mr-2" />
                Configuration
              </TabsTrigger>
              <TabsTrigger value="templates">
                <FileText className="h-4 w-4 mr-2" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="test">
                <File className="h-4 w-4 mr-2" />
                Test Email
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="config">
              <Card>
                <CardHeader>
                  <CardTitle>Email Provider Configuration</CardTitle>
                  <CardDescription>
                    Configure your email provider for sending emails from DentaMind
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...providerForm}>
                    <form onSubmit={providerForm.handleSubmit(handleProviderSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={providerForm.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Provider Type</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select provider type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="gmail">Gmail</SelectItem>
                                  <SelectItem value="outlook">Outlook / Office 365</SelectItem>
                                  <SelectItem value="smtp">Custom SMTP</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Select your email service provider
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={providerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <Input placeholder="notifications@dentamind.com" {...field} />
                              </FormControl>
                              <FormDescription>
                                Email address used for sending notifications
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={providerForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Provider Name</FormLabel>
                              <FormControl>
                                <Input placeholder="DentaMind Notifications" {...field} />
                              </FormControl>
                              <FormDescription>
                                Display name for outgoing emails
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={providerForm.control}
                          name="authType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Authentication Type</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select authentication type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="oauth2">OAuth 2.0 (Recommended)</SelectItem>
                                  <SelectItem value="password">Password (Less Secure)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                How to authenticate with the email provider
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={providerForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Main notification email for patient communications"
                                className="resize-none"
                                rows={3}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <label
                              htmlFor="ai-email-processing"
                              className="font-medium text-sm"
                            >
                              AI Email Processing
                            </label>
                            <p className="text-xs text-muted-foreground">
                              Allow AI to read and process incoming emails
                            </p>
                          </div>
                          <Switch
                            id="ai-email-processing"
                            checked={true}
                            onCheckedChange={() => {}}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <label
                              htmlFor="ai-auto-response"
                              className="font-medium text-sm"
                            >
                              AI Auto-Response
                            </label>
                            <p className="text-xs text-muted-foreground">
                              Allow AI to automatically respond to patient inquiries
                            </p>
                          </div>
                          <Switch
                            id="ai-auto-response"
                            checked={true}
                            onCheckedChange={() => {}}
                          />
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <label
                              htmlFor="hipaa-compliance"
                              className="font-medium text-sm"
                            >
                              HIPAA Compliance
                            </label>
                            <p className="text-xs text-muted-foreground">
                              Enable HIPAA-compliant email processing and storage
                            </p>
                          </div>
                          <Switch
                            id="hipaa-compliance"
                            checked={true}
                            onCheckedChange={() => {}}
                          />
                        </div>
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={providerMutation.isPending}
                      >
                        {providerMutation.isPending ? "Saving..." : "Save Configuration"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="templates">
              <Card>
                <CardHeader>
                  <CardTitle>Email Template</CardTitle>
                  <CardDescription>
                    Create or edit email templates for automated communications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...templateForm}>
                    <form onSubmit={templateForm.handleSubmit(handleTemplateSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={templateForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Template Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Appointment Reminder" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={templateForm.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category</FormLabel>
                              <Select 
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  handleTemplateCategory(value);
                                }}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select template category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="appointment">Appointment</SelectItem>
                                  <SelectItem value="lab_update">Lab Update</SelectItem>
                                  <SelectItem value="insurance">Insurance</SelectItem>
                                  <SelectItem value="prescription">Prescription</SelectItem>
                                  <SelectItem value="patient_education">Patient Education</SelectItem>
                                  <SelectItem value="marketing">Marketing</SelectItem>
                                  <SelectItem value="follow_up">Follow-up</SelectItem>
                                  <SelectItem value="billing">Billing</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={templateForm.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Subject</FormLabel>
                            <FormControl>
                              <Input placeholder="Your upcoming appointment with DentaMind" {...field} />
                            </FormControl>
                            <FormDescription>
                              You can use variables like {'{{patientName}}'} in the subject
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={templateForm.control}
                        name="body"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Body</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Dear {{patientName}},\n\nThis is a reminder about your upcoming appointment with Dr. {{doctorName}} on {{appointmentDate}} at {{appointmentTime}}.\n\nPlease arrive 15 minutes early.\n\nBest regards,\nThe DentaMind Team"
                                className="min-h-[200px]"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Use variables within double curly braces to personalize the email
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={templateForm.control}
                        name="variables"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Variables (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="patientName,doctorName,appointmentDate,appointmentTime"
                                value={(field.value || []).join(',')}
                                onChange={(e) => {
                                  const vars = e.target.value.split(',').map(v => v.trim()).filter(Boolean);
                                  field.onChange(vars);
                                }}
                              />
                            </FormControl>
                            <FormDescription>
                              Comma-separated list of variables used in this template
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {templateForm.watch('variables') && templateForm.watch('variables')?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {templateForm.watch('variables')?.map((variable, index) => (
                            <Badge key={index} variant="secondary">
                              {'{{' + variable + '}}'}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={templateMutation.isPending}
                      >
                        {templateMutation.isPending ? "Saving..." : "Save Template"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="test">
              <Card>
                <CardHeader>
                  <CardTitle>Send Test Email</CardTitle>
                  <CardDescription>
                    Test your email configuration by sending a templated email
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...testEmailForm}>
                    <form onSubmit={testEmailForm.handleSubmit(handleTestEmailSubmit)} className="space-y-6">
                      <FormField
                        control={testEmailForm.control}
                        name="to"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Recipient Email</FormLabel>
                            <FormControl>
                              <Input placeholder="patient@example.com" {...field} />
                            </FormControl>
                            <FormDescription>
                              Email address to receive the test message
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={testEmailForm.control}
                        name="templateId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Template</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a template" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {templatesData?.map((template: any) => (
                                  <SelectItem key={template.id} value={template.id}>
                                    {template.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Choose a template to use for the test email
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-3">
                        <h3 className="text-sm font-medium">Template Variables</h3>
                        <p className="text-xs text-muted-foreground">
                          Add values for each variable in the selected template
                        </p>

                        {/* Sample variable fields - in a real app, these would be generated from the selected template */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <FormLabel className="text-xs">patientName</FormLabel>
                            <Input 
                              placeholder="John Doe"
                              value={testEmailForm.watch('data')?.patientName || ''}
                              onChange={(e) => {
                                const data = testEmailForm.getValues('data') || {};
                                testEmailForm.setValue('data', {
                                  ...data,
                                  patientName: e.target.value
                                });
                              }}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <FormLabel className="text-xs">doctorName</FormLabel>
                            <Input 
                              placeholder="Dr. Smith"
                              value={testEmailForm.watch('data')?.doctorName || ''}
                              onChange={(e) => {
                                const data = testEmailForm.getValues('data') || {};
                                testEmailForm.setValue('data', {
                                  ...data,
                                  doctorName: e.target.value
                                });
                              }}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <FormLabel className="text-xs">appointmentDate</FormLabel>
                            <Input 
                              placeholder="May 15, 2025"
                              value={testEmailForm.watch('data')?.appointmentDate || ''}
                              onChange={(e) => {
                                const data = testEmailForm.getValues('data') || {};
                                testEmailForm.setValue('data', {
                                  ...data,
                                  appointmentDate: e.target.value
                                });
                              }}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <FormLabel className="text-xs">appointmentTime</FormLabel>
                            <Input 
                              placeholder="10:00 AM"
                              value={testEmailForm.watch('data')?.appointmentTime || ''}
                              onChange={(e) => {
                                const data = testEmailForm.getValues('data') || {};
                                testEmailForm.setValue('data', {
                                  ...data,
                                  appointmentTime: e.target.value
                                });
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={testEmailMutation.isPending}
                      >
                        {testEmailMutation.isPending ? "Sending..." : "Send Test Email"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}