import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, MailIcon, Send } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// Define form schema
const sendPatientFormSchema = z.object({
  patientId: z.number().optional(),
  patientEmail: z.string().email({ message: "Please enter a valid email address" }),
  patientName: z.string().min(2, { message: "Patient name is required" }),
  formType: z.enum(['intake', 'medical-history', 'consent', 'hipaa', 'financial'], {
    required_error: "Please select a form type",
  }),
  customMessage: z.string().optional(),
  appointmentDate: z.date().optional(),
  sendCopy: z.boolean().default(false),
  practiceEmail: z.string().email().optional(),
});

type SendPatientFormValues = z.infer<typeof sendPatientFormSchema>;

// Component for sending patient intake forms
export function SendPatientIntakeForm({ patientId, patientEmail, patientName }: { 
  patientId?: number;
  patientEmail?: string;
  patientName?: string;
}) {
  const { toast } = useToast();
  
  // Define form with default values
  const form = useForm<SendPatientFormValues>({
    resolver: zodResolver(sendPatientFormSchema),
    defaultValues: {
      patientId: patientId,
      patientEmail: patientEmail || "",
      patientName: patientName || "",
      formType: 'intake',
      customMessage: '',
      sendCopy: true,
      practiceEmail: 'dentamind27@gmail.com',
    },
  });

  // Mutation to send the form
  const sendFormMutation = useMutation({
    mutationFn: (data: SendPatientFormValues) => {
      const formattedData = {
        ...data,
        appointmentDate: data.appointmentDate ? format(data.appointmentDate, 'PPP') : undefined,
      };
      return apiRequest('/api/patient-forms/send', {
        method: 'POST',
        body: JSON.stringify(formattedData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Form sent successfully",
        description: "The patient will receive an email with a link to complete the form.",
      });
      form.reset();
    },
    onError: (error) => {
      console.error("Error sending form:", error);
      toast({
        title: "Error sending form",
        description: "There was a problem sending the form. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Submit handler
  function onSubmit(data: SendPatientFormValues) {
    sendFormMutation.mutate(data);
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Send Patient Form</CardTitle>
        <CardDescription>
          Email a secure form to your patient to complete online.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="patientEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient Email</FormLabel>
                  <FormControl>
                    <Input placeholder="patient@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="patientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="formType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Form Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a form type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="intake">Patient Intake Form</SelectItem>
                      <SelectItem value="medical-history">Medical History Form</SelectItem>
                      <SelectItem value="consent">Treatment Consent Form</SelectItem>
                      <SelectItem value="hipaa">HIPAA Consent Form</SelectItem>
                      <SelectItem value="financial">Financial Agreement Form</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="appointmentDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Appointment Date (Optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
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
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="customMessage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Message (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add a personal message to the patient..."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="sendCopy"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Send Copy to Practice</FormLabel>
                    <FormDescription>
                      Receive a copy of this form at {form.watch('practiceEmail')}
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
            
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={sendFormMutation.isPending}
              >
                {sendFormMutation.isPending ? (
                  <div className="flex items-center">
                    <span className="mr-2">Sending...</span>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span className="mr-2">Send Form</span>
                    <Send className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="bg-muted/50 text-sm text-muted-foreground">
        <div className="flex items-center">
          <MailIcon className="h-4 w-4 mr-2" />
          <p>The patient will receive an email with a secure link to complete this form.</p>
        </div>
      </CardFooter>
    </Card>
  );
}