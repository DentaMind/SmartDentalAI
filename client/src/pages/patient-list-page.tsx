import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, UserPlus, MoreVertical, Edit, Trash2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Define the types for our patient data
interface PatientUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  dateOfBirth: string | null;
  insuranceProvider: string | null;
  role: string;
}

interface Patient {
  id: number;
  userId: number;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phoneNumber: string | null;
  dateOfBirth: string | null;
  allergies: string | null;
  medicalHistory: string | null;
  insuranceProvider: string | null;
  user: PatientUser;
}

// Define the type for processed patients
interface ProcessedPatient {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string | null;
  insuranceProvider: string | null;
  allergies: string[];
  medicalHistory: any;
}

const PatientListPage: React.FC = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Fetch patients data
  const {
    data: patients,
    error,
    isLoading: loading
  } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });
  
  // Show error toast if fetch fails
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load patient data. Please try again.",
        variant: "destructive",
      });
      console.error("Error loading patients:", error);
    }
  }, [patients, error, toast]);
  
  // Process patients to ensure all required fields exist and parse JSON strings
  const processedPatients: ProcessedPatient[] = patients?.map(patient => {
    // Parse allergies from JSON string
    let allergiesArray: string[] = [];
    try {
      if (patient.allergies && typeof patient.allergies === 'string' && patient.allergies.startsWith('[')) {
        allergiesArray = JSON.parse(patient.allergies);
      }
    } catch (e) {
      console.error("Failed to parse allergies:", e);
    }
    
    // Parse medical history from JSON string
    let medicalHistoryObj = {};
    try {
      if (patient.medicalHistory && typeof patient.medicalHistory === 'string' && patient.medicalHistory.startsWith('{')) {
        medicalHistoryObj = JSON.parse(patient.medicalHistory);
      }
    } catch (e) {
      console.error("Failed to parse medical history:", e);
    }
    
    // Create a clean patient object with all required fields, prioritizing user data
    return {
      id: patient.id,
      firstName: patient.user?.firstName || patient.firstName || "Unknown",
      lastName: patient.user?.lastName || patient.lastName || "Patient",
      email: patient.user?.email || patient.email || "-",
      phoneNumber: patient.user?.phoneNumber || patient.phoneNumber || "-",
      dateOfBirth: patient.user?.dateOfBirth || patient.dateOfBirth || null,
      insuranceProvider: patient.user?.insuranceProvider || patient.insuranceProvider || null,
      allergies: allergiesArray,
      medicalHistory: medicalHistoryObj
    };
  }) || [];
  
  // Filter patients based on search
  const filteredPatients = processedPatients.filter(patient => {
    if (!searchTerm) return true;
    
    const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || 
           (patient.email && patient.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
           (patient.phoneNumber && patient.phoneNumber.includes(searchTerm));
  });
  
  const handleAddPatient = () => {
    toast({
      title: "Feature coming soon",
      description: "The Add Patient feature is currently under development.",
    });
  };
  
  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Patient Directory</h2>
          <p className="text-muted-foreground">View and manage your patient records</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search patients..."
              className="w-[250px] pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Button onClick={handleAddPatient}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Patient
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Patients</TabsTrigger>
          <TabsTrigger value="recent">Recent Patients</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Today</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="pt-4">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : error ? (
                <div className="text-red-500 text-center py-10">
                  Error loading patients data. Please try again.
                </div>
              ) : filteredPatients.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 space-y-3">
                  <div className="relative w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserPlus className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-center space-y-1">
                    <h3 className="font-medium">No patients found</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      {searchTerm 
                        ? "No patients match your search criteria. Try a different search term."
                        : "You haven't added any patients yet. Add your first patient to get started."}
                    </p>
                  </div>
                  <Button onClick={handleAddPatient}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Patient
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Date of Birth</TableHead>
                        <TableHead>Phone Number</TableHead>
                        <TableHead>Insurance</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPatients.map((patient) => (
                        <TableRow key={patient.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                                {patient.firstName?.[0] || "?"}{patient.lastName?.[0] || "?"}
                              </div>
                              <div>
                                <p className="font-medium">{patient.firstName} {patient.lastName}</p>
                                <p className="text-xs text-muted-foreground">{patient.email}</p>
                                {patient.allergies && patient.allergies.length > 0 && (
                                  <p className="text-xs text-red-500 mt-1">
                                    Allergies: {patient.allergies.join(', ')}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{patient.dateOfBirth || "Not recorded"}</TableCell>
                          <TableCell>{patient.phoneNumber}</TableCell>
                          <TableCell>
                            {patient.insuranceProvider ? (
                              <Badge variant="outline">{patient.insuranceProvider}</Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">No insurance</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem 
                                  onClick={() => window.location.href = `/patients/${patient.id}`}
                                >
                                  <FileText className="h-4 w-4 mr-2" /> View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" /> Edit Patient
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete Patient
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="recent" className="pt-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Recently added patients will appear here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="scheduled" className="pt-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Patients scheduled for today will appear here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PatientListPage;