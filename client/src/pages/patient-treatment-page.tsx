import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { Patient, User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Sidebar } from "@/components/layout/sidebar";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Brain, FileText, FilePlus, Heart, History, Mic, Save, Stethoscope, Timer, Wand, X, XCircle } from "lucide-react";
import { MedicalHistoryPanel } from "@/components/medical/medical-history-panel";
import { PatientXrays } from "@/components/patients/patient-xrays";
import { PatientTreatmentPlan } from "@/components/patients/patient-treatment-plan";
import { PatientHealthAlerts } from "@/components/patients/patient-health-alerts";
import { PatientNotes } from "@/components/patients/patient-notes";
import { PatientIntakeForm } from "@/components/patients/patient-intake-form";

export default function PatientTreatmentPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { patientId } = useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [appointmentTimer, setAppointmentTimer] = useState(0);
  const [appointmentRunning, setAppointmentRunning] = useState(false);

  // Load patient information
  const { data: patient, isLoading } = useQuery({
    queryKey: ["/api/patients", patientId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/patients/${patientId}`);
      return res.json();
    },
    enabled: !!patientId
  });

  // Simulate appointment timer (for demo purposes)
  useEffect(() => {
    let timerId: NodeJS.Timeout;
    
    if (appointmentRunning) {
      timerId = setInterval(() => {
        setAppointmentTimer(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [appointmentRunning]);

  // Simulate recording timer
  useEffect(() => {
    let timerId: NodeJS.Timeout;
    
    if (isRecording) {
      timerId = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [isRecording]);

  // Format time for display (MM:SS)
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoading || !patient) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-pulse h-32 w-32 rounded-full bg-gray-200 mb-4"></div>
            <p className="text-lg text-muted-foreground">Loading patient information...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto py-6">
          {/* Patient Header with Quick Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-xl">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-3xl font-bold">
                {patient.user.firstName[0]}{patient.user.lastName[0]}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {patient.user.firstName} {patient.user.lastName}
                </h1>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-primary/10 text-primary">
                    {patient.user.dateOfBirth ? new Date(patient.user.dateOfBirth).toLocaleDateString() : 'N/A'}
                  </Badge>
                  <Badge variant="outline" className="bg-blue-50 text-blue-600">
                    {patient.user.insuranceProvider || 'No Insurance'}
                  </Badge>
                  <Badge variant="outline" className="bg-amber-50 text-amber-600">
                    Patient ID: {patient.id}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="mt-4 lg:mt-0 flex flex-col lg:items-end">
              <div className="flex items-center gap-2 mb-2">
                <Button 
                  variant={appointmentRunning ? "destructive" : "default"}
                  className="gap-2"
                  onClick={() => setAppointmentRunning(!appointmentRunning)}
                >
                  {appointmentRunning ? (
                    <>
                      <XCircle className="h-4 w-4" />
                      End Appointment
                    </>
                  ) : (
                    <>
                      <Timer className="h-4 w-4" />
                      Start Appointment
                    </>
                  )}
                </Button>
                <div className="bg-gray-100 px-3 py-1 rounded-md font-mono">
                  {formatTime(appointmentTimer)}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" className="gap-1" onClick={() => setLocation(`/ai-hub`)}>
                  <Brain className="h-4 w-4" />
                  AI Hub
                </Button>
                <Button variant="outline" size="sm" className="gap-1" onClick={() => setLocation(`/medical-dashboard/${patientId}`)}>
                  <Heart className="h-4 w-4" />
                  Medical Profile
                </Button>
                <Button variant="outline" size="sm" className="gap-1">
                  <FileText className="h-4 w-4" />
                  Reports
                </Button>
              </div>
            </div>
          </div>

          {/* Appointment Voice Recording Bar */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant={isRecording ? "destructive" : "outline"} 
                size="sm"
                className="gap-2"
                onClick={() => setIsRecording(!isRecording)}
              >
                {isRecording ? (
                  <>
                    <X className="h-4 w-4" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4" />
                    Start Voice Notes
                  </>
                )}
              </Button>
              
              {isRecording && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="text-sm font-medium">Recording</span>
                  </div>
                  <div className="font-mono text-sm">{formatTime(recordingTime)}</div>
                </>
              )}
              
              {!isRecording && (
                <span className="text-sm text-muted-foreground">
                  AI will transcribe and organize your voice notes into the patient record
                </span>
              )}
            </div>
            
            <div className="flex gap-2">
              {isRecording && (
                <Button size="sm" variant="outline" className="gap-1">
                  <Save className="h-4 w-4" />
                  Save Notes
                </Button>
              )}
              <Button size="sm" variant="outline" className="gap-1">
                <Wand className="h-4 w-4" />
                AI Analysis
              </Button>
            </div>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-6 mb-6">
              <TabsTrigger value="overview" className="gap-2">
                <Stethoscope className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="medical-history" className="gap-2">
                <History className="h-4 w-4" />
                Medical History
              </TabsTrigger>
              <TabsTrigger value="xrays" className="gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                X-Rays
              </TabsTrigger>
              <TabsTrigger value="notes" className="gap-2">
                <FileText className="h-4 w-4" />
                Patient Notes
              </TabsTrigger>
              <TabsTrigger value="treatment-plan" className="gap-2">
                <FilePlus className="h-4 w-4" />
                Treatment Plan
              </TabsTrigger>
              <TabsTrigger value="intake-form" className="gap-2">
                <AlertCircle className="h-4 w-4" />
                Intake Form
              </TabsTrigger>
            </TabsList>

            <div className="space-y-6">
              <TabsContent value="overview">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Patient Health Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Heart className="h-5 w-5 text-primary" />
                        Health Summary
                      </CardTitle>
                      <CardDescription>
                        Overview of patient's vital information
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <PatientHealthAlerts patient={patient} />
                    </CardContent>
                  </Card>

                  {/* Recent Activity */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5 text-primary" />
                        Recent Activity
                      </CardTitle>
                      <CardDescription>
                        Latest appointments and treatments
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="border-l-2 border-primary pl-4 py-1">
                          <div className="text-sm text-muted-foreground">Mar 1, 2025</div>
                          <div className="font-medium">Routine Checkup</div>
                          <div className="text-sm">Dr. Johnson - Teeth cleaning and examination</div>
                        </div>
                        <div className="border-l-2 border-gray-200 pl-4 py-1">
                          <div className="text-sm text-muted-foreground">Jan 15, 2025</div>
                          <div className="font-medium">X-Ray Session</div>
                          <div className="text-sm">Dr. Smith - Full mouth radiographs</div>
                        </div>
                        <div className="border-l-2 border-gray-200 pl-4 py-1">
                          <div className="text-sm text-muted-foreground">Dec 5, 2024</div>
                          <div className="font-medium">Root Canal</div>
                          <div className="text-sm">Dr. Williams - Tooth #14 endodontic treatment</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Current Treatment Brief */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FilePlus className="h-5 w-5 text-primary" />
                        Current Treatment Brief
                      </CardTitle>
                      <CardDescription>
                        Active treatment progress
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="text-sm font-medium text-gray-500">Treatment Plan</div>
                          <div className="mt-1 font-medium">Comprehensive Orthodontic Care</div>
                          <div className="mt-1 text-sm">Started: Jan 2025 | Est. Completion: Jan 2027</div>
                        </div>
                        <Separator />
                        <div>
                          <div className="text-sm font-medium text-gray-500">Progress</div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                            <div className="bg-primary h-2.5 rounded-full" style={{ width: "25%" }}></div>
                          </div>
                          <div className="mt-1 text-sm text-right">Phase 1 of 4 (25% complete)</div>
                        </div>
                        <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveTab("treatment-plan")}>
                          View Full Treatment Plan
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Notes */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Recent Notes
                      </CardTitle>
                      <CardDescription>
                        Latest clinical observations and notes
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="p-3 bg-gray-50 rounded-md">
                          <div className="flex justify-between items-start">
                            <div className="font-medium">Mar 1, 2025 - Dr. Johnson</div>
                            <Badge variant="outline" className="text-xs">Routine</Badge>
                          </div>
                          <p className="mt-2 text-sm">
                            Patient reports slight sensitivity to cold in upper right quadrant. 
                            No visible caries detected. Recommended sensitivity toothpaste.
                          </p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-md">
                          <div className="flex justify-between items-start">
                            <div className="font-medium">Jan 15, 2025 - Dr. Smith</div>
                            <Badge variant="outline" className="text-xs">X-Ray Analysis</Badge>
                          </div>
                          <p className="mt-2 text-sm">
                            Full mouth radiographs show early signs of horizontal bone loss in lower
                            anterior region. Recommend periodontal evaluation.
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => setActiveTab("notes")}>
                        View All Notes
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="medical-history">
                <MedicalHistoryPanel patientId={Number(patientId)} />
              </TabsContent>

              <TabsContent value="xrays">
                <PatientXrays patientId={Number(patientId)} />
              </TabsContent>

              <TabsContent value="notes">
                <PatientNotes patientId={Number(patientId)} />
              </TabsContent>

              <TabsContent value="treatment-plan">
                <PatientTreatmentPlan patientId={Number(patientId)} />
              </TabsContent>

              <TabsContent value="intake-form">
                <PatientIntakeForm patientId={Number(patientId)} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>
    </div>
  );
}