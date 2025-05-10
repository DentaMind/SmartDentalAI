import { useState, useEffect } from "react";
import { usePatient } from "@/hooks/use-patient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, UserPlus, FileText, Edit, MoreVertical, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Main patients page component
 * Directly handles patient data rendering - bypassing the PatientManagement component to fix JSON display issues
 */
const PatientsPage = () => {
  const { patients, loading, error } = usePatient();
  const [searchTerm, setSearchTerm] = useState("");
  
  useEffect(() => {
    // Log patient data for debugging
    if (patients && patients.length > 0) {
      console.log("PATIENTS ROUTE DATA:", patients);
    }
    
    if (error) {
      console.error("Error loading patients:", error);
    }
  }, [patients, error]);
  
  // Process patients to ensure all required fields exist
  const processedPatients = patients?.map(patient => {
    // Extract and parse allergies from JSON string
    let allergiesArray = [];
    try {
      if (patient.allergies && typeof patient.allergies === 'string' && patient.allergies.startsWith('[')) {
        allergiesArray = JSON.parse(patient.allergies);
      }
    } catch (e) {
      console.error("Failed to parse allergies:", e);
    }
    
    // Extract and parse medical history from JSON string
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
  
  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Patients</h2>
          <p className="text-muted-foreground">Manage your patient records</p>
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
          
          <Button>
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
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Patient
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
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
                          <TableCell>{patient.dateOfBirth || "N/A"}</TableCell>
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

export default PatientsPage;