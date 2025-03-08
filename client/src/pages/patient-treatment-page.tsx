import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { usePatientById } from "@/hooks/use-patient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  AlertCircle, 
  BellRing, 
  Brain, 
  Calendar, 
  Camera, 
  ChevronLeft, 
  ClipboardList, 
  Clock, 
  FileText, 
  Languages, 
  Pencil, 
  Pill, 
  Save, 
  Stethoscope, 
  Tooth, 
  UserCog, 
  X 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Import patient-specific components
import { PatientHealthAlerts } from "@/components/patients/patient-health-alerts";
import { PatientNotes } from "@/components/patients/patient-notes";
import { PatientIntakeForm } from "@/components/patients/patient-intake-form";
import { MultilingualInterpreter } from "@/components/patients/multilingual-interpreter";
import { ProviderSignOff } from "@/components/patients/provider-sign-off";

// Helper function to get initials from name
const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

// Define treatment page sections
const sections = [
  { id: "health-alerts", label: "Health Alerts", icon: <AlertCircle className="h-4 w-4" /> },
  { id: "notes", label: "Patient Notes", icon: <FileText className="h-4 w-4" /> },
  { id: "treatment-plan", label: "Treatment Plan", icon: <ClipboardList className="h-4 w-4" /> },
  { id: "x-rays", label: "X-rays & Scans", icon: <Camera className="h-4 w-4" /> },
  { id: "medications", label: "Medications", icon: <Pill className="h-4 w-4" /> },
  { id: "appointments", label: "Appointments", icon: <Calendar className="h-4 w-4" /> },
];

export default function PatientTreatmentPage() {
  const params = useParams();
  const patientId = parseInt(params.id || "0");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [activeTab, setActiveTab] = useState("health-alerts");
  const [hasChanges, setHasChanges] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [showSignOffModal, setShowSignOffModal] = useState(false);
  
  // Fetch patient data
  const { data: patient, isLoading } = usePatientById(patientId);
  
  // When component is about to unmount (user navigating away)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        // Standard way to show confirmation dialog before page unload
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasChanges]);
  
  // Handle back navigation with confirmation if there are changes
  const handleBackNavigation = () => {
    if (hasChanges) {
      setIsExiting(true);
      setShowSignOffModal(true);
    } else {
      // No changes, navigate back directly
      navigate("/patients");
    }
  };
  
  // Handle successful sign-off
  const handleSignOffSuccess = () => {
    setHasChanges(false);
    setShowSignOffModal(false);
    
    // If exiting, navigate back
    if (isExiting) {
      toast({
        title: "Changes saved",
        description: "Your changes have been successfully saved and signed off",
        variant: "default",
      });
      
      setTimeout(() => {
        navigate("/patients");
      }, 500);
    }
  };
  
  // Handling when changes are made to patient record
  const handleChanges = () => {
    setHasChanges(true);
  };
  
  // Track changes in patient notes
  const handleNotesChange = () => {
    handleChanges();
  };

  // Handle saving changes without exiting
  const handleSaveChanges = () => {
    setShowSignOffModal(true);
  };
  
  // Fallback if patient isn't found
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-4">
          <X className="h-10 w-10 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Patient Not Found</h1>
        <p className="text-muted-foreground mb-4">The patient you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button onClick={() => navigate("/patients")}>
          Back to Patients
        </Button>
      </div>
    );
  }
  
  // Combine first and last name
  const patientName = `${patient.firstName} ${patient.lastName}`;
  
  return (
    <div className="container mx-auto py-6 max-w-7xl">
      {/* Provider Sign-Off Modal */}
      <ProviderSignOff
        open={showSignOffModal}
        onClose={() => setShowSignOffModal(false)}
        onSuccess={handleSignOffSuccess}
        patientId={patientId}
        patientName={patientName}
        hasChanges={hasChanges}
      />
      
      {/* Header with Patient Info and Actions */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleBackNavigation}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={patient.profileImage} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(patientName)}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h1 className="text-2xl font-bold">{patientName}</h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                {patient.dateOfBirth && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {new Date(patient.dateOfBirth).toLocaleDateString()} 
                      ({Math.floor((new Date().getTime() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} y/o)
                    </span>
                  </div>
                )}
                {patient.insuranceProvider && (
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    <span>{patient.insuranceProvider}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <MultilingualInterpreter 
            patientId={patientId}
            patientPreferredLanguage="english"
          />
          
          {hasChanges && (
            <Button 
              onClick={handleSaveChanges}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save & Sign Off
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Sidebar - Quick Access Panel */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Quick Access</CardTitle>
            <CardDescription>Common actions and information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Start X-Ray/Scan Actions */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Imaging</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="flex flex-col items-center justify-center h-20 gap-2 text-xs">
                  <Camera className="h-4 w-4" />
                  Start X-Ray
                </Button>
                <Button variant="outline" size="sm" className="flex flex-col items-center justify-center h-20 gap-2 text-xs">
                  <Tooth className="h-4 w-4" />
                  Intraoral Scan
                </Button>
              </div>
            </div>
            
            <Separator />
            
            {/* Patient Info Summary */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Patient Info</h3>
              <Card className="bg-muted/50">
                <CardContent className="p-3 space-y-2 text-xs">
                  <div className="grid grid-cols-2">
                    <div className="font-medium">Phone:</div>
                    <div>{patient.phoneNumber || "N/A"}</div>
                  </div>
                  <div className="grid grid-cols-2">
                    <div className="font-medium">Email:</div>
                    <div className="truncate">{patient.email || "N/A"}</div>
                  </div>
                  <div className="grid grid-cols-2">
                    <div className="font-medium">Insurance:</div>
                    <div>{patient.insuranceProvider || "N/A"}</div>
                  </div>
                  {patient.insuranceNumber && (
                    <div className="grid grid-cols-2">
                      <div className="font-medium">Policy #:</div>
                      <div>{patient.insuranceNumber}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <Separator />
            
            {/* Recent Activity */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Recent Activity</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 rounded-md border border-dashed">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <div className="text-xs">
                    <div className="font-medium">Last Visit</div>
                    <div className="text-muted-foreground">2 weeks ago</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-md border border-dashed">
                  <Tooth className="h-4 w-4 text-green-500" />
                  <div className="text-xs">
                    <div className="font-medium">Last Procedure</div>
                    <div className="text-muted-foreground">Dental Cleaning</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-md border border-dashed">
                  <Stethoscope className="h-4 w-4 text-purple-500" />
                  <div className="text-xs">
                    <div className="font-medium">Next Appointment</div>
                    <div className="text-muted-foreground">Mar 15, 2025</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Care Team */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Care Team</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[10px]">DJ</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">Dr. Jane Smith</div>
                    <div className="text-muted-foreground">Primary Dentist</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[10px]">BT</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">Bob Thompson</div>
                    <div className="text-muted-foreground">Dental Hygienist</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Main Content Area */}
        <div className="md:col-span-3 space-y-6">
          {/* Alert Banners */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 p-3 rounded-md bg-amber-50 border border-amber-200">
              <div className="flex-shrink-0">
                <BellRing className="h-5 w-5 text-amber-500" />
              </div>
              <div className="flex-grow">
                <h3 className="font-medium text-amber-800">Patient Reminder</h3>
                <p className="text-sm text-amber-700">Annual x-rays are due this visit</p>
              </div>
              <Button variant="ghost" size="sm" className="text-amber-700">
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-md bg-blue-50 border border-blue-200">
              <div className="flex-shrink-0">
                <UserCog className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-grow">
                <h3 className="font-medium text-blue-800">Insurance Verification</h3>
                <p className="text-sm text-blue-700">Insurance benefits have been verified for today's visit</p>
              </div>
              <Button variant="ghost" size="sm" className="text-blue-700">
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-md bg-violet-50 border border-violet-200">
              <div className="flex-shrink-0">
                <Brain className="h-5 w-5 text-violet-500" />
              </div>
              <div className="flex-grow">
                <h3 className="font-medium text-violet-800">AI-Powered Assistant</h3>
                <p className="text-sm text-violet-700">
                  AI has analyzed this patient's records and has insights to share
                </p>
              </div>
              <Button variant="outline" size="sm" className="bg-violet-100 text-violet-700 border-violet-300">
                View Insights
              </Button>
            </div>
          </div>
          
          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 md:grid-cols-6">
              {sections.map((section) => (
                <TabsTrigger key={section.id} value={section.id} className="gap-2">
                  {section.icon}
                  <span className="hidden sm:inline">{section.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            
            {/* Health Alerts Tab */}
            <TabsContent value="health-alerts" className="pt-6">
              <PatientHealthAlerts patient={patient} />
            </TabsContent>
            
            {/* Patient Notes Tab */}
            <TabsContent value="notes" className="pt-6">
              <PatientNotes patientId={patientId} />
            </TabsContent>
            
            {/* Treatment Plan Tab */}
            <TabsContent value="treatment-plan" className="pt-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Treatment Plan</h2>
                  <p className="text-muted-foreground">Manage and view treatment plans</p>
                </div>
                <Button className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Create Treatment Plan
                </Button>
              </div>
              
              <div className="p-16 text-center bg-muted/30 border border-dashed rounded-lg">
                <h3 className="text-lg font-medium mb-2">No Active Treatment Plans</h3>
                <p className="text-muted-foreground mb-4">
                  This patient doesn't have any active treatment plans. Create a new treatment plan to get started.
                </p>
                <Button>
                  Create Treatment Plan
                </Button>
              </div>
            </TabsContent>
            
            {/* X-Rays & Scans Tab */}
            <TabsContent value="x-rays" className="pt-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold">X-Rays & Scans</h2>
                  <p className="text-muted-foreground">View and manage patient imaging</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="gap-2">
                    <Camera className="h-4 w-4" />
                    Start X-Ray
                  </Button>
                  <Button className="gap-2">
                    <Tooth className="h-4 w-4" />
                    Start Intraoral Scan
                  </Button>
                </div>
              </div>
              
              <div className="p-16 text-center bg-muted/30 border border-dashed rounded-lg">
                <h3 className="text-lg font-medium mb-2">No X-Rays or Scans</h3>
                <p className="text-muted-foreground mb-4">
                  This patient doesn't have any x-rays or intraoral scans in their record.
                </p>
                <div className="flex justify-center gap-4">
                  <Button variant="outline">
                    Upload Images
                  </Button>
                  <Button>
                    Start Imaging
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            {/* Medications Tab */}
            <TabsContent value="medications" className="pt-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Medications</h2>
                  <p className="text-muted-foreground">View and manage patient medications</p>
                </div>
                <Button className="gap-2">
                  <Pill className="h-4 w-4" />
                  Add Medication
                </Button>
              </div>
              
              <div className="p-16 text-center bg-muted/30 border border-dashed rounded-lg">
                <h3 className="text-lg font-medium mb-2">No Medications</h3>
                <p className="text-muted-foreground mb-4">
                  This patient doesn't have any medications in their record.
                </p>
                <Button>
                  Add Medication
                </Button>
              </div>
            </TabsContent>
            
            {/* Appointments Tab */}
            <TabsContent value="appointments" className="pt-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Appointments</h2>
                  <p className="text-muted-foreground">View and manage patient appointments</p>
                </div>
                <Button className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Schedule Appointment
                </Button>
              </div>
              
              <div className="p-16 text-center bg-muted/30 border border-dashed rounded-lg">
                <h3 className="text-lg font-medium mb-2">No Upcoming Appointments</h3>
                <p className="text-muted-foreground mb-4">
                  This patient doesn't have any upcoming appointments scheduled.
                </p>
                <Button>
                  Schedule Appointment
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}