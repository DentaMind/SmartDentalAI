import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  CheckCircle2,
  Edit,
  ExternalLink,
  FileText,
  Lock,
  Mail,
  MoreHorizontal,
  Plus,
  Search,
  Shield,
  Stethoscope,
  Trash,
  User,
  UserCircle,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// User Roles
const roles = [
  { value: "provider", label: "Provider (Dentist)", icon: <Stethoscope className="h-4 w-4" /> },
  { value: "staff", label: "Staff", icon: <UserCog className="h-4 w-4" /> },
  { value: "patient", label: "Patient", icon: <User className="h-4 w-4" /> },
  { value: "admin", label: "Administrator", icon: <Shield className="h-4 w-4" /> },
];

// Specializations for Providers
const specializations = [
  { value: "general", label: "General Dentistry" },
  { value: "orthodontics", label: "Orthodontics" },
  { value: "pediatric", label: "Pediatric Dentistry" },
  { value: "periodontics", label: "Periodontics" },
  { value: "endodontics", label: "Endodontics" },
  { value: "oral_surgery", label: "Oral Surgery" },
  { value: "prosthodontics", label: "Prosthodontics" },
];

// Staff Positions
const staffPositions = [
  { value: "receptionist", label: "Receptionist" },
  { value: "assistant", label: "Dental Assistant" },
  { value: "hygienist", label: "Dental Hygienist" },
  { value: "office_manager", label: "Office Manager" },
  { value: "billing", label: "Billing Specialist" },
  { value: "lab", label: "Lab Technician" },
];

// Define schemas for account creation forms
const staffSchema = z.object({
  firstName: z.string().min(2, { message: "First name is required" }),
  lastName: z.string().min(2, { message: "Last name is required" }),
  email: z.string().email({ message: "Valid email address is required" }),
  phoneNumber: z.string().min(10, { message: "Valid phone number is required" }),
  role: z.string(),
  position: z.string().optional(),
  specialization: z.string().optional(),
  licenseNumber: z.string().optional(),
  officeLocation: z.string(),
  sendInvite: z.boolean().default(true),
});

const patientSchema = z.object({
  firstName: z.string().min(2, { message: "First name is required" }),
  lastName: z.string().min(2, { message: "Last name is required" }),
  email: z.string().email({ message: "Valid email address is required" }),
  phoneNumber: z.string().min(10, { message: "Valid phone number is required" }),
  dateOfBirth: z.string().min(1, { message: "Date of birth is required" }),
  insuranceProvider: z.string().optional(),
  insuranceNumber: z.string().optional(),
  sendInvite: z.boolean().default(true),
  officeLocation: z.string(),
});

// Types based on schemas
type StaffFormValues = z.infer<typeof staffSchema>;
type PatientFormValues = z.infer<typeof patientSchema>;

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  isActive?: boolean;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  role: string;
  specialization?: string;
  licenseNumber?: string;
  position?: string;
  officeLocationId?: string;
  dateOfBirth?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export function AccountManagement() {
  const [activeTab, setActiveTab] = useState("staff");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Initialize staff form
  const staffForm = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      role: "staff",
      position: "",
      specialization: "",
      licenseNumber: "",
      officeLocation: "",
      sendInvite: true,
    },
  });
  
  // Initialize patient form
  const patientForm = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      dateOfBirth: "",
      insuranceProvider: "",
      insuranceNumber: "",
      sendInvite: true,
      officeLocation: "",
    },
  });
  
  // Query to get practice locations
  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
    queryFn: async () => {
      try {
        const data = await apiRequest<Location[]>("/api/locations");
        return data;
      } catch (error) {
        console.error("Failed to fetch locations:", error);
        return [];
      }
    },
  });
  
  // Sample locations for demonstration
  const sampleLocations: Location[] = [
    {
      id: "1",
      name: "Main Office",
      address: "123 Main Street",
      city: "Boston",
      state: "MA",
      zipCode: "02115",
      phoneNumber: "(617) 555-1234",
      isActive: true,
    },
    {
      id: "2",
      name: "Downtown Branch",
      address: "456 Market Street",
      city: "Boston",
      state: "MA",
      zipCode: "02110",
      phoneNumber: "(617) 555-5678",
      isActive: true,
    },
  ];
  
  // Query to get staff members
  const { data: staffData, isLoading: isStaffLoading } = useQuery<User[]>({
    queryKey: ["/api/users/staff"],
    queryFn: async () => {
      try {
        const data = await apiRequest<User[]>("/api/users?role=staff,provider,admin");
        return data;
      } catch (error) {
        console.error("Failed to fetch staff:", error);
        return [];
      }
    },
  });
  
  // Query to get patients
  const { data: patientsData, isLoading: isPatientsLoading } = useQuery<User[]>({
    queryKey: ["/api/users/patients"],
    queryFn: async () => {
      try {
        const data = await apiRequest<User[]>("/api/users?role=patient");
        return data;
      } catch (error) {
        console.error("Failed to fetch patients:", error);
        return [];
      }
    },
  });
  
  // Sample users for demonstration
  const sampleStaff: User[] = [
    {
      id: 1,
      firstName: "Jane",
      lastName: "Smith",
      email: "jsmith@smartdental.ai",
      phoneNumber: "(617) 555-1111",
      role: "provider",
      specialization: "general",
      licenseNumber: "DDS123456",
      officeLocationId: "1",
      createdAt: "2025-01-15T09:00:00Z",
      lastLogin: "2025-03-07T14:30:00Z",
      isActive: true,
    },
    {
      id: 2,
      firstName: "Michael",
      lastName: "Johnson",
      email: "mjohnson@smartdental.ai",
      phoneNumber: "(617) 555-2222",
      role: "staff",
      position: "hygienist",
      officeLocationId: "1",
      createdAt: "2025-01-20T10:15:00Z",
      lastLogin: "2025-03-08T09:45:00Z",
      isActive: true,
    },
    {
      id: 3,
      firstName: "Sarah",
      lastName: "Williams",
      email: "swilliams@smartdental.ai",
      phoneNumber: "(617) 555-3333",
      role: "staff",
      position: "receptionist",
      officeLocationId: "2",
      createdAt: "2025-02-01T11:30:00Z",
      lastLogin: "2025-03-06T16:20:00Z",
      isActive: true,
    },
  ];
  
  const samplePatients: User[] = [
    {
      id: 4,
      firstName: "Robert",
      lastName: "Davis",
      email: "rdavis@example.com",
      phoneNumber: "(617) 555-4444",
      role: "patient",
      dateOfBirth: "1980-06-15",
      insuranceProvider: "Delta Dental",
      insuranceNumber: "DD98765432",
      officeLocationId: "1",
      createdAt: "2025-02-10T14:00:00Z",
      lastLogin: "2025-03-01T10:30:00Z",
      isActive: true,
    },
    {
      id: 5,
      firstName: "Emily",
      lastName: "Brown",
      email: "ebrown@example.com",
      phoneNumber: "(617) 555-5555",
      role: "patient",
      dateOfBirth: "1992-09-22",
      insuranceProvider: "Cigna",
      insuranceNumber: "CG12345678",
      officeLocationId: "2",
      createdAt: "2025-02-15T09:30:00Z",
      lastLogin: "2025-03-05T15:45:00Z",
      isActive: true,
    },
  ];
  
  // Use the real data if available, otherwise use sample data
  const displayLocations = locations.length > 0 ? locations : sampleLocations;
  const displayStaff = staffData || sampleStaff;
  const displayPatients = patientsData || samplePatients;
  
  // Filter staff/patients based on search query
  const filteredStaff = displayStaff.filter(
    (staff) => 
      staff.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (staff.position && staff.position.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (staff.specialization && staff.specialization.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const filteredPatients = displayPatients.filter(
    (patient) => 
      patient.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (patient.insuranceProvider && patient.insuranceProvider.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // Mutation for creating staff member
  const createStaffMutation = useMutation({
    mutationFn: async (data: StaffFormValues) => {
      return apiRequest("POST", "/api/users", {
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      setCreateModalOpen(false);
      staffForm.reset();
      
      queryClient.invalidateQueries({ queryKey: ["/api/users/staff"] });
      
      toast({
        title: "Account created successfully",
        description: staffForm.getValues("sendInvite")
          ? "An invitation email has been sent to the new user."
          : "The account has been created without sending an invitation.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Error creating staff account:", error);
      
      toast({
        title: "Error creating account",
        description: "There was an error creating the account. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for creating patient
  const createPatientMutation = useMutation({
    mutationFn: async (data: PatientFormValues) => {
      return apiRequest("POST", "/api/users", {
        body: JSON.stringify({
          ...data,
          role: "patient",
        }),
      });
    },
    onSuccess: () => {
      setCreateModalOpen(false);
      patientForm.reset();
      
      queryClient.invalidateQueries({ queryKey: ["/api/users/patients"] });
      
      toast({
        title: "Patient account created successfully",
        description: patientForm.getValues("sendInvite")
          ? "An invitation email has been sent to the patient."
          : "The patient account has been created without sending an invitation.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Error creating patient account:", error);
      
      toast({
        title: "Error creating patient account",
        description: "There was an error creating the patient account. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for deactivating user
  const deactivateUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest("PATCH", `/api/users/${userId}`, {
        body: JSON.stringify({ isActive: false }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/staff"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/patients"] });
      
      toast({
        title: "Account deactivated",
        description: "The user account has been deactivated successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Error deactivating account:", error);
      
      toast({
        title: "Error deactivating account",
        description: "There was an error deactivating the account. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Handle staff form submission
  const onStaffSubmit = (data: StaffFormValues) => {
    createStaffMutation.mutate(data);
  };
  
  // Handle patient form submission
  const onPatientSubmit = (data: PatientFormValues) => {
    createPatientMutation.mutate(data);
  };
  
  // Handle deactivating a user
  const handleDeactivateUser = (userId: number) => {
    if (window.confirm("Are you sure you want to deactivate this account? The user will no longer be able to access the system.")) {
      deactivateUserMutation.mutate(userId);
    }
  };
  
  // Get role badge style
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "provider":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Provider</Badge>;
      case "staff":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Staff</Badge>;
      case "admin":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Admin</Badge>;
      case "patient":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Patient</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };
  
  // Get location name from ID
  const getLocationName = (locationId?: string) => {
    if (!locationId) return "N/A";
    const location = displayLocations.find(loc => loc.id === locationId);
    return location ? location.name : "Unknown Location";
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Account Management</h2>
          <p className="text-muted-foreground">Manage staff and patient accounts for your practice</p>
        </div>
        
        <Button 
          onClick={() => setCreateModalOpen(true)}
          className="gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Create Account
        </Button>
      </div>
      
      {/* Create Account Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create New Account</DialogTitle>
            <DialogDescription>
              Create a new staff member or patient account for your dental practice.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="staff" className="mt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="staff" className="gap-2">
                <Users className="h-4 w-4" />
                <span>Staff/Provider</span>
              </TabsTrigger>
              <TabsTrigger value="patient" className="gap-2">
                <User className="h-4 w-4" />
                <span>Patient</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Staff Account Form */}
            <TabsContent value="staff">
              <Form {...staffForm}>
                <form onSubmit={staffForm.handleSubmit(onStaffSubmit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 py-4">
                    <FormField
                      control={staffForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="First name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={staffForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Last name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={staffForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="Email address" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={staffForm.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Phone number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={staffForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {roles.filter(role => role.value !== "patient").map((role) => (
                                <SelectItem key={role.value} value={role.value}>
                                  <div className="flex items-center gap-2">
                                    {role.icon}
                                    <span>{role.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {staffForm.watch("role") === "provider" && (
                      <FormField
                        control={staffForm.control}
                        name="specialization"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Specialization</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select specialization" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {specializations.map((specialization) => (
                                  <SelectItem key={specialization.value} value={specialization.value}>
                                    {specialization.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    {staffForm.watch("role") === "provider" && (
                      <FormField
                        control={staffForm.control}
                        name="licenseNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>License Number</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Dental license number" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    {staffForm.watch("role") === "staff" && (
                      <FormField
                        control={staffForm.control}
                        name="position"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Position</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select position" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {staffPositions.map((position) => (
                                  <SelectItem key={position.value} value={position.value}>
                                    {position.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    <FormField
                      control={staffForm.control}
                      name="officeLocation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Office Location</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select location" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {displayLocations.map((location) => (
                                <SelectItem key={location.id} value={location.id}>
                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    <span>{location.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={staffForm.control}
                      name="sendInvite"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 col-span-2">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Send email invitation</FormLabel>
                            <FormDescription>
                              An email will be sent to the user with instructions to set up their account.
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setCreateModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={createStaffMutation.isPending}
                    >
                      {createStaffMutation.isPending ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Creating...
                        </>
                      ) : (
                        "Create Staff Account"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </TabsContent>
            
            {/* Patient Account Form */}
            <TabsContent value="patient">
              <Form {...patientForm}>
                <form onSubmit={patientForm.handleSubmit(onPatientSubmit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 py-4">
                    <FormField
                      control={patientForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="First name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={patientForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Last name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={patientForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="Email address" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={patientForm.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Phone number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={patientForm.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={patientForm.control}
                      name="officeLocation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Office Location</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select location" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {displayLocations.map((location) => (
                                <SelectItem key={location.id} value={location.id}>
                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    <span>{location.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={patientForm.control}
                      name="insuranceProvider"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Insurance Provider (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Insurance provider" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={patientForm.control}
                      name="insuranceNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Insurance Number (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Insurance number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={patientForm.control}
                      name="sendInvite"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 col-span-2">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Send email invitation</FormLabel>
                            <FormDescription>
                              An email will be sent to the patient with instructions to set up their account.
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setCreateModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={createPatientMutation.isPending}
                    >
                      {createPatientMutation.isPending ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Creating...
                        </>
                      ) : (
                        "Create Patient Account"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      
      {/* User Details Modal */}
      {selectedUser && (
        <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedUser.role === "provider" ? (
                  <Stethoscope className="h-5 w-5 text-primary" />
                ) : selectedUser.role === "staff" ? (
                  <UserCog className="h-5 w-5 text-primary" />
                ) : (
                  <UserCircle className="h-5 w-5 text-primary" />
                )}
                User Details
              </DialogTitle>
              <DialogDescription>
                Detailed information for {selectedUser.firstName} {selectedUser.lastName}
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <UserCircle className="h-5 w-5" />
                      {selectedUser.firstName} {selectedUser.lastName}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {getRoleBadge(selectedUser.role)}
                      {selectedUser.isActive ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription>
                    Account created on {formatDate(selectedUser.createdAt)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Email Address</p>
                      <p className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {selectedUser.email}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Phone Number</p>
                      <p>{selectedUser.phoneNumber || "N/A"}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Office Location</p>
                      <p className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {getLocationName(selectedUser.officeLocationId)}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Last Login</p>
                      <p>{selectedUser.lastLogin ? formatDate(selectedUser.lastLogin) : "Never"}</p>
                    </div>
                    
                    {selectedUser.role === "provider" && (
                      <>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Specialization</p>
                          <p>
                            {selectedUser.specialization 
                              ? specializations.find(s => s.value === selectedUser.specialization)?.label || selectedUser.specialization
                              : "N/A"}
                          </p>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">License Number</p>
                          <p className="flex items-center gap-2">
                            <Lock className="h-4 w-4 text-muted-foreground" />
                            {selectedUser.licenseNumber || "N/A"}
                          </p>
                        </div>
                      </>
                    )}
                    
                    {selectedUser.role === "staff" && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Position</p>
                        <p>
                          {selectedUser.position 
                            ? staffPositions.find(p => p.value === selectedUser.position)?.label || selectedUser.position
                            : "N/A"}
                        </p>
                      </div>
                    )}
                    
                    {selectedUser.role === "patient" && (
                      <>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Date of Birth</p>
                          <p>{selectedUser.dateOfBirth ? formatDate(selectedUser.dateOfBirth) : "N/A"}</p>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Insurance Provider</p>
                          <p>{selectedUser.insuranceProvider || "N/A"}</p>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Insurance Number</p>
                          <p>{selectedUser.insuranceNumber || "N/A"}</p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-end mt-6 gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setDetailModalOpen(false)}
                >
                  Close
                </Button>
                <Button 
                  variant="outline" 
                  className="gap-1"
                >
                  <Edit className="h-4 w-4" />
                  Edit User
                </Button>
                <Button
                  variant="destructive"
                  className="gap-1"
                  onClick={() => {
                    handleDeactivateUser(selectedUser.id);
                    setDetailModalOpen(false);
                  }}
                  disabled={!selectedUser.isActive}
                >
                  <Trash className="h-4 w-4" />
                  Deactivate Account
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Users List Tab */}
      <div>
        <Tabs defaultValue="staff" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between">
            <TabsList>
              <TabsTrigger value="staff" className="gap-2">
                <Users className="h-4 w-4" />
                Staff & Providers
              </TabsTrigger>
              <TabsTrigger value="patients" className="gap-2">
                <User className="h-4 w-4" />
                Patients
              </TabsTrigger>
            </TabsList>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="w-64 pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <TabsContent value="staff" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Staff & Providers</CardTitle>
                <CardDescription>
                  Manage all staff members and providers across your locations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isStaffLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : filteredStaff.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-16">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStaff.map((staffMember) => (
                        <TableRow key={staffMember.id}>
                          <TableCell>
                            <div className="font-medium">
                              {staffMember.firstName} {staffMember.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {staffMember.role === "provider" 
                                ? staffMember.specialization && `${specializations.find(s => s.value === staffMember.specialization)?.label || staffMember.specialization}`
                                : staffMember.position && `${staffPositions.find(p => p.value === staffMember.position)?.label || staffMember.position}`}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getRoleBadge(staffMember.role)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span>{staffMember.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getLocationName(staffMember.officeLocationId)}
                          </TableCell>
                          <TableCell>
                            {staffMember.isActive ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                Inactive
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedUser(staffMember);
                                    setDetailModalOpen(true);
                                  }}
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Send Password Reset
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDeactivateUser(staffMember.id)}
                                  disabled={!staffMember.isActive}
                                >
                                  <Trash className="h-4 w-4 mr-2" />
                                  Deactivate Account
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <h3 className="text-lg font-medium">No staff members found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery ? `No results for "${searchQuery}"` : "Create staff accounts to get started"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="patients" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Patients</CardTitle>
                <CardDescription>
                  Manage all patient accounts across your practice locations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isPatientsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : filteredPatients.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email/Phone</TableHead>
                        <TableHead>Insurance</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-16">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPatients.map((patient) => (
                        <TableRow key={patient.id}>
                          <TableCell>
                            <div className="font-medium">
                              {patient.firstName} {patient.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {patient.dateOfBirth && `DOB: ${formatDate(patient.dateOfBirth)}`}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span>{patient.email}</span>
                            </div>
                            {patient.phoneNumber && (
                              <div className="text-sm text-muted-foreground mt-1">
                                {patient.phoneNumber}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {patient.insuranceProvider ? (
                              <div>
                                <div>{patient.insuranceProvider}</div>
                                <div className="text-sm text-muted-foreground">{patient.insuranceNumber || "No #"}</div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">No insurance</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {getLocationName(patient.officeLocationId)}
                          </TableCell>
                          <TableCell>
                            {patient.isActive ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                Inactive
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedUser(patient);
                                    setDetailModalOpen(true);
                                  }}
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  View Chart
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDeactivateUser(patient.id)}
                                  disabled={!patient.isActive}
                                >
                                  <Trash className="h-4 w-4 mr-2" />
                                  Deactivate Account
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <User className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <h3 className="text-lg font-medium">No patients found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery ? `No results for "${searchQuery}"` : "Create patient accounts to get started"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}