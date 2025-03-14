import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Patient, User } from "@shared/schema";
import { Sidebar } from "@/components/layout/sidebar";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  AlertCircle,
  Calendar,
  FileText,
  PenTool,
  UserRound,
  BadgeAlert,
  Stethoscope,
  Scissors,
  LineChart,
  Heart,
} from "lucide-react";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import { PageHeader } from "@/components/layout/page-header";
import { queryClient } from "@/lib/queryClient";

// Import our dental chart components
import DentalChart from "@/components/dental/dental-chart";
import PerioChart from "@/components/perio/perio-chart";
import EnhancedDentalChart from "@/components/dental/enhanced-dental-chart";
import { ClinicalPerioChart } from "@/components/perio/clinical-perio-chart";
import { RestorativeChart } from "@/components/dental/restorative-chart";
import EnhancedPerioChart from "@/components/perio/enhanced-perio-chart";
import { PatientMedicalHistory } from "@/components/patients/patient-medical-history";
import { ASAClassificationCard, type ASAClassification } from "@/components/medical/asa-classification";
import { ChatHelper } from "@/components/ui/chat-helper";
import { useAuth } from "@/hooks/use-auth";

// Define the full patient type including user data
type PatientWithUser = Patient & {
  user: User;
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
}

export default function PatientProfilePage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { id } = useParams<{ id: string }>();
  const patientId = parseInt(id);
  const [asaClass, setAsaClass] = useState<ASAClassification>('II');
  const [emergencyStatus, setEmergencyStatus] = useState(false);

  // Fetch the patient's data
  const { data: patient, isLoading } = useQuery<PatientWithUser>({
    queryKey: [`/api/patients/${patientId}`],
    enabled: !isNaN(patientId),
  });

  // Get appointments for the patient
  const { data: appointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}/appointments`],
    enabled: !isNaN(patientId),
  });

  // Get treatment plans for the patient
  const { data: treatmentPlans, isLoading: treatmentPlansLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}/treatment-plans`],
    enabled: !isNaN(patientId),
  });

  // Get medical notes for the patient
  const { data: medicalNotes, isLoading: medicalNotesLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}/medical-notes`],
    enabled: !isNaN(patientId),
  });

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto py-12 max-w-7xl flex flex-col items-center justify-center h-full">
            <LoadingAnimation />
            <p className="mt-4 text-muted-foreground">Loading patient profile...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto py-12 max-w-7xl flex flex-col items-center justify-center h-full">
            <AlertCircle className="h-20 w-20 text-destructive" />
            <h1 className="text-2xl font-bold mt-4">Patient Not Found</h1>
            <p className="mt-2 text-muted-foreground">
              The patient you are looking for does not exist or you don't have permission to view it.
            </p>
            <Button className="mt-6" variant="default" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto py-6 max-w-7xl">
          <div className="flex justify-between items-center">
            <PageHeader 
              title="DentaMind" 
              description="Advanced Dental AI"
              icon={<Stethoscope className="h-10 w-10" />}
            />
            
            {/* Patient Info Card - Compact version at the top */}
            <Card className="w-auto shadow-sm">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-xl font-bold text-primary-foreground">
                    {getInitials(`${patient.user.firstName} ${patient.user.lastName}`)}
                  </div>
                  <div>
                    <CardTitle>{`${patient.user.firstName} ${patient.user.lastName}`}</CardTitle>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>{patient.user.dateOfBirth || 'No DOB'}</span>
                      <span>•</span>
                      <span>{patient.insuranceProvider || 'No insurance'}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex gap-4 text-sm">
                  {patient.user.phoneNumber && <span>{patient.user.phoneNumber}</span>}
                  {patient.user.email && <span>{patient.user.email}</span>}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Chat Helper */}
          <ChatHelper />
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">{/* Patient detailed info will now be in a dropdown or expandable section */}

            {/* Main Content Area */}
            <div className="md:col-span-3 space-y-6">
              {/* Medical Alerts */}
              <Card className="bg-card border-destructive/20 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                    <BadgeAlert className="h-5 w-5" />
                    Medical Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* ASA Classification */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Heart className="h-5 w-5 text-rose-500" />
                        <h3 className="font-medium">ASA Physical Status Classification</h3>
                      </div>
                      <div className="flex gap-2 mb-2">
                        {['I', 'II', 'III', 'IV', 'V'].map((cls) => (
                          <Button 
                            key={cls}
                            variant={asaClass === cls ? "default" : "outline"}
                            size="sm"
                            onClick={() => setAsaClass(cls as ASAClassification)}
                            className="min-w-12"
                          >
                            {cls}
                          </Button>
                        ))}
                        <Button 
                          variant={emergencyStatus ? "destructive" : "outline"} 
                          size="sm"
                          onClick={() => setEmergencyStatus(!emergencyStatus)}
                          className="ml-2"
                        >
                          E
                        </Button>
                      </div>
                      <ASAClassificationCard asaClass={asaClass} emergencyStatus={emergencyStatus} />
                    </div>
                    
                    <div className="space-y-2 mt-4 pt-4 border-t">
                      {patient?.allergies && (
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-5 w-5 mt-0.5 text-destructive" />
                          <div>
                            <p className="font-medium">Allergies</p>
                            <p className="text-sm text-muted-foreground">{patient.allergies}</p>
                          </div>
                        </div>
                      )}
                      {patient?.adverseAnestheticReaction && (
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-5 w-5 mt-0.5 text-destructive" />
                          <div>
                            <p className="font-medium">Adverse Anesthetic Reaction</p>
                            <p className="text-sm text-muted-foreground">
                              Patient has reported adverse reactions to anesthetics
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs for different sections */}
              <Tabs defaultValue="medical-history" className="w-full">
                <TabsList className="grid grid-cols-7 mb-6">
                  <TabsTrigger value="medical-history">Medical History</TabsTrigger>
                  <TabsTrigger value="dental-chart">Dental Chart</TabsTrigger>
                  <TabsTrigger value="perio-chart">Perio Chart</TabsTrigger>
                  <TabsTrigger value="xray">X-rays</TabsTrigger>
                  <TabsTrigger value="appointments">Appointments</TabsTrigger>
                  <TabsTrigger value="treatment-plans">Treatment Plans</TabsTrigger>
                  <TabsTrigger value="notes">Clinical Notes</TabsTrigger>
                </TabsList>

                {/* Medical History Tab */}
                <TabsContent value="medical-history">
                  <PatientMedicalHistory 
                    patientId={patientId}
                    patientName={`${patient.user.firstName} ${patient.user.lastName}`}
                    readOnly={false}
                    onSave={(data) => {
                      console.log("Medical history saved:", data);
                      // In a real app, this would save the data to the API
                      // For now, we'll just log it to the console
                    }}
                  />
                </TabsContent>
                
                {/* Dental Chart Tab */}
                <TabsContent value="dental-chart">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Scissors className="h-5 w-5 text-primary" />
                        Dental Chart
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <DentalChart 
                        patientId={patientId}
                        readOnly={false}
                        onSave={(data) => {
                          console.log('Dental chart saved:', data);
                          // In a real app, you would call an API to save this data
                        }}
                      />
                      
                      <div className="mt-4">
                        <h3 className="text-lg font-medium mb-4">Restorative Chart (Occlusal View)</h3>
                        <RestorativeChart 
                          patientId={patientId}
                          patientName={`${patient.user.firstName} ${patient.user.lastName}`}
                          readOnly={false}
                          onSave={(data) => {
                            console.log('Restorative chart saved:', data);
                            toast({
                              title: "Restorative Chart Saved",
                              description: "Chart data has been saved successfully",
                              variant: "default"
                            });
                          }}
                        />
                      </div>
                      
                      <div className="mt-4">
                        <h3 className="text-lg font-medium mb-4">Enhanced Dental Chart</h3>
                        <EnhancedDentalChart 
                          patientId={patientId}
                          readOnly={false}
                          onSave={(data) => {
                            console.log('Enhanced dental chart saved:', data);
                            // In a real app, you would call an API to save this data
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Perio Chart Tab */}
                <TabsContent value="perio-chart">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <LineChart className="h-5 w-5 text-primary" />
                        Periodontal Chart
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <PerioChart 
                        patientId={patientId}
                        readOnly={false}
                        onSave={(data) => {
                          console.log('Perio chart saved:', data);
                          // In a real app, you would call an API to save this data
                        }}
                      />
                      
                      <div className="mt-4">
                        <h3 className="text-lg font-medium mb-4">Clinical Periodontal Chart</h3>
                        <ClinicalPerioChart 
                          patientId={patientId}
                          patientName={`${patient.user.firstName} ${patient.user.lastName}`}
                          readOnly={false}
                          onSave={(data) => {
                            console.log('Clinical perio chart saved:', data);
                            toast({
                              title: "Periodontal Chart Saved",
                              description: "Chart data has been saved successfully",
                              variant: "default"
                            });
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* X-Ray Tab */}
                <TabsContent value="xray">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-primary" />
                        X-ray Images
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* AI X-ray Analysis Section */}
                        <div className="mb-6 border rounded-lg p-4 bg-card">
                          <h3 className="text-lg font-medium mb-4">AI X-ray Analysis</h3>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <div className="aspect-video bg-muted rounded-md relative overflow-hidden flex items-center justify-center">
                                {/* Placeholder for X-ray image */}
                                <p className="text-muted-foreground">No x-ray selected</p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Button variant="outline" size="sm">Upload New X-ray</Button>
                                <Button variant="outline" size="sm">Capture from Sensor</Button>
                                <Button variant="outline" size="sm">Import from PACS</Button>
                              </div>
                            </div>
                            <div className="space-y-4">
                              <div className="p-4 border rounded-md bg-background">
                                <h4 className="font-medium text-sm mb-2">AI Diagnostic Findings</h4>
                                <div className="space-y-2">
                                  <p className="text-sm text-muted-foreground">Select an x-ray image to analyze or upload a new one.</p>
                                </div>
                              </div>
                              <div className="p-4 border rounded-md bg-background">
                                <h4 className="font-medium text-sm mb-2">AI Recommendations</h4>
                                <div className="space-y-2">
                                  <p className="text-sm text-muted-foreground">AI will provide treatment recommendations based on x-ray analysis.</p>
                                </div>
                              </div>
                              <Button className="w-full">
                                Analyze with AI
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {/* X-ray History */}
                        <div>
                          <h3 className="text-lg font-medium mb-4">X-ray History</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {/* Sample x-ray cards */}
                            <Card className="overflow-hidden">
                              <div className="aspect-video bg-muted relative">
                                {/* X-ray image would go here */}
                              </div>
                              <CardContent className="p-3">
                                <div className="text-sm font-medium">Full Mouth Series</div>
                                <div className="text-xs text-muted-foreground">Taken: 12/15/2024</div>
                              </CardContent>
                            </Card>
                            <Card className="overflow-hidden">
                              <div className="aspect-video bg-muted relative">
                                {/* X-ray image would go here */}
                              </div>
                              <CardContent className="p-3">
                                <div className="text-sm font-medium">Panoramic</div>
                                <div className="text-xs text-muted-foreground">Taken: 11/03/2024</div>
                              </CardContent>
                            </Card>
                            <Card className="overflow-hidden">
                              <div className="aspect-video bg-muted relative">
                                {/* X-ray image would go here */}
                              </div>
                              <CardContent className="p-3">
                                <div className="text-sm font-medium">Bitewings</div>
                                <div className="text-xs text-muted-foreground">Taken: 09/22/2024</div>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Appointments Tab */}
                <TabsContent value="appointments">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        Appointments History
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {appointmentsLoading ? (
                        <div className="flex justify-center py-8">
                          <LoadingAnimation />
                        </div>
                      ) : appointments && Array.isArray(appointments) && appointments.length > 0 ? (
                        <div className="space-y-4">
                          {appointments.map((appointment: any) => (
                            <div key={appointment.id} className="border rounded-md p-4">
                              <div className="flex items-center justify-between">
                                <div className="font-medium">{new Date(appointment.date).toLocaleDateString()}</div>
                                <div className={`px-2 py-1 rounded text-xs ${
                                  appointment.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                  appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                                  appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' : 
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                </div>
                              </div>
                              <div className="text-sm text-muted-foreground mt-2">
                                {new Date(appointment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              {appointment.notes && (
                                <div className="mt-2 text-sm">
                                  <p className="font-medium">Notes:</p>
                                  <p className="text-muted-foreground">{appointment.notes}</p>
                                </div>
                              )}
                              <div className="mt-2 text-sm">
                                <span className={appointment.isOnline ? 'text-primary' : 'text-muted-foreground'}>
                                  {appointment.isOnline ? 'Online Appointment' : 'In-office Appointment'}
                                </span>
                                {appointment.insuranceVerified && (
                                  <span className="ml-4 text-green-600">Insurance Verified</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
                          <p className="mt-4 text-muted-foreground">No appointments found for this patient.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Treatment Plans Tab */}
                <TabsContent value="treatment-plans">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PenTool className="h-5 w-5 text-primary" />
                        Treatment Plans
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {treatmentPlansLoading ? (
                        <div className="flex justify-center py-8">
                          <LoadingAnimation />
                        </div>
                      ) : treatmentPlans && Array.isArray(treatmentPlans) && treatmentPlans.length > 0 ? (
                        <div className="space-y-4">
                          {treatmentPlans.map((plan: any) => (
                            <div key={plan.id} className="border rounded-md p-4">
                              <div className="flex items-center justify-between">
                                <div className="font-medium">{plan.diagnosis}</div>
                                <div className={`px-2 py-1 rounded text-xs ${
                                  plan.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                  plan.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                                  plan.status === 'accepted' ? 'bg-blue-100 text-blue-800' : 
                                  plan.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-purple-100 text-purple-800'
                                }`}>
                                  {plan.status.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                </div>
                              </div>
                              <div className="mt-2 text-sm">
                                <div className="font-medium">Cost Information:</div>
                                <div className="grid grid-cols-3 gap-2 mt-1">
                                  <div>
                                    <p className="text-muted-foreground">Total Cost</p>
                                    <p>${plan.cost}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Insurance Coverage</p>
                                    <p>${plan.insuranceCoverage || 0}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Patient Responsibility</p>
                                    <p>${plan.patientResponsibility || plan.cost}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="mt-3 text-sm">
                                <div className="font-medium">Procedures:</div>
                                <ul className="list-disc list-inside mt-1 text-muted-foreground">
                                  {plan.procedures && Array.isArray(plan.procedures) && plan.procedures.map((procedure: any, i: number) => (
                                    <li key={i}>{procedure.name}</li>
                                  ))}
                                </ul>
                              </div>
                              <div className="mt-2 text-xs text-muted-foreground">
                                Created: {new Date(plan.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <PenTool className="h-12 w-12 mx-auto text-muted-foreground" />
                          <p className="mt-4 text-muted-foreground">No treatment plans found for this patient.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Medical Notes Tab */}
                <TabsContent value="notes">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Medical Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {medicalNotesLoading ? (
                        <div className="flex justify-center py-8">
                          <LoadingAnimation />
                        </div>
                      ) : medicalNotes && Array.isArray(medicalNotes) && medicalNotes.length > 0 ? (
                        <div className="space-y-4">
                          {medicalNotes.map((note: any) => (
                            <div key={note.id} className="border rounded-md p-4">
                              <div className="flex items-center justify-between">
                                <div className="font-medium">
                                  {note.createdAt 
                                    ? new Date(note.createdAt).toLocaleDateString() 
                                    : 'No date'}
                                </div>
                                {note.private && (
                                  <div className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                                    Private
                                  </div>
                                )}
                              </div>
                              <div className="mt-3 whitespace-pre-wrap">
                                {note.content}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                          <p className="mt-4 text-muted-foreground">No medical notes found for this patient.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}