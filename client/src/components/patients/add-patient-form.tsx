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
  
  // Emergency Contact
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
  
  // Insurance Information
  insuranceProvider: z.string().optional(),
  insuranceNumber: z.string().optional(),
  
  // Medical History
  allergies: z.string().optional(),
  bloodType: z.string().optional(),
  currentTreatment: z.string().optional(),
  smokesTobacco: z.boolean().optional().default(false),
  isPregnantOrNursing: z.boolean().optional().default(false),
  
  // Dental History
  lastDentalVisit: z.string().optional(),
  chiefComplaint: z.string().optional(),
  currentSymptoms: z.string().optional(),
  
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
      
      // Emergency Contact
      emergencyContactName: "",
      emergencyContactPhone: "",
      emergencyContactRelationship: "",
      
      // Insurance Information
      insuranceProvider: "",
      insuranceNumber: "",
      
      // Medical History
      allergies: "",
      bloodType: "",
      currentTreatment: "",
      smokesTobacco: false,
      isPregnantOrNursing: false,
      
      // Dental History
      lastDentalVisit: "",
      chiefComplaint: "",
      currentSymptoms: "",
      
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
                name="bloodType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Blood Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
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
                        <SelectItem value="Unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="currentTreatment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Treatments/Medications</FormLabel>
                    <FormControl>
                      <Input placeholder="List current medications" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="smokesTobacco"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
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
                name="isPregnantOrNursing"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
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