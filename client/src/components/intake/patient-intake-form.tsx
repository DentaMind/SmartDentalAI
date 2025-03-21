import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { CalendarIcon, ChevronRight, Save } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Define form schema
const patientIntakeFormSchema = z.object({
  // Personal Information
  firstName: z.string().min(2, { message: "First name is required" }),
  lastName: z.string().min(2, { message: "Last name is required" }),
  dateOfBirth: z.date({ required_error: "Date of birth is required" }),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"], {
    required_error: "Please select a gender",
  }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().min(10, { message: "Please enter a valid phone number" }),
  address: z.string().min(5, { message: "Address is required" }),
  city: z.string().min(2, { message: "City is required" }),
  state: z.string().min(2, { message: "State is required" }),
  zipCode: z.string().min(5, { message: "Zip code is required" }),

  // Insurance Information
  insuranceProvider: z.string().optional(),
  insuranceId: z.string().optional(),
  policyHolder: z.string().optional(),
  policyHolderRelationship: z.enum(["self", "spouse", "parent", "other"]).optional(),
  
  // Medical History
  medicalHistory: z.object({
    allergies: z.array(z.string()).optional(),
    currentMedications: z.array(z.string()).optional(),
    systemicConditions: z.array(z.string()).optional(),
    otherConditions: z.string().optional(),
    pregnant: z.boolean().optional(),
    smoking: z.boolean().optional(),
    smokingFrequency: z.enum(["never", "former", "occasional", "regular"]).optional(),
  }),
  
  // Dental History
  dentalHistory: z.object({
    lastDentalVisit: z.date().optional(),
    reasonForVisit: z.string().min(2, { message: "Please provide the reason for your visit" }),
    previousDentist: z.string().optional(),
    concernedAbout: z.array(z.string()).optional(),
    otherConcerns: z.string().optional(),
    brushingFrequency: z.enum(["once_daily", "twice_daily", "after_meals", "other"]),
    flossingFrequency: z.enum(["daily", "few_times_week", "occasionally", "rarely"]),
  }),
  
  // Consent and Agreements
  hipaaConsent: z.boolean().refine(val => val === true, {
    message: "You must agree to the HIPAA notice",
  }),
  financialAgreement: z.boolean().refine(val => val === true, {
    message: "You must agree to the financial policy",
  }),
  
  // Form token for validation
  formToken: z.string(),
});

type PatientIntakeFormValues = z.infer<typeof patientIntakeFormSchema>;

// Options for checkboxes
const systemicConditions = [
  { id: "diabetes", label: "Diabetes" },
  { id: "hypertension", label: "Hypertension (High Blood Pressure)" },
  { id: "heart_disease", label: "Heart Disease" },
  { id: "asthma", label: "Asthma" },
  { id: "thyroid_disorder", label: "Thyroid Disorder" },
  { id: "liver_disease", label: "Liver Disease" },
  { id: "kidney_disease", label: "Kidney Disease" },
  { id: "cancer", label: "Cancer" },
  { id: "epilepsy", label: "Epilepsy/Seizures" },
  { id: "arthritis", label: "Arthritis" },
  { id: "mental_health", label: "Mental Health Condition" },
  { id: "bleeding_disorder", label: "Bleeding Disorder" },
];

const dentalConcerns = [
  { id: "pain", label: "Tooth Pain" },
  { id: "sensitivity", label: "Sensitivity" },
  { id: "gums", label: "Gum Issues" },
  { id: "appearance", label: "Appearance of Teeth" },
  { id: "missing_teeth", label: "Missing Teeth" },
  { id: "crooked_teeth", label: "Crooked Teeth" },
  { id: "jaw_pain", label: "Jaw Pain/TMJ" },
  { id: "grinding", label: "Grinding/Clenching" },
  { id: "bad_breath", label: "Bad Breath" },
  { id: "cleaning", label: "Regular Cleaning" },
  { id: "checkup", label: "Regular Checkup" },
];

// Component for patient intake form
export function PatientIntakeForm({ formToken }: { formToken: string }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form steps
  const steps = [
    { id: 'personal', title: 'Personal Information' },
    { id: 'insurance', title: 'Insurance Information' },
    { id: 'medical', title: 'Medical History' },
    { id: 'dental', title: 'Dental History' },
    { id: 'consent', title: 'Consent & Agreements' },
  ];
  
  // Define form with default values
  const form = useForm<PatientIntakeFormValues>({
    resolver: zodResolver(patientIntakeFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      gender: 'prefer_not_to_say',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      insuranceProvider: '',
      insuranceId: '',
      policyHolder: '',
      policyHolderRelationship: 'self',
      medicalHistory: {
        allergies: [],
        currentMedications: [],
        systemicConditions: [],
        otherConditions: '',
        pregnant: false,
        smoking: false,
        smokingFrequency: 'never',
      },
      dentalHistory: {
        reasonForVisit: '',
        concernedAbout: [],
        otherConcerns: '',
        brushingFrequency: 'twice_daily',
        flossingFrequency: 'daily',
      },
      hipaaConsent: false,
      financialAgreement: false,
      formToken: formToken,
    },
  });
  
  // Mutation to submit the form
  const submitFormMutation = useMutation({
    mutationFn: (data: PatientIntakeFormValues) => {
      // Format dates before sending
      const formattedData = {
        ...data,
        dateOfBirth: format(data.dateOfBirth, 'yyyy-MM-dd'),
        dentalHistory: {
          ...data.dentalHistory,
          lastDentalVisit: data.dentalHistory.lastDentalVisit 
            ? format(data.dentalHistory.lastDentalVisit, 'yyyy-MM-dd') 
            : undefined,
        }
      };
      return apiRequest('/api/patient-forms/submit', {
        method: 'POST',
        body: JSON.stringify({ 
          formToken, 
          formData: formattedData 
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "Form submitted successfully",
        description: "Thank you! Your information has been submitted.",
      });
      setIsSubmitting(false);
      // Redirect to a thank you page
      setLocation('/form-submitted');
    },
    onError: (error) => {
      console.error("Error submitting form:", error);
      toast({
        title: "Error submitting form",
        description: "There was a problem submitting your information. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  // Submit handler
  function onSubmit(data: PatientIntakeFormValues) {
    setIsSubmitting(true);
    submitFormMutation.mutate(data);
  }
  
  // Next step
  const nextStep = () => {
    const fields = [
      // Step 1: Personal Information
      ['firstName', 'lastName', 'dateOfBirth', 'gender', 'email', 'phone', 'address', 'city', 'state', 'zipCode'],
      // Step 2: Insurance Information 
      [], // Insurance is optional
      // Step 3: Medical History
      [], // Medical history has complex validation, handled separately
      // Step 4: Dental History
      ['dentalHistory.reasonForVisit', 'dentalHistory.brushingFrequency', 'dentalHistory.flossingFrequency'],
      // Step 5: Consent
      ['hipaaConsent', 'financialAgreement']
    ];
    
    // Get fields for current step
    const currentFields = fields[currentStep];
    
    // Validate only the fields in the current step
    if (currentFields.length > 0) {
      const stepIsValid = currentFields.every(field => {
        const fieldState = form.getFieldState(field as any);
        form.trigger(field as any);
        return !fieldState.invalid;
      });
      
      if (!stepIsValid) {
        return; // Don't advance if the current step is invalid
      }
    }
    
    // Special case for step 4 (dental history)
    if (currentStep === 3) {
      if (!form.getValues('dentalHistory.reasonForVisit')) {
        form.setError('dentalHistory.reasonForVisit', {
          type: 'manual',
          message: 'Reason for visit is required'
        });
        return;
      }
    }
    
    // Special case for step 5 (consent)
    if (currentStep === 4) {
      if (!form.getValues('hipaaConsent') || !form.getValues('financialAgreement')) {
        if (!form.getValues('hipaaConsent')) {
          form.setError('hipaaConsent', {
            type: 'manual',
            message: 'You must agree to the HIPAA notice'
          });
        }
        if (!form.getValues('financialAgreement')) {
          form.setError('financialAgreement', {
            type: 'manual',
            message: 'You must agree to the financial policy'
          });
        }
        return;
      }
      
      // If we're on the last step and everything is valid, submit the form
      form.handleSubmit(onSubmit)();
      return;
    }
    
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  };
  
  // Previous step
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };
  
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="border-b">
        <CardTitle className="text-2xl">Patient Intake Form</CardTitle>
        <CardDescription>
          Please complete this form to help us provide you with the best dental care.
        </CardDescription>
      </CardHeader>
      
      {/* Progress Indicator */}
      <div className="p-4 bg-muted/20">
        <div className="flex justify-between">
          {steps.map((step, idx) => (
            <div 
              key={step.id} 
              className={cn(
                "flex flex-col items-center",
                currentStep >= idx ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div 
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center mb-1 transition-colors",
                  currentStep > idx ? "bg-primary text-primary-foreground" : 
                  currentStep === idx ? "border-2 border-primary text-primary" : 
                  "border border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {idx + 1}
              </div>
              <span className="text-xs hidden md:block">{step.title}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 h-1 bg-muted-foreground/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all" 
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          ></div>
        </div>
      </div>
      
      <CardContent className="pt-6">
        <Form {...form}>
          <form className="space-y-6">
            {/* Step 1: Personal Information */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
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
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date of Birth</FormLabel>
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
                              disabled={(date) => date > new Date()}
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
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                            <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input placeholder="email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
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
                </div>
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="City" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input placeholder="State" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zip Code</FormLabel>
                        <FormControl>
                          <Input placeholder="12345" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}
            
            {/* Step 2: Insurance Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Insurance Information</h3>
                <p className="text-muted-foreground text-sm">This section is optional. If you have dental insurance, please provide your insurance details.</p>
                
                <FormField
                  control={form.control}
                  name="insuranceProvider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Insurance Provider</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Delta Dental, Cigna" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="insuranceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Insurance ID/Policy Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Policy number on your insurance card" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="policyHolder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Policy Holder Name (if not self)</FormLabel>
                        <FormControl>
                          <Input placeholder="Full name of policy holder" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="policyHolderRelationship"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relationship to Policy Holder</FormLabel>
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
                            <SelectItem value="self">Self</SelectItem>
                            <SelectItem value="spouse">Spouse</SelectItem>
                            <SelectItem value="parent">Parent</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}
            
            {/* Step 3: Medical History */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Medical History</h3>
                <p className="text-muted-foreground text-sm">Please provide information about your health. This helps us provide safe and appropriate dental care.</p>
                
                <div>
                  <h4 className="text-base font-medium mb-2">Do you have any of the following conditions?</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {systemicConditions.map((condition) => (
                      <FormField
                        key={condition.id}
                        control={form.control}
                        name="medicalHistory.systemicConditions"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={condition.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(condition.id)}
                                  onCheckedChange={(checked) => {
                                    const currentValue = field.value || [];
                                    return checked
                                      ? field.onChange([...currentValue, condition.id])
                                      : field.onChange(
                                          currentValue.filter((value) => value !== condition.id)
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {condition.label}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                </div>
                
                <FormField
                  control={form.control}
                  name="medicalHistory.otherConditions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Other Medical Conditions</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Please list any other medical conditions not mentioned above"
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="medicalHistory.currentMedications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Medications</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Please list all medications you are currently taking"
                          className="min-h-[80px]"
                          value={field.value?.join('\n') || ''}
                          onChange={(e) => field.onChange(
                            e.target.value.split('\n').filter(line => line.trim() !== '')
                          )}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter each medication on a new line
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="medicalHistory.allergies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allergies</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Please list any allergies (medications, latex, etc.)"
                          className="min-h-[80px]"
                          value={field.value?.join('\n') || ''}
                          onChange={(e) => field.onChange(
                            e.target.value.split('\n').filter(line => line.trim() !== '')
                          )}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter each allergy on a new line
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="medicalHistory.smoking"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Do you use tobacco products?</FormLabel>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                          <span>Yes, I use tobacco products</span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {form.watch("medicalHistory.smoking") && (
                  <FormField
                    control={form.control}
                    name="medicalHistory.smokingFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tobacco Usage</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="occasional">Occasional</SelectItem>
                            <SelectItem value="regular">Regular</SelectItem>
                            <SelectItem value="former">Former user</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {form.watch("gender") === "female" && (
                  <FormField
                    control={form.control}
                    name="medicalHistory.pregnant"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Are you pregnant or nursing?</FormLabel>
                        <FormControl>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                            <span>Yes, I am pregnant or nursing</span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}
            
            {/* Step 4: Dental History */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Dental History</h3>
                
                <FormField
                  control={form.control}
                  name="dentalHistory.lastDentalVisit"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date of Last Dental Visit (approximate)</FormLabel>
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
                                <span>Select date (approximate)</span>
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
                            disabled={(date) => date > new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        If you don't remember exactly, please select an approximate date
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dentalHistory.reasonForVisit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason for Today's Visit</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Cleaning, Check-up, Tooth pain"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div>
                  <FormLabel className="text-base font-medium mb-2">Dental Concerns</FormLabel>
                  <FormDescription className="mb-2">
                    Please select any dental issues you're concerned about
                  </FormDescription>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {dentalConcerns.map((concern) => (
                      <FormField
                        key={concern.id}
                        control={form.control}
                        name="dentalHistory.concernedAbout"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={concern.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(concern.id)}
                                  onCheckedChange={(checked) => {
                                    const currentValue = field.value || [];
                                    return checked
                                      ? field.onChange([...currentValue, concern.id])
                                      : field.onChange(
                                          currentValue.filter((value) => value !== concern.id)
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {concern.label}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                </div>
                
                <FormField
                  control={form.control}
                  name="dentalHistory.otherConcerns"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Other Dental Concerns</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Please describe any other dental concerns not listed above"
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dentalHistory.brushingFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>How often do you brush your teeth?</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="once_daily">Once daily</SelectItem>
                            <SelectItem value="twice_daily">Twice daily</SelectItem>
                            <SelectItem value="after_meals">After meals</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="dentalHistory.flossingFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>How often do you floss?</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="few_times_week">Few times a week</SelectItem>
                            <SelectItem value="occasionally">Occasionally</SelectItem>
                            <SelectItem value="rarely">Rarely or never</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}
            
            {/* Step 5: Consent & Agreements */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Consent & Agreements</h3>
                
                <div className="border rounded-md p-4 bg-muted/20">
                  <h4 className="font-medium mb-2">HIPAA Privacy Practices Notice</h4>
                  <p className="text-sm mb-4">
                    I acknowledge that I have received a copy of the HIPAA Notice of Privacy Practices. 
                    I understand that the dental practice may use and disclose my protected health 
                    information for purposes of treatment, payment, and healthcare operations. I have the 
                    right to review the Notice before signing this consent. I understand that I can 
                    revoke this consent in writing, but doing so will not affect any actions taken in 
                    reliance on this consent before my revocation.
                  </p>
                  
                  <FormField
                    control={form.control}
                    name="hipaaConsent"
                    render={({ field }) => (
                      <FormItem className="space-y-0 flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-medium">
                          I acknowledge that I have read and understand the HIPAA Privacy Practices Notice
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormMessage className="mt-1">
                    {form.formState.errors.hipaaConsent?.message}
                  </FormMessage>
                </div>
                
                <div className="border rounded-md p-4 bg-muted/20">
                  <h4 className="font-medium mb-2">Financial Policy Acknowledgment</h4>
                  <p className="text-sm mb-4">
                    I understand that I am financially responsible for all charges, whether or not paid 
                    by insurance. I authorize the use of my signature for all insurance submissions. 
                    I understand that payment is due at the time of service unless prior arrangements 
                    have been made. I agree to be responsible for payment of all services rendered on 
                    my behalf or my dependents.
                  </p>
                  
                  <FormField
                    control={form.control}
                    name="financialAgreement"
                    render={({ field }) => (
                      <FormItem className="space-y-0 flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-medium">
                          I acknowledge that I have read and understand the Financial Policy
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormMessage className="mt-1">
                    {form.formState.errors.financialAgreement?.message}
                  </FormMessage>
                </div>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t p-4">
        <Button
          type="button"
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 0 || isSubmitting}
        >
          Previous
        </Button>
        
        <Button
          type="button"
          onClick={nextStep}
          disabled={isSubmitting}
        >
          {currentStep === steps.length - 1 ? (
            isSubmitting ? (
              <div className="flex items-center">
                <span className="mr-2">Submitting...</span>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              </div>
            ) : (
              <div className="flex items-center">
                <span className="mr-2">Submit Form</span>
                <Save className="h-4 w-4" />
              </div>
            )
          ) : (
            <div className="flex items-center">
              <span className="mr-2">Next</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}