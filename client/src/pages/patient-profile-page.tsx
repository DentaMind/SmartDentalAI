import React, { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Patient, User } from "@shared/schema";
import { Sidebar } from "@/components/layout/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import { AlertCircle, AlertTriangle, Calendar, FileText, Stethoscope, X, AlarmClock, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Import our components for the tabs
import PatientNotes from "@/components/patients/notes/PatientNotesList";
import PerioChart from "@/components/perio/perio-chart";
import { RestorativeChart } from "@/components/dental/restorative-chart";
import { PatientXrays } from "@/components/patients/patient-xrays";
import PatientDiagnosisTreatmentHub from "@/components/patients/PatientDiagnosisTreatmentHub";
// Import the RecallScheduler component
import RecallScheduler from "@/components/patients/RecallScheduler";
import { PatientAppointments } from "@/components/patients/PatientAppointments";
import PatientEducationRecommendations from "@/components/patients/PatientEducationRecommendations";

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

// Helper for parsing JSON strings safely
function parseJsonSafely<T>(jsonString: string | null, defaultValue: T): T {
  if (!jsonString) return defaultValue;
  
  try {
    return JSON.parse(jsonString) as T;
  } catch (e) {
    console.error("Error parsing JSON:", e);
    return defaultValue;
  }
}

export default function PatientProfilePage() {
  const { toast } = useToast();
  const { id } = useParams<{ id: string }>();
  const patientId = parseInt(id);

  // Fetch the patient's data
  const { data: patient, isLoading, error: patientError } = useQuery<PatientWithUser>({
    queryKey: [`/api/patients/${patientId}`],
    enabled: !isNaN(patientId),
    retry: 2,
  });

  // Get appointments for the patient
  const { data: appointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}/appointments`],
    enabled: !isNaN(patientId) && !!patient,
  });

  // Get treatment plans for the patient
  const { data: treatmentPlans, isLoading: treatmentPlansLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}/treatment-plans`],
    enabled: !isNaN(patientId) && !!patient,
  });

  // Get medical notes for the patient
  const { data: medicalNotes, isLoading: medicalNotesLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}/medical-notes`],
    enabled: !isNaN(patientId) && !!patient,
  });

  // Get x-rays for the patient
  const { data: xrays, isLoading: xraysLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}/xrays`],
    enabled: !isNaN(patientId) && !!patient,
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

  if (patientError) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto py-12 max-w-7xl flex flex-col items-center justify-center h-full">
            <AlertCircle className="h-20 w-20 text-destructive" />
            <h1 className="text-2xl font-bold mt-4">Error Loading Patient</h1>
            <p className="mt-2 text-muted-foreground">
              There was an error loading the patient data. Please try again.
            </p>
            <Button className="mt-6" variant="default" onClick={() => window.history.back()}>
              Go Back
            </Button>
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

  // Parse medical history JSON if available
  const medicalHistoryObj = parseJsonSafely<{
    systemicConditions?: string[];
    medications?: string[];
    allergies?: string[];
    smoking?: boolean;
  }>(patient.medicalHistory, {});

  // Parse allergies JSON if available
  const allergiesList = parseJsonSafely<string[]>(patient.allergies, []);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto py-6 max-w-7xl">
          {/* Patient Overview Card */}
          <Card className="mb-6 shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#28C76F] flex items-center justify-center text-xl font-bold text-white">
                    {getInitials(`${patient.user?.firstName || ''} ${patient.user?.lastName || ''}`)}
                  </div>
                  <div>
                    <CardTitle className="text-2xl">
                      {patient.user?.firstName} {patient.user?.lastName}
                    </CardTitle>
                    <div className="flex gap-3 text-sm text-muted-foreground mt-1">
                      <span>DOB: {patient.user?.dateOfBirth || 'Not provided'}</span>
                      <span>•</span>
                      <span>Insurance: {patient.user?.insuranceProvider || 'Not provided'}</span>
                    </div>
                  </div>
                </div>
                
                {/* Alert badges */}
                <div className="flex flex-wrap gap-2">
                  {allergiesList.length > 0 && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Allergies</span>
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Contact</p>
                  <p>{patient.user?.phoneNumber || 'No phone'}</p>
                  <p>{patient.user?.email || 'No email'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Medical Alerts</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {allergiesList.map((allergy, i) => (
                      <Badge key={i} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        {allergy}
                      </Badge>
                    ))}
                    {allergiesList.length === 0 && <p>No known allergies</p>}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Visit</p>
                  <p>{patient.lastVisitDate || 'No recent visits'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Tabs */}
          <Tabs defaultValue="medical" className="mt-6">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 mb-6">
              <TabsTrigger value="medical">Medical History</TabsTrigger>
              <TabsTrigger value="dental">Dental Chart</TabsTrigger>
              <TabsTrigger value="perio">Perio Chart</TabsTrigger>
              <TabsTrigger value="xrays">X-Rays</TabsTrigger>
              <TabsTrigger value="diagnosis">AI Diagnosis</TabsTrigger>
              <TabsTrigger value="appointments">Appointments</TabsTrigger>
              <TabsTrigger value="recalls">Recalls</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="education">Education</TabsTrigger>
            </TabsList>

            {/* Medical History Tab */}
            <TabsContent value="medical">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5" />
                    Medical History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Systemic Conditions</h3>
                      <div className="flex flex-wrap gap-2">
                        {medicalHistoryObj.systemicConditions?.map((condition, i) => (
                          <Badge key={i} variant="outline">
                            {condition}
                          </Badge>
                        ))}
                        {(!medicalHistoryObj.systemicConditions || medicalHistoryObj.systemicConditions.length === 0) && 
                          <p className="text-muted-foreground">No systemic conditions reported</p>
                        }
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-2">Medications</h3>
                      <div className="flex flex-wrap gap-2">
                        {medicalHistoryObj.medications?.map((medication, i) => (
                          <Badge key={i} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {medication}
                          </Badge>
                        ))}
                        {(!medicalHistoryObj.medications || medicalHistoryObj.medications.length === 0) && 
                          <p className="text-muted-foreground">No medications reported</p>
                        }
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-2">Allergies</h3>
                      <div className="flex flex-wrap gap-2">
                        {allergiesList.map((allergy, i) => (
                          <Badge key={i} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            {allergy}
                          </Badge>
                        ))}
                        {allergiesList.length === 0 && 
                          <p className="text-muted-foreground">No allergies reported</p>
                        }
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-2">Social History</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <Badge variant={medicalHistoryObj.smoking ? "destructive" : "outline"}>
                            {medicalHistoryObj.smoking ? "Smoker" : "Non-smoker"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Dental Chart Tab */}
            <TabsContent value="dental">
              <Card>
                <CardHeader>
                  <CardTitle>Restorative Chart</CardTitle>
                </CardHeader>
                <CardContent>
                  <RestorativeChart patientId={patientId} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Perio Chart Tab */}
            <TabsContent value="perio">
              <Card>
                <CardHeader>
                  <CardTitle>Periodontal Chart</CardTitle>
                </CardHeader>
                <CardContent>
                  <PerioChart patientId={patientId} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* X-Rays Tab */}
            <TabsContent value="xrays">
              <Card>
                <CardHeader>
                  <CardTitle>X-Ray Gallery</CardTitle>
                </CardHeader>
                <CardContent>
                  {xraysLoading ? (
                    <div className="flex justify-center p-8">
                      <LoadingAnimation />
                    </div>
                  ) : (
                    <PatientXrays patientId={patientId} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Diagnosis Tab */}
            <TabsContent value="diagnosis">
              <Card>
                <CardHeader>
                  <CardTitle>AI Diagnosis & Treatment Plans</CardTitle>
                </CardHeader>
                <CardContent>
                  <PatientDiagnosisTreatmentHub 
                    patientId={patientId} 
                    patientName={`${patient.user?.firstName || ''} ${patient.user?.lastName || ''}`}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Appointments Tab */}
            <TabsContent value="appointments">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Appointments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {appointmentsLoading ? (
                    <div className="flex justify-center p-8">
                      <LoadingAnimation />
                    </div>
                  ) : (
                    appointments && appointments.length > 0 ? (
                      <div className="space-y-4">
                        {appointments.map((appointment, i) => (
                          <Card key={i} className="overflow-hidden border shadow-sm">
                            <div className="flex">
                              <div className={`w-2 bg-${getAppointmentStatusColor(appointment.status)}`}></div>
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium">
                                      {new Date(appointment.date).toLocaleDateString()} at {formatTime(appointment.date)}
                                    </p>
                                    <p className="text-sm text-muted-foreground">{appointment.notes || 'No description'}</p>
                                  </div>
                                  <Badge variant="outline">{capitalize(appointment.status)}</Badge>
                                </div>
                              </CardContent>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p>No appointments scheduled for this patient.</p>
                        <Button className="mt-4" variant="outline">Schedule Appointment</Button>
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Recalls Tab */}
            <TabsContent value="recalls">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                    <AlarmClock className="mr-2 h-5 w-5" />
                    Recall Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RecallScheduler patientId={patientId} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Financial Tab */}
            <TabsContent value="financial">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Insurance Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/20 rounded-md">
                        <div>
                          <p className="text-sm text-muted-foreground">Provider</p>
                          <p className="font-medium">{patient.user?.insuranceProvider || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Policy Number</p>
                          <p className="font-medium">{patient.user?.insuranceNumber || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Treatment Plans & Estimates</h3>
                      {treatmentPlansLoading ? (
                        <div className="flex justify-center p-8">
                          <LoadingAnimation />
                        </div>
                      ) : (
                        treatmentPlans && treatmentPlans.length > 0 ? (
                          <div className="space-y-4">
                            {treatmentPlans.map((plan, i) => (
                              <Card key={i} className="overflow-hidden border shadow-sm">
                                <CardContent className="p-4">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-medium">
                                        {plan.diagnosis || 'Untitled Treatment Plan'}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {new Date(plan.createdAt).toLocaleDateString()}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-bold">${plan.cost || 0}</p>
                                      <Badge variant="outline">{capitalize(plan.status)}</Badge>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <p>No treatment plans or estimates available.</p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Patient Notes Tab */}
            <TabsContent value="notes">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Patient Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PatientNotes 
                    patientId={patientId} 
                    patientName={patient?.user?.firstName && patient?.user?.lastName ? 
                      `${patient.user.firstName} ${patient.user.lastName}` : undefined} 
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Educational Content Tab */}
            <TabsContent value="education">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                    <BookOpen className="mr-2 h-5 w-5" />
                    Educational Resources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PatientEducationRecommendations patientId={patientId} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

// Helper functions
function getAppointmentStatusColor(status: string): string {
  switch (status) {
    case 'scheduled': return 'blue-500';
    case 'confirmed': return 'green-500';
    case 'completed': return 'gray-500';
    case 'cancelled': return 'red-500';
    default: return 'gray-500';
  }
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}