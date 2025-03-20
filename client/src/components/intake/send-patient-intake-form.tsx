import React, { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Mail, MessageSquare, Send } from "lucide-react";

// Define form schema
const sendFormSchema = z.object({
  contactMethod: z.enum(["email", "sms", "both"], {
    required_error: "Please select a contact method",
  }),
  emailAddress: z.string().email("Invalid email address").optional()
    .refine(email => email !== undefined && email !== "", {
      message: "Email is required when email contact is selected",
      path: ["emailAddress"],
    }),
  phoneNumber: z.string().optional()
    .refine(phone => phone !== undefined && phone !== "", {
      message: "Phone number is required when SMS contact is selected",
      path: ["phoneNumber"],
    }),
  hipaaConsent: z.boolean().refine(value => value === true, {
    message: "HIPAA consent is required",
  }),
  message: z.string().optional(),
});

type SendFormValues = z.infer<typeof sendFormSchema>;

interface SendPatientIntakeFormProps {
  patientId?: number;
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
  buttonVariant?: "default" | "outline" | "secondary" | "ghost" | "link";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  onSuccess?: () => void;
}

export function SendPatientIntakeForm({
  patientId,
  patientName = "Patient",
  patientEmail = "",
  patientPhone = "",
  buttonVariant = "default",
  buttonSize = "default",
  onSuccess
}: SendPatientIntakeFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Set up form with default values
  const form = useForm<SendFormValues>({
    resolver: zodResolver(sendFormSchema),
    defaultValues: {
      contactMethod: "email",
      emailAddress: patientEmail,
      phoneNumber: patientPhone,
      hipaaConsent: false,
      message: "",
    },
  });

  // Watch contact method to validate appropriate fields
  const contactMethod = form.watch("contactMethod");

  // Handle form submission
  const onSubmit = async (data: SendFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Call API to send patient intake form
      await apiRequest({
        method: "POST",
        url: "/api/patient-forms/send",
        body: {
          patientId,
          contactMethod: data.contactMethod,
          emailAddress: data.contactMethod === "email" || data.contactMethod === "both" ? data.emailAddress : undefined,
          phoneNumber: data.contactMethod === "sms" || data.contactMethod === "both" ? data.phoneNumber : undefined,
          message: data.message,
        },
      });
      
      // Show success toast
      toast({
        title: "Intake form sent successfully",
        description: `The patient intake form has been sent to ${patientName}.`,
      });
      
      // Close dialog
      setOpen(false);
      
      // Call success callback if provided
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error sending patient intake form:", error);
      
      toast({
        title: "Error sending intake form",
        description: "There was an error sending the patient intake form. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={buttonVariant} size={buttonSize} className="gap-2">
          <Send className="h-4 w-4" />
          Send Intake Form
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Patient Intake Form</DialogTitle>
          <DialogDescription>
            Send a comprehensive intake form to {patientName} via email or SMS.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="contactMethod"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Contact Method</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="email" id="option-email" />
                        <Label htmlFor="option-email" className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />Email
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sms" id="option-sms" />
                        <Label htmlFor="option-sms" className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />SMS
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="both" id="option-both" />
                        <Label htmlFor="option-both">Both</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {(contactMethod === "email" || contactMethod === "both") && (
              <FormField
                control={form.control}
                name="emailAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="patient@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {(contactMethod === "sms" || contactMethod === "both") && (
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="(555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Message (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Add a personalized message to the patient"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This message will be included in the email or SMS.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="hipaaConsent"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      HIPAA Compliance Consent
                    </FormLabel>
                    <FormDescription>
                      I confirm that sending this form complies with HIPAA regulations and patient has provided consent for electronic communication.
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Form
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}