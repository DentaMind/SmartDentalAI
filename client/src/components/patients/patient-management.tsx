import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, FileText, UserPlus, Trash2, Edit, MoreVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePatient, Patient } from "../../hooks/use-patient";
import { DataTable } from "../ui/data-table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { ImprovedAddPatientForm } from "./improved-add-patient-form";
import { useQuery } from "@tanstack/react-query";

export function PatientManagement() {
  const { patients, loading } = usePatient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);

  // Process patient data to ensure correct structure
  const processedPatients = patients?.map(patient => {
    // Use user data if patient data is null
    const firstName = patient.firstName || (patient.user?.firstName || "Unknown");
    const lastName = patient.lastName || (patient.user?.lastName || "Patient");
    const email = patient.email || (patient.user?.email || "");
    const phoneNumber = patient.phoneNumber || (patient.user?.phoneNumber || "");
    
    // Parse allergies if they're stored as a JSON string
    let allergies = [];
    if (patient.allergies) {
      try {
        if (typeof patient.allergies === 'string' && patient.allergies.startsWith('[')) {
          allergies = JSON.parse(patient.allergies);
        } else if (typeof patient.allergies === 'string') {
          allergies = patient.allergies.split(',').map(a => a.trim());
        } else if (Array.isArray(patient.allergies)) {
          allergies = patient.allergies;
        }
      } catch (e) {
        console.error("Error parsing allergies for patient:", patient.id, e);
        allergies = [];
      }
    }
    
    // Parse medical history if stored as JSON string
    let medicalHistory = {};
    if (patient.medicalHistory) {
      try {
        if (typeof patient.medicalHistory === 'string') {
          medicalHistory = JSON.parse(patient.medicalHistory);
        } else if (typeof patient.medicalHistory === 'object') {
          medicalHistory = patient.medicalHistory;
        }
      } catch (e) {
        console.error("Error parsing medical history for patient:", patient.id, e);
        medicalHistory = {};
      }
    }
    
    return {
      ...patient,
      firstName,
      lastName,
      email,
      phoneNumber,
      allergies,
      medicalHistory
    };
  }) || [];
  
  // Filter patients based on search term
  const filteredPatients = processedPatients.filter(patient => {
    const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || 
           (patient.email && patient.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
           (patient.phoneNumber && patient.phoneNumber.includes(searchTerm));
  });

  const columns = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }: any) => {
        const patient = row.original;
        return (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
              {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
            </div>
            <div>
              <p className="font-medium">{patient.firstName} {patient.lastName}</p>
              <p className="text-xs text-muted-foreground">{patient.email}</p>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: "dateOfBirth",
      header: "Date of Birth",
      cell: ({ row }: any) => {
        const date = row.original.dateOfBirth;
        return date ? formatDate(date) : "N/A";
      }
    },
    {
      accessorKey: "phoneNumber",
      header: "Phone Number",
      cell: ({ row }: any) => row.original.phoneNumber || "N/A"
    },
    {
      accessorKey: "insuranceProvider",
      header: "Insurance",
      cell: ({ row }: any) => {
        const insurance = row.original.insuranceProvider;
        return insurance ? (
          <Badge variant="outline">{insurance}</Badge>
        ) : (
          <span className="text-muted-foreground text-xs">No insurance</span>
        );
      }
    },
    {
      id: "actions",
      cell: ({ row }: any) => {
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={() => window.location.href = `/patients/${row.original.id}`}
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
          </div>
        );
      }
    }
  ];

  const handleAddPatientSuccess = () => {
    setIsAddPatientOpen(false);
  };

  return (
    <div className="space-y-4">
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
          
          <Dialog open={isAddPatientOpen} onOpenChange={setIsAddPatientOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Patient
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Patient</DialogTitle>
                <DialogDescription>
                  Enter the patient's information to create a new patient record
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <ImprovedAddPatientForm onSuccess={handleAddPatientSuccess} />
              </div>
            </DialogContent>
          </Dialog>
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
                <div className="flex items-center justify-center h-64">
                  <p className="text-muted-foreground">Loading patients...</p>
                </div>
              ) : filteredPatients?.length === 0 ? (
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
                  <Button onClick={() => setIsAddPatientOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Patient
                  </Button>
                </div>
              ) : (
                <DataTable
                  columns={columns}
                  data={filteredPatients || []}
                  searchKey="name"
                />
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
}