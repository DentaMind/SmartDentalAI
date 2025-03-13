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
          <PageHeader 
            title={`${patient.user.firstName} ${patient.user.lastName}`} 
            description="Patient Profile"
            icon={<Stethoscope className="h-10 w-10" />}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            {/* Patient Info Card */}
            <Card className="md:col-span-1 bg-card shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserRound className="h-5 w-5 text-primary" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="w-24 h-24 mx-auto rounded-full bg-primary flex items-center justify-center text-3xl font-bold text-primary-foreground">
                  {getInitials(`${patient.user.firstName} ${patient.user.lastName}`)}
                </div>
                
                <div className="space-y-3 pt-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                    <p>{patient.user.dateOfBirth || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <p>{patient.user.phoneNumber || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p>{patient.user.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Address</p>
                    <p className="break-words">{patient.homeAddress || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Insurance</p>
                    <p>{patient.insuranceProvider || 'Not provided'}</p>
                    {patient.insuranceNumber && <p className="text-sm text-muted-foreground">Policy: {patient.insuranceNumber}</p>}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Emergency Contact</p>
                    <p>{patient.emergencyContactName || 'Not provided'}</p>
                    {patient.emergencyContactPhone && (
                      <p className="text-sm text-muted-foreground">
                        {patient.emergencyContactPhone} ({patient.emergencyContactRelationship || 'Contact'})
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main Content Area */}
            <div className="md:col-span-3 space-y-6">
              {/* Medical Alerts */}
              {(patient.allergies || patient.adverseAnestheticReaction) && (
                <Card className="bg-card border-destructive/20 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                      <BadgeAlert className="h-5 w-5" />
                      Medical Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {patient.allergies && (
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-5 w-5 mt-0.5 text-destructive" />
                          <div>
                            <p className="font-medium">Allergies</p>
                            <p className="text-sm text-muted-foreground">{patient.allergies}</p>
                          </div>
                        </div>
                      )}
                      {patient.adverseAnestheticReaction && (
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
                  </CardContent>
                </Card>
              )}

              {/* Tabs for different sections */}
              <Tabs defaultValue="medical-history" className="w-full">
                <TabsList className="grid grid-cols-6 mb-6">
                  <TabsTrigger value="medical-history">Medical History</TabsTrigger>
                  <TabsTrigger value="dental-chart">Dental Chart</TabsTrigger>
                  <TabsTrigger value="perio-chart">Perio Chart</TabsTrigger>
                  <TabsTrigger value="appointments">Appointments</TabsTrigger>
                  <TabsTrigger value="treatment-plans">Treatment Plans</TabsTrigger>
                  <TabsTrigger value="notes">Medical Notes</TabsTrigger>
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