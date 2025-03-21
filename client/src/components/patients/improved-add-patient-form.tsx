import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format } from "date-fns";
import { CalendarIcon, ChevronRight, Save } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AddPatientFormProps {
  onSuccess?: () => void;
}

const formSchema = z.object({
  // Personal Information
  firstName: z.string().min(2, { message: "First name must be at least 2 characters" }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phoneNumber: z.string().min(10, { message: "Please enter a valid phone number" }),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Please use YYYY-MM-DD format" }),
  homeAddress: z.string().optional(),
  occupation: z.string().optional(),
  socialSecurityNumber: z.string().optional(),
  gender: z.string().optional(),
  height: z.string().optional(),
  weight: z.string().optional(),
  bloodType: z.string().optional(),
  maritalStatus: z.string().optional(),
  
  // Emergency Contact
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
  
  // Insurance Information
  insuranceProvider: z.string().optional(),
  insuranceNumber: z.string().optional(),
  insuranceGroupNumber: z.string().optional(),
  insurancePrimaryHolder: z.string().optional(),
  insuranceHolderRelation: z.string().optional(),
  
  // Medical History
  underPhysicianCare: z.boolean().optional().default(false),
  physicianConditions: z.string().optional(),
  physicianName: z.string().optional(),
  physicianPhone: z.string().optional(),
  allergies: z.string().optional(),
  pastSurgeries: z.string().optional(),
  currentMedications: z.string().optional(),
  adverseAnestheticReaction: z.boolean().optional().default(false),
  hospitalizedRecently: z.boolean().optional().default(false),
  reasonForHospitalization: z.string().optional(),
  
  // Medical Conditions
  hypertension: z.boolean().optional().default(false),
  diabetes: z.boolean().optional().default(false),
  heartDisease: z.boolean().optional().default(false),
  heartAttack: z.boolean().optional().default(false),
  heartMurmur: z.boolean().optional().default(false),
  pacemaker: z.boolean().optional().default(false),
  artificialHeart: z.boolean().optional().default(false),
  rheumaticFever: z.boolean().optional().default(false),
  asthma: z.boolean().optional().default(false),
  arthritis: z.boolean().optional().default(false),
  cancer: z.boolean().optional().default(false),
  stroke: z.boolean().optional().default(false),
  kidneyDisease: z.boolean().optional().default(false),
  liverDisease: z.boolean().optional().default(false),
  thyroidDisease: z.boolean().optional().default(false),
  mentalIllness: z.boolean().optional().default(false),
  seizures: z.boolean().optional().default(false),
  epilepsy: z.boolean().optional().default(false),
  bleedingDisorders: z.boolean().optional().default(false),
  autoimmune: z.boolean().optional().default(false),
  hepatitis: z.boolean().optional().default(false),
  hivAids: z.boolean().optional().default(false),
  lungDisease: z.boolean().optional().default(false),
  osteoporosis: z.boolean().optional().default(false),
  dizziness: z.boolean().optional().default(false),
  fainting: z.boolean().optional().default(false),
  headaches: z.boolean().optional().default(false),
  radiation: z.boolean().optional().default(false),
  chemotherapy: z.boolean().optional().default(false),
  chronicPain: z.boolean().optional().default(false),
  
  // Lifestyle
  smokesTobacco: z.boolean().optional().default(false),
  useAlcohol: z.boolean().optional().default(false),
  isPregnantOrNursing: z.boolean().optional().default(false),
  recreationalDrugs: z.boolean().optional().default(false),
  
  // Dental History
  lastDentalVisit: z.string().optional(),
  reasonForVisitToday: z.string().optional(),
  lastDentalExam: z.string().optional(),
  lastDentalXrays: z.string().optional(),
  whenIssueStarted: z.string().optional(),
  experiencedBefore: z.boolean().optional().default(false),
  chiefComplaint: z.string().optional(),
  currentSymptoms: z.string().optional(),
  previousDentalProcedures: z.string().optional(),
  scaleOfPain: z.coerce.number().optional(),
  
  // Dental Conditions
  hadGumDisease: z.boolean().optional().default(false),
  hadExtractions: z.boolean().optional().default(false),
  hadDentalImplants: z.boolean().optional().default(false),
  hadOrthodonticTreatment: z.boolean().optional().default(false),
  hadRootCanal: z.boolean().optional().default(false),
  hadJawPain: z.boolean().optional().default(false),
  sensitivityToHotCold: z.boolean().optional().default(false),
  troubleWithPreviousDental: z.boolean().optional().default(false),
  grindTeeth: z.boolean().optional().default(false),
  wearDentalAppliance: z.boolean().optional().default(false),
  bleedingGums: z.boolean().optional().default(false),
  looseTeeth: z.boolean().optional().default(false),
  unpleasantTaste: z.boolean().optional().default(false),
  badBreath: z.boolean().optional().default(false),
  dryMouth: z.boolean().optional().default(false),
  foodTrap: z.boolean().optional().default(false),
  interestedInCosmetic: z.boolean().optional().default(false),
  
  // Dental anxiety & preferences
  anxietyLevel: z.string().optional(),
  painControl: z.string().optional(),
  communicationPreference: z.string().optional(),
  
  // Advanced questionnaire for AI analysis
  whyDidYouComeInToday: z.string().optional(),
  howWouldYouRateYourHealth: z.string().optional(),
  haveYouHadChangeInHealth: z.boolean().optional().default(false),
  hospitalizedOrMajorIllness: z.boolean().optional().default(false),
  beingTreatedByPhysician: z.boolean().optional().default(false),
  dateOfLastMedicalExam: z.string().optional(),
  dateOfLastDentalExam: z.string().optional(),
  problemsWithPreviousDental: z.boolean().optional().default(false),
  areYouInPainNow: z.boolean().optional().default(false),
  medicationsBeingTaken: z.string().optional(),
  
  // Consents
  hipaaConsent: z.boolean().default(false),
  treatmentConsent: z.boolean().default(false),
  financialResponsibilityAgreement: z.boolean().default(false),
  assignmentOfBenefits: z.boolean().default(false),
  officePolicy: z.boolean().default(false),
  
  // Account Creation
  createAccount: z.boolean().default(true),
  userId: z.number().optional()
});

type AddPatientFormData = z.infer<typeof formSchema>;

// Define steps for multi-step form
const steps = [
  { id: 'personal', title: 'Personal Information' },
  { id: 'emergency', title: 'Emergency Contact' },
  { id: 'insurance', title: 'Insurance' },
  { id: 'medical', title: 'Medical History' },
  { id: 'dental', title: 'Dental History' },
  { id: 'consent', title: 'Consents' },
];

export function ImprovedAddPatientForm({ onSuccess }: AddPatientFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth(); // Get the authenticated user
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [currentStep, setCurrentStep] = useState(0);

  const form = useForm<AddPatientFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      // Personal Information
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      dateOfBirth: "",
      homeAddress: "",
      occupation: "",
      socialSecurityNumber: "",
      gender: "",
      height: "",
      weight: "",
      bloodType: "",
      maritalStatus: "",
      
      // Emergency Contact
      emergencyContactName: "",
      emergencyContactPhone: "",
      emergencyContactRelationship: "",
      
      // Insurance Information
      insuranceProvider: "",
      insuranceNumber: "",
      insuranceGroupNumber: "",
      insurancePrimaryHolder: "",
      insuranceHolderRelation: "",
      
      // Medical History and more default values...
      // ... (keeping other defaults as in the original)
      
      // Consents
      hipaaConsent: false,
      treatmentConsent: false,
      financialResponsibilityAgreement: false,
      assignmentOfBenefits: false,
      officePolicy: false,
      
      // Account Creation
      createAccount: true,
      userId: user?.id
    }
  });

  const addPatientMutation = useMutation({
    mutationFn: async (data: AddPatientFormData) => {
      // Make sure we have a user ID if we're not creating a new account
      if (!data.createAccount && (!user || !user.id)) {
        throw new Error("You must be logged in to create a patient without an account");
      }

      console.log("Creating patient with user:", user?.id);
      
      // Make sure the user ID is always included in the request
      const userId = user?.id;
      console.log("Current user ID:", userId);
      
      return await apiRequest({
        method: "POST",
        url: "/api/patients",
        body: {
          ...data,
          role: "patient",
          language: "en",
          // Always include the user ID in the request for patient creation
          // When createAccount is true, the server will create a new user and link it
          // When createAccount is false, we'll use the current user's ID
          userId: userId,
          creatingUserType: user?.role || "doctor", // Pass current user's role to server
          // Generate a username and password for the patient
          username: `${data.firstName.toLowerCase()}${data.lastName.toLowerCase()}`,
          password: Math.random().toString(36).slice(-8) // Generate a random 8-character password
        }
      });
    },
    onSuccess: () => {
      // Invalidate both the patients list and any related queries
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      toast({
        title: t("patient.addSuccess"),
        description: t("patient.addSuccessDescription"),
      });
      form.reset();
      onSuccess?.();
    },
    onError: (error: Error) => {
      console.error("Error adding patient:", error);
      toast({
        title: t("patient.addError"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: AddPatientFormData) {
    setIsSubmitting(true);
    addPatientMutation.mutate(data);
  }

  // Next step
  const nextStep = () => {
    const fields = [
      // Step 1: Personal Information
      ['firstName', 'lastName', 'email', 'phoneNumber', 'dateOfBirth'],
      // Step 2: Emergency Contact 
      [], // Emergency is optional
      // Step 3: Insurance Information
      [], // Insurance is optional
      // Step 4: Medical History
      [], // Medical history has complex validation, handled separately
      // Step 5: Dental History
      [], // Dental history is optional
      // Step 6: Consent
      ['hipaaConsent', 'treatmentConsent', 'financialResponsibilityAgreement']
    ];
    
    // Get fields for current step
    const currentFields = fields[currentStep];
    
    // Validate only the fields in the current step
    if (currentFields.length > 0) {
      const stepIsValid = currentFields.every(field => {
        form.trigger(field as any);
        const fieldState = form.getFieldState(field as any);
        return !fieldState.invalid;
      });
      
      if (!stepIsValid) {
        return; // Don't advance if the current step is invalid
      }
    }
    
    // Special case for consent step
    if (currentStep === 5) {
      if (!form.getValues('hipaaConsent') || !form.getValues('treatmentConsent') || !form.getValues('financialResponsibilityAgreement')) {
        if (!form.getValues('hipaaConsent')) {
          form.setError('hipaaConsent', {
            type: 'manual',
            message: 'You must agree to the HIPAA notice'
          });
        }
        if (!form.getValues('treatmentConsent')) {
          form.setError('treatmentConsent', {
            type: 'manual',
            message: 'You must consent to treatment'
          });
        }
        if (!form.getValues('financialResponsibilityAgreement')) {
          form.setError('financialResponsibilityAgreement', {
            type: 'manual',
            message: 'You must agree to financial responsibility'
          });
        }
        return;
      }
      
      // If we're on the last step and everything is valid, submit the form
      form.handleSubmit(onSubmit)();
      return;
    }
    
    // Move to next step
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    setActiveTab(steps[Math.min(currentStep + 1, steps.length - 1)].id);
  };
  
  // Previous step
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
    setActiveTab(steps[Math.max(currentStep - 1, 0)].id);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="border-b">
        <CardTitle className="text-2xl">Add New Patient</CardTitle>
        <CardDescription>
          Create a new patient record with complete medical and dental history.
        </CardDescription>
      </CardHeader>
      
      {/* Progress Indicator similar to patient intake form */}
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
            <ScrollArea className="h-[calc(70vh-220px)] pr-4">
              {/* Step 1: Personal Information */}
              {activeTab === "personal" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Enter first name" {...field} />
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
                          <FormLabel>Last Name <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Enter last name" {...field} />
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
                        <FormItem>
                          <FormLabel>Date of Birth <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="non-binary">Non-binary</SelectItem>
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
                          <FormLabel>Email <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="email@example.com" {...field} />
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
                          <FormLabel>Phone Number <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="(555) 555-5555" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="homeAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Home Address</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter full address"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="height"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Height</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 5'10\"" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight (lbs)</FormLabel>
                          <FormControl>
                            <Input type="text" placeholder="e.g. 160" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bloodType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Blood Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select blood type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="A+">A+</SelectItem>
                              <SelectItem value="A-">A-</SelectItem>
                              <SelectItem value="B+">B+</SelectItem>
                              <SelectItem value="B-">B-</SelectItem>
                              <SelectItem value="AB+">AB+</SelectItem>
                              <SelectItem value="AB-">AB-</SelectItem>
                              <SelectItem value="O+">O+</SelectItem>
                              <SelectItem value="O-">O-</SelectItem>
                              <SelectItem value="unknown">Unknown</SelectItem>
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
                      name="maritalStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Marital Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select marital status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="single">Single</SelectItem>
                              <SelectItem value="married">Married</SelectItem>
                              <SelectItem value="divorced">Divorced</SelectItem>
                              <SelectItem value="widowed">Widowed</SelectItem>
                              <SelectItem value="separated">Separated</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="occupation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Occupation</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter occupation" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Emergency Contact */}
              {activeTab === "emergency" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="emergencyContactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emergency Contact Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Full name" {...field} />
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
                          <FormLabel>Emergency Contact Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="(555) 555-5555" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="emergencyContactRelationship"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relationship to Patient</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              )}

              {/* Step 3: Insurance Information */}
              {activeTab === "insurance" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Insurance Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="insuranceProvider"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Insurance Provider</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter provider name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="insuranceNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Insurance ID/Member Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter ID number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="insuranceGroupNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Group Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter group number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="insurancePrimaryHolder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Insurance Holder</FormLabel>
                          <FormControl>
                            <Input placeholder="Full name of policy holder" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="insuranceHolderRelation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Relationship to Primary Holder</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select relationship" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="self">Self</SelectItem>
                              <SelectItem value="spouse">Spouse</SelectItem>
                              <SelectItem value="child">Child</SelectItem>
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

              {/* Step 4: Medical History */}
              {activeTab === "medical" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Medical History</h3>
                  
                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="underPhysicianCare"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Currently under a physician's care?</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    {form.watch("underPhysicianCare") && (
                      <div className="ml-7 space-y-4">
                        <FormField
                          control={form.control}
                          name="physicianConditions"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>For what condition(s)?</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="List conditions"
                                  className="resize-none"
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
                            name="physicianName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Physician's Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Dr. Name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="physicianPhone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Physician's Phone</FormLabel>
                                <FormControl>
                                  <Input placeholder="(555) 555-5555" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <FormField
                    control={form.control}
                    name="allergies"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Allergies (medications, latex, etc.)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="List all allergies"
                            className="resize-none"
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
                            placeholder="List all medications you are currently taking"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Separator />
                  
                  <h4 className="font-medium">Do you have any of the following conditions?</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="hypertension"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Hypertension (High Blood Pressure)</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="diabetes"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Diabetes</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="heartDisease"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Heart Disease</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="asthma"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Asthma</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    {/* More conditions would be listed here similar to above */}
                  </div>
                  
                  <Separator />
                  
                  <h4 className="font-medium">Lifestyle</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="smokesTobacco"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Do you smoke or use tobacco products?</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="useAlcohol"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Do you consume alcoholic beverages?</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="isPregnantOrNursing"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Are you pregnant or nursing?</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Step 5: Dental History */}
              {activeTab === "dental" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Dental History</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="lastDentalVisit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Last Dental Visit</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastDentalXrays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Last Dental X-rays</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="reasonForVisitToday"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason For Today's Visit</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Please describe the reason for your visit today"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Separator />
                  
                  <h4 className="font-medium">Dental Conditions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="sensitivityToHotCold"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Sensitivity to hot/cold</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="bleedingGums"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Bleeding gums</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="grindTeeth"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Grinding or clenching teeth</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="hadRootCanal"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Had root canal treatment</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    {/* Additional dental conditions would be listed here */}
                  </div>
                  
                  <Separator />
                  
                  <h4 className="font-medium">Dental Anxiety</h4>
                  <FormField
                    control={form.control}
                    name="anxietyLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>How would you rate your dental anxiety?</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="none" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                None - I'm completely comfortable
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="mild" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Mild - Slightly nervous but manageable
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="moderate" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Moderate - Definitely anxious
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="severe" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Severe - Very anxious/fearful
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 6: Consent & Agreements */}
              {activeTab === "consent" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Consent & Agreements</h3>
                  
                  <FormField
                    control={form.control}
                    name="hipaaConsent"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>HIPAA Consent <span className="text-destructive">*</span></FormLabel>
                          <FormDescription>
                            I acknowledge that I have received a copy of this practice's Notice of Privacy Practices, which explains how my health information will be used and disclosed.
                          </FormDescription>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="treatmentConsent"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Consent to Treatment <span className="text-destructive">*</span></FormLabel>
                          <FormDescription>
                            I authorize the dentist and dental team to perform diagnostic procedures and treatment as may be necessary for proper dental care.
                          </FormDescription>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="financialResponsibilityAgreement"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Financial Responsibility <span className="text-destructive">*</span></FormLabel>
                          <FormDescription>
                            I understand that I am financially responsible for all charges whether or not paid by insurance. I authorize the release of any information relating to my dental claims.
                          </FormDescription>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="assignmentOfBenefits"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Assignment of Benefits</FormLabel>
                          <FormDescription>
                            I authorize payment of dental benefits to the named provider for professional services rendered.
                          </FormDescription>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="createAccount"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Create Patient Portal Account</FormLabel>
                          <FormDescription>
                            Create an account for this patient to access online appointment booking, form completion, and secure messaging.
                          </FormDescription>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </ScrollArea>
            
            {/* Navigation buttons and submit */}
            <div className="flex justify-between pt-2 border-t mt-4">
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                >
                  Previous
                </Button>
              </div>
              
              <div className="flex gap-2">
                {currentStep < steps.length - 1 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                  >
                    Next <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || addPatientMutation.isPending}
                    onClick={form.handleSubmit(onSubmit)}
                  >
                    <Save className="mr-1 h-4 w-4" />
                    {(isSubmitting || addPatientMutation.isPending) ? "Adding..." : "Add Patient"}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}