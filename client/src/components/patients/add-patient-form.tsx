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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";

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
  socialSecurityNumber: z.string().optional(),
  
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
  allergies: z.string().optional(),
  currentMedications: z.string().optional(),
  currentTreatment: z.string().optional(),
  
  // Medical Conditions
  hypertension: z.boolean().optional().default(false),
  diabetes: z.boolean().optional().default(false),
  heartDisease: z.boolean().optional().default(false),
  asthma: z.boolean().optional().default(false),
  arthritis: z.boolean().optional().default(false),
  cancer: z.boolean().optional().default(false),
  stroke: z.boolean().optional().default(false),
  kidneyDisease: z.boolean().optional().default(false),
  liverDisease: z.boolean().optional().default(false),
  thyroidDisease: z.boolean().optional().default(false),
  mentalHealth: z.boolean().optional().default(false),
  seizures: z.boolean().optional().default(false),
  bleedingDisorders: z.boolean().optional().default(false),
  autoimmune: z.boolean().optional().default(false),
  hepatitis: z.boolean().optional().default(false),
  hiv: z.boolean().optional().default(false),
  
  // Lifestyle
  smokesTobacco: z.boolean().optional().default(false),
  useAlcohol: z.boolean().optional().default(false),
  isPregnantOrNursing: z.boolean().optional().default(false),
  
  // Dental History
  lastDentalVisit: z.string().optional(),
  whenIssueStarted: z.string().optional(),
  experiencedBefore: z.boolean().optional().default(false),
  chiefComplaint: z.string().optional(),
  currentSymptoms: z.string().optional(),
  previousDentalProcedures: z.string().optional(),
  
  // Dental Conditions
  hadGumDisease: z.boolean().optional().default(false),
  hadExtractions: z.boolean().optional().default(false),
  hadDentalImplants: z.boolean().optional().default(false),
  hadOrthodonticTreatment: z.boolean().optional().default(false),
  hadRootCanal: z.boolean().optional().default(false),
  hadJawPain: z.boolean().optional().default(false),
  sensitivityToHotCold: z.boolean().optional().default(false),
  grindTeeth: z.boolean().optional().default(false),
  interestedInCosmetic: z.boolean().optional().default(false),
  
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

export function AddPatientForm({ onSuccess }: AddPatientFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth(); // Get the authenticated user
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");

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
      socialSecurityNumber: "",
      
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
      
      // Medical History
      allergies: "",
      currentMedications: "",
      currentTreatment: "",
      
      // Medical Conditions
      hypertension: false,
      diabetes: false,
      heartDisease: false,
      asthma: false,
      arthritis: false,
      cancer: false,
      stroke: false,
      kidneyDisease: false,
      liverDisease: false,
      thyroidDisease: false,
      mentalHealth: false,
      seizures: false,
      bleedingDisorders: false,
      autoimmune: false,
      hepatitis: false,
      hiv: false,
      
      // Lifestyle
      smokesTobacco: false,
      useAlcohol: false,
      isPregnantOrNursing: false,
      
      // Dental History
      lastDentalVisit: "",
      whenIssueStarted: "",
      experiencedBefore: false,
      chiefComplaint: "",
      currentSymptoms: "",
      previousDentalProcedures: "",
      
      // Dental Conditions
      hadGumDisease: false,
      hadExtractions: false,
      hadDentalImplants: false,
      hadOrthodonticTreatment: false,
      hadRootCanal: false,
      hadJawPain: false,
      sensitivityToHotCold: false,
      grindTeeth: false,
      interestedInCosmetic: false,
      
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Tabs Navigation */}
        <div className="border-b">
          <nav className="flex space-x-2" aria-label="Patient Information Tabs">
            <button
              type="button"
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "personal" 
                  ? "border-primary text-primary" 
                  : "border-transparent text-muted-foreground hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("personal")}
            >
              Personal Information
            </button>
            
            <button
              type="button"
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "emergency" 
                  ? "border-primary text-primary" 
                  : "border-transparent text-muted-foreground hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("emergency")}
            >
              Emergency Contact
            </button>
            
            <button
              type="button"
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "insurance" 
                  ? "border-primary text-primary" 
                  : "border-transparent text-muted-foreground hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("insurance")}
            >
              Insurance
            </button>
            
            <button
              type="button"
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "medical" 
                  ? "border-primary text-primary" 
                  : "border-transparent text-muted-foreground hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("medical")}
            >
              Medical History
            </button>
            
            <button
              type="button"
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "dental" 
                  ? "border-primary text-primary" 
                  : "border-transparent text-muted-foreground hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("dental")}
            >
              Dental History
            </button>
            
            <button
              type="button"
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "consent" 
                  ? "border-primary text-primary" 
                  : "border-transparent text-muted-foreground hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("consent")}
            >
              Consent Forms
            </button>
          </nav>
        </div>
        
        {/* Personal Information Tab */}
        {activeTab === "personal" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="patient@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number <span className="text-destructive">*</span></FormLabel>
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
                    <FormLabel>Date of Birth <span className="text-destructive">*</span></FormLabel>
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
              name="homeAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Home Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="socialSecurityNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Social Security Number</FormLabel>
                  <FormControl>
                    <Input placeholder="XXX-XX-XXXX" {...field} />
                  </FormControl>
                  <FormDescription>
                    Your SSN is kept secure and encrypted
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="createAccount"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Create patient portal account</FormLabel>
                    <FormDescription>
                      Create a patient portal account with auto-generated credentials
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>
        )}
        
        {/* Emergency Contact Tab */}
        {activeTab === "emergency" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                      <Input placeholder="(123) 456-7890" {...field} />
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
                  <FormControl>
                    <Input placeholder="e.g., Spouse, Parent, Child" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
        
        {/* Insurance Tab */}
        {activeTab === "insurance" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="insuranceProvider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Insurance Provider</FormLabel>
                    <FormControl>
                      <Input placeholder="Provider name" {...field} />
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
                    <FormLabel>Insurance Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Policy/Member ID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="insuranceGroupNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Insurance group number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="insurancePrimaryHolder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Insurance Holder</FormLabel>
                    <FormControl>
                      <Input placeholder="Name of primary insurance holder" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="insuranceHolderRelation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relationship to Primary Holder</FormLabel>
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
                      <SelectItem value="child">Child</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
        
        {/* Medical History Tab */}
        {activeTab === "medical" && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="allergies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allergies</FormLabel>
                  <FormControl>
                    <Textarea placeholder="List any allergies (medications, materials, etc.)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="currentMedications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Medications</FormLabel>
                    <FormControl>
                      <Textarea placeholder="List current medications and dosages" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="currentTreatment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Treatments</FormLabel>
                    <FormControl>
                      <Textarea placeholder="List any ongoing medical treatments" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormLabel className="text-lg font-medium mt-6 mb-2">Medical Conditions</FormLabel>
            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="hypertension"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Hypertension</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="diabetes"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
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
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
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
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
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
              
              <FormField
                control={form.control}
                name="arthritis"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Arthritis</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="cancer"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Cancer</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="thyroidDisease"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Thyroid Disease</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="kidneyDisease"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Kidney Disease</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="liverDisease"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Liver Disease</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="seizures"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Seizures</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="bleedingDisorders"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Bleeding Disorders</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="hepatitis"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Hepatitis</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>
            
            <FormLabel className="text-lg font-medium mt-6 mb-2">Lifestyle</FormLabel>
            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="smokesTobacco"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Smokes Tobacco</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="useAlcohol"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Alcohol Use</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isPregnantOrNursing"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Pregnant or Nursing</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}
        
        {/* Dental History Tab */}
        {activeTab === "dental" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lastDentalVisit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Dental Visit</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="whenIssueStarted"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>When did the issue start?</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 2 weeks ago" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="chiefComplaint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chief Complaint</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Main reason for visit" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="experiencedBefore"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Have you experienced this before?</FormLabel>
                  </div>
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
                    <Textarea placeholder="Describe any current dental symptoms" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormLabel className="text-lg font-medium mt-6 mb-2">Previous Dental Conditions</FormLabel>
            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="hadGumDisease"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Gum Disease</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="hadExtractions"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Tooth Extractions</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="hadDentalImplants"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Dental Implants</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="hadOrthodonticTreatment"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Orthodontic Treatment</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="hadRootCanal"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Root Canal Therapy</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="hadJawPain"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Jaw Pain or TMJ</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <FormField
                control={form.control}
                name="sensitivityToHotCold"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Sensitivity to Hot/Cold</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="grindTeeth"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Grind Teeth</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="interestedInCosmetic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Interested in Cosmetic Dentistry</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="previousDentalProcedures"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Previous Dental Procedures</FormLabel>
                  <FormControl>
                    <Textarea placeholder="List any previous dental work (fillings, crowns, root canals, etc.)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
        
        {/* Consent Forms Tab */}
        {activeTab === "consent" && (
          <div className="space-y-4">
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
                    <FormLabel>HIPAA Privacy Practices Acknowledgment</FormLabel>
                    <FormDescription>
                      I acknowledge that I have received, read, and understand the privacy practices of this dental office.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="treatmentConsent"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Consent for Treatment</FormLabel>
                    <FormDescription>
                      I authorize the dental staff to perform diagnostic procedures and treatment as may be necessary for proper dental care.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="financialResponsibilityAgreement"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Financial Responsibility Agreement</FormLabel>
                    <FormDescription>
                      I understand that I am financially responsible for all charges whether or not paid by insurance.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="assignmentOfBenefits"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Assignment of Benefits</FormLabel>
                    <FormDescription>
                      I authorize payment of dental benefits directly to the dental office.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="officePolicy"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Office Policy Agreement</FormLabel>
                    <FormDescription>
                      I acknowledge that I have read and understand the office policies including cancellation and missed appointment fees.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>
        )}
        
        {/* Form Actions */}
        <div className="flex justify-between gap-2 pt-4 border-t">
          <div className="flex gap-2">
            {activeTab !== "personal" && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  const tabs = ["personal", "emergency", "insurance", "medical", "dental", "consent"];
                  const currentIndex = tabs.indexOf(activeTab);
                  setActiveTab(tabs[currentIndex - 1]);
                }}
              >
                Previous
              </Button>
            )}
            
            {activeTab !== "consent" && (
              <Button 
                type="button"
                onClick={() => {
                  const tabs = ["personal", "emergency", "insurance", "medical", "dental", "consent"];
                  const currentIndex = tabs.indexOf(activeTab);
                  setActiveTab(tabs[currentIndex + 1]);
                }}
              >
                Next
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => form.reset()}>
              Cancel
            </Button>
            
            <Button type="submit" disabled={isSubmitting || addPatientMutation.isPending}>
              {(isSubmitting || addPatientMutation.isPending) ? "Adding..." : "Add Patient"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}