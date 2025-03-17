import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle,
  AlertCircle,
  User,
  Phone,
  MailIcon,
  Calendar,
  Home,
  Heart,
  ShieldAlert,
  FileText,
  Stethoscope
} from 'lucide-react';

const patientIntakeSchema = z.object({
  // Personal Information
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Please enter a valid email"),
  phoneNumber: z.string().min(10, "Please enter a valid phone number"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  homeAddress: z.string().min(5, "Home address is required"),
  
  // Emergency Contact
  emergencyContactName: z.string().min(2, "Emergency contact name is required"),
  emergencyContactPhone: z.string().min(10, "Please enter a valid phone number"),
  emergencyContactRelationship: z.string().min(1, "Relationship is required"),
  
  // Insurance Information
  insuranceProvider: z.string().optional(),
  insuranceNumber: z.string().optional(),
  
  // Medical History
  allergies: z.string().optional(),
  currentMedications: z.string().optional(),
  medicalConditions: z.object({
    hypertension: z.boolean().optional(),
    diabetes: z.boolean().optional(),
    heartDisease: z.boolean().optional(),
    asthma: z.boolean().optional(),
    arthritis: z.boolean().optional(),
    other: z.string().optional(),
  }).optional(),
  smokesTobacco: z.boolean().optional(),
  adverseAnestheticReaction: z.boolean().optional(),
  pastSurgeries: z.string().optional(),
  
  // Dental History
  lastDentalVisit: z.string().optional(),
  chiefComplaint: z.string().min(1, "Please describe your main dental concern"),
  currentSymptoms: z.string().optional(),
  previousDentalProcedures: z.string().optional(),
  
  // Agreements
  hipaaConsent: z.boolean().refine(val => val === true, {
    message: "You must consent to the HIPAA privacy practices"
  }),
  treatmentConsent: z.boolean().refine(val => val === true, {
    message: "You must consent to treatment"
  }),
  officePolicy: z.boolean().refine(val => val === true, {
    message: "You must acknowledge our office policies"
  }),
  
  // Account creation
  username: z.string().min(5, "Username must be at least 5 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Please confirm your password"),
  practiceName: z.string().optional(), // To track which dental office sent the form
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type PatientIntakeFormData = z.infer<typeof patientIntakeSchema>;

interface PatientIntakeFormProps {
  practiceName?: string;
  onSubmit?: (data: PatientIntakeFormData) => void;
  defaultValues?: Partial<PatientIntakeFormData>;
}

export function PatientIntakeForm({
  practiceName = "Smart Dental AI Care",
  onSubmit,
  defaultValues
}: PatientIntakeFormProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const form = useForm<PatientIntakeFormData>({
    resolver: zodResolver(patientIntakeSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      dateOfBirth: '',
      homeAddress: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelationship: '',
      insuranceProvider: '',
      insuranceNumber: '',
      allergies: '',
      currentMedications: '',
      medicalConditions: {
        hypertension: false,
        diabetes: false,
        heartDisease: false,
        asthma: false,
        arthritis: false,
        other: '',
      },
      smokesTobacco: false,
      adverseAnestheticReaction: false,
      pastSurgeries: '',
      lastDentalVisit: '',
      chiefComplaint: '',
      currentSymptoms: '',
      previousDentalProcedures: '',
      hipaaConsent: false,
      treatmentConsent: false,
      officePolicy: false,
      username: '',
      password: '',
      confirmPassword: '',
      practiceName: practiceName,
      ...defaultValues
    }
  });
  
  const handleFormSubmit = async (data: PatientIntakeFormData) => {
    setSubmitting(true);
    
    try {
      // In a real application, you would submit this data to your API
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate API call
      
      if (onSubmit) {
        onSubmit(data);
      }
      
      setSubmitted(true);
      toast({
        title: "Form Submitted Successfully",
        description: "Your intake form has been received. An account has been created for you.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error Submitting Form",
        description: "There was a problem submitting your form. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  if (submitted) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex justify-center items-center gap-2">
            <CheckCircle className="text-green-500 h-6 w-6" />
            Form Submitted Successfully
          </CardTitle>
          <CardDescription>
            Thank you for completing your patient intake form
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle>Account Created</AlertTitle>
            <AlertDescription>
              Your patient portal account has been created. You can now log in with the username you provided.
            </AlertDescription>
          </Alert>
          
          <p className="text-center text-muted-foreground">
            Your information has been securely transmitted to {practiceName}. 
            A team member will contact you shortly to confirm your first appointment.
          </p>
          
          <div className="border rounded-md p-4 bg-muted/50">
            <h3 className="font-medium mb-2">Next Steps:</h3>
            <ol className="space-y-2 text-sm list-decimal pl-5">
              <li>Check your email for login credentials and confirmation</li>
              <li>Log in to the patient portal to view your information</li>
              <li>Prepare any additional documentation requested by the dental office</li>
              <li>Arrive 15 minutes early for your first appointment</li>
            </ol>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="outline" className="w-full sm:w-auto">
            Go to Patient Portal
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">{practiceName} Patient Intake Form</CardTitle>
        <CardDescription className="text-center">
          Please complete this form to create your account and provide your medical history
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
              {/* Personal Information Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Personal Information</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email*</FormLabel>
                        <FormControl>
                          <Input placeholder="johndoe@example.com" {...field} type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number*</FormLabel>
                        <FormControl>
                          <Input placeholder="(123) 456-7890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth*</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="homeAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Home Address*</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St, City, State, ZIP" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <Separator />
              
              {/* Emergency Contact */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Emergency Contact</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="emergencyContactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emergency Contact Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="Jane Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="emergencyContactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emergency Contact Phone*</FormLabel>
                        <FormControl>
                          <Input placeholder="(123) 456-7890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="emergencyContactRelationship"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relationship to Patient*</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select relationship" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="spouse">Spouse</SelectItem>
                            <SelectItem value="parent">Parent</SelectItem>
                            <SelectItem value="child">Child</SelectItem>
                            <SelectItem value="sibling">Sibling</SelectItem>
                            <SelectItem value="friend">Friend</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <Separator />
              
              {/* Insurance Information */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Insurance Information</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="insuranceProvider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Insurance Provider</FormLabel>
                        <FormControl>
                          <Input placeholder="Insurance Company Name" {...field} />
                        </FormControl>
                        <FormDescription>
                          Leave blank if you don't have dental insurance
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="insuranceNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Insurance Policy/Member Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Policy number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <Separator />
              
              {/* Medical History */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Medical History</h2>
                </div>
                
                <FormField
                  control={form.control}
                  name="allergies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allergies (medications, latex, etc.)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="List any allergies you have..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="currentMedications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Medications</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="List any medications you're currently taking..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-4">
                  <FormLabel>Do you have any of the following medical conditions?</FormLabel>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="medicalConditions.hypertension"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox 
                              checked={field.value} 
                              onCheckedChange={field.onChange} 
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">Hypertension (High Blood Pressure)</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="medicalConditions.diabetes"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox 
                              checked={field.value} 
                              onCheckedChange={field.onChange} 
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">Diabetes</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="medicalConditions.heartDisease"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox 
                              checked={field.value} 
                              onCheckedChange={field.onChange} 
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">Heart Disease</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="medicalConditions.asthma"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox 
                              checked={field.value} 
                              onCheckedChange={field.onChange} 
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">Asthma</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="medicalConditions.arthritis"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox 
                              checked={field.value} 
                              onCheckedChange={field.onChange} 
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">Arthritis</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="medicalConditions.other"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Other Medical Conditions</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Please specify any other medical conditions..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="smokesTobacco"
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-2">
                        <FormControl>
                          <Checkbox 
                            checked={field.value} 
                            onCheckedChange={field.onChange} 
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Do you smoke or use tobacco products?</FormLabel>
                          <FormDescription>
                            Including cigarettes, cigars, e-cigarettes, or vaping
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="adverseAnestheticReaction"
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-2">
                        <FormControl>
                          <Checkbox 
                            checked={field.value} 
                            onCheckedChange={field.onChange} 
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Have you ever had an adverse reaction to anesthetics?</FormLabel>
                          <FormDescription>
                            Including local anesthesia at the dentist
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="pastSurgeries"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Past Surgeries</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="List any surgeries you've had, including dates if known..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Separator />
              
              {/* Dental History */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Dental History</h2>
                </div>
                
                <FormField
                  control={form.control}
                  name="lastDentalVisit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>When was your last dental visit?</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="chiefComplaint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What is your main dental concern?*</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Please describe your main reason for seeking dental care..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="currentSymptoms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Symptoms</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe any current symptoms (pain, sensitivity, bleeding gums, etc.)..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="previousDentalProcedures"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Previous Dental Procedures</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="List any previous dental procedures (fillings, root canals, crowns, etc.)..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Separator />
              
              {/* Account Creation */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Create Account</h2>
                </div>
                <p className="text-muted-foreground text-sm">
                  Creating an account allows you to access your dental records, appointment information, 
                  and communicate with {practiceName}.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username*</FormLabel>
                        <FormControl>
                          <Input placeholder="Choose a username" {...field} />
                        </FormControl>
                        <FormDescription>
                          You'll use this to log in to your patient portal
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password*</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Create a password" {...field} />
                        </FormControl>
                        <FormDescription>
                          Must be at least 8 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password*</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Confirm your password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <Separator />
              
              {/* Agreements */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Agreements</h2>
                </div>
                
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertTitle>Important</AlertTitle>
                  <AlertDescription>
                    Please review and accept the following agreements to complete your registration
                  </AlertDescription>
                </Alert>
                
                <FormField
                  control={form.control}
                  name="hipaaConsent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 border p-4 rounded">
                      <FormControl>
                        <Checkbox 
                          checked={field.value} 
                          onCheckedChange={field.onChange} 
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>HIPAA Privacy Practices*</FormLabel>
                        <FormDescription>
                          I acknowledge that I have received, read, and understand the Notice of Privacy Practices 
                          as required by the Health Insurance Portability and Accountability Act (HIPAA).
                        </FormDescription>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="treatmentConsent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 border p-4 rounded">
                      <FormControl>
                        <Checkbox 
                          checked={field.value} 
                          onCheckedChange={field.onChange} 
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Treatment Consent*</FormLabel>
                        <FormDescription>
                          I authorize the dentist and any other qualified auxiliaries or medical professionals to perform 
                          diagnostic procedures and treatment as may be necessary for proper dental care.
                        </FormDescription>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="officePolicy"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 border p-4 rounded">
                      <FormControl>
                        <Checkbox 
                          checked={field.value} 
                          onCheckedChange={field.onChange} 
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Office Policies*</FormLabel>
                        <FormDescription>
                          I acknowledge that I have read and understand the office policies regarding appointments, 
                          cancellations, financial responsibilities, and insurance.
                        </FormDescription>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex flex-col gap-4">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </>
                  ) : "Submit Intake Form"}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  By submitting this form, you are creating a patient account with {practiceName}. 
                  Your information will be protected in accordance with our privacy policy.
                </p>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}