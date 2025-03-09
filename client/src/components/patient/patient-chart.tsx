import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { AlertTriangle, FileText, Beaker, Stethoscope, X as XRayIcon, CalendarCheck, File, ArrowUpRight, AlertCircle } from "lucide-react";

// Import our custom components
import { EnhancedPerioChart } from "../perio";
import LabResultsUpload from "../lab/lab-results-upload";
import NotesSystem from "../medical/notes-system";
import AdvancedXRayAnalyzer from "../ai/advanced-xray-analyzer";
import HealthContraindicationAlerts from "../ai/health-contraindication-alerts";

// Types (simplified versions of what's in the database schema)
export interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  medicalHistory?: any;
  allergyInfo?: string[];
  medications?: string[];
  user?: {
    id: number;
    email: string;
  }
}

// Patient chart component with tabs for different sections
const PatientChart: React.FC<{
  patientId: number;
  initialTabIndex?: string;
}> = ({ patientId, initialTabIndex = "overview" }) => {
  const [activeTab, setActiveTab] = useState(initialTabIndex);
  const { user } = useAuth();
  
  // Get patient data
  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}`],
    queryFn: async () => await apiRequest<Patient>(`/api/patients/${patientId}`),
  });

  if (patientLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Health Contraindication Alerts Panel */}
      <HealthContraindicationAlerts 
        patientId={patientId} 
        userId={user?.id || 1} 
      />

      {/* Main Patient Chart */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{patient?.firstName} {patient?.lastName}'s Chart</CardTitle>
              <CardDescription>
                DOB: {new Date(patient?.dateOfBirth || "").toLocaleDateString()}
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Badge variant="outline">Patient ID: {patientId}</Badge>
              <Badge variant="secondary">Active Patient</Badge>
            </div>
          </div>
        </CardHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="px-6">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-10 px-4"
              >
                <FileText className="h-4 w-4 mr-2" /> Overview
              </TabsTrigger>
              <TabsTrigger 
                value="perio" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-10 px-4"
              >
                <Stethoscope className="h-4 w-4 mr-2" /> Periodontal Chart
              </TabsTrigger>
              <TabsTrigger 
                value="lab" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-10 px-4"
              >
                <Beaker className="h-4 w-4 mr-2" /> Lab Results
              </TabsTrigger>
              <TabsTrigger 
                value="notes" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-10 px-4"
              >
                <File className="h-4 w-4 mr-2" /> Medical Notes
              </TabsTrigger>
              <TabsTrigger 
                value="xrays" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-10 px-4"
              >
                <XRayIcon className="h-4 w-4 mr-2" /> X-Rays
              </TabsTrigger>
              <TabsTrigger 
                value="appointments" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-10 px-4"
              >
                <CalendarCheck className="h-4 w-4 mr-2" /> Appointments
              </TabsTrigger>
            </TabsList>
          </div>

          <CardContent className="pt-6">
            <TabsContent value="overview" className="m-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Medical History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Allergies</h4>
                        {patient?.allergyInfo && patient.allergyInfo.length > 0 ? (
                          <ul className="list-disc list-inside">
                            {patient.allergyInfo.map((allergy, index) => (
                              <li key={index} className="text-sm">{allergy}</li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-sm italic text-gray-500">No known allergies</div>
                        )}
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Medications</h4>
                        {patient?.medications && patient.medications.length > 0 ? (
                          <ul className="list-disc list-inside">
                            {patient.medications.map((medication, index) => (
                              <li key={index} className="text-sm">{medication}</li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-sm italic text-gray-500">No current medications</div>
                        )}
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Medical Conditions</h4>
                        {patient?.medicalHistory?.systemicConditions && 
                         patient.medicalHistory.systemicConditions.length > 0 ? (
                          <ul className="list-disc list-inside">
                            {patient.medicalHistory.systemicConditions.map((condition: string, index: number) => (
                              <li key={index} className="text-sm">{condition}</li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-sm italic text-gray-500">No known medical conditions</div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Latest Vital Signs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-md">
                        <div className="text-sm font-medium text-gray-500">Blood Pressure</div>
                        <div className="text-lg">120/80 mmHg</div>
                        <div className="text-xs text-gray-400">Recorded: 2 weeks ago</div>
                      </div>
                      
                      <div className="p-3 bg-gray-50 rounded-md">
                        <div className="text-sm font-medium text-gray-500">Heart Rate</div>
                        <div className="text-lg">72 bpm</div>
                        <div className="text-xs text-gray-400">Recorded: 2 weeks ago</div>
                      </div>
                      
                      <div className="p-3 bg-gray-50 rounded-md">
                        <div className="text-sm font-medium text-gray-500">Temperature</div>
                        <div className="text-lg">98.6 °F</div>
                        <div className="text-xs text-gray-400">Recorded: 2 weeks ago</div>
                      </div>
                      
                      <div className="p-3 bg-gray-50 rounded-md">
                        <div className="text-sm font-medium text-gray-500">Respiratory Rate</div>
                        <div className="text-lg">16 breaths/min</div>
                        <div className="text-xs text-gray-400">Recorded: 2 weeks ago</div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => setActiveTab("lab")}
                      >
                        View All Vitals & Lab Results
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="md:col-span-2">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between">
                      <CardTitle className="text-lg">Recent Treatment Plans</CardTitle>
                      <Button variant="link" className="h-auto p-0">
                        View All <ArrowUpRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 border rounded-md">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-base font-medium">Comprehensive Periodontal Treatment</div>
                            <div className="text-sm text-gray-500 mt-1">Created: March 1, 2025</div>
                          </div>
                          <Badge>In Progress</Badge>
                        </div>
                        <div className="mt-3 text-sm">
                          Full mouth scaling and root planing, followed by periodontal maintenance.
                        </div>
                        <div className="mt-3 flex justify-between">
                          <div className="text-sm">
                            <span className="font-medium">Next appointment:</span> March 15, 2025
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Provider:</span> Dr. Smith
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 border rounded-md">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-base font-medium">Restorative Care Plan</div>
                            <div className="text-sm text-gray-500 mt-1">Created: February 10, 2025</div>
                          </div>
                          <Badge variant="outline">Completed</Badge>
                        </div>
                        <div className="mt-3 text-sm">
                          Restoration of teeth #14, #15 with composite fillings.
                        </div>
                        <div className="mt-3 flex justify-between">
                          <div className="text-sm">
                            <span className="font-medium">Completed:</span> February 20, 2025
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Provider:</span> Dr. Johnson
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="perio" className="m-0">
              <EnhancedPerioChart
                patientId={patientId}
                examinerId={user?.id || 1}
                // In a real app, you'd fetch existing chart data
                // existingChartData={patientPerioChart}
                onSave={(chartData) => {
                  // In a real app, save to the database
                  console.log("Saving perio chart:", chartData);
                  toast({
                    title: "Periodontal chart saved",
                    description: "Chart data has been saved successfully."
                  });
                }}
              />
            </TabsContent>

            <TabsContent value="lab" className="m-0">
              <LabResultsUpload
                patientId={patientId}
                doctorId={user?.id || 1}
                onLabResultAdded={(result) => {
                  console.log("Lab result added:", result);
                  toast({
                    title: "Lab result added",
                    description: "The lab result has been added to the patient's record."
                  });
                }}
              />
            </TabsContent>

            <TabsContent value="notes" className="m-0">
              <NotesSystem
                patientId={patientId}
                doctorId={user?.id || 1}
                doctorName={`${user?.firstName || 'Dr.'} ${user?.lastName || 'Smith'}`}
                onNoteAdded={(note) => {
                  console.log("Note added:", note);
                  toast({
                    title: "Medical note added",
                    description: "The note has been added to the patient's record."
                  });
                }}
              />
            </TabsContent>

            <TabsContent value="xrays" className="m-0">
              <AdvancedXRayAnalyzer
                patientId={patientId}
                doctorId={user?.id || 1}
                onXRayAdded={(xray) => {
                  console.log("X-ray added:", xray);
                  toast({
                    title: "X-ray added",
                    description: "The X-ray has been added to the patient's record."
                  });
                }}
              />
            </TabsContent>

            <TabsContent value="appointments" className="m-0">
              <div className="text-center p-8 border rounded-md">
                <AlertCircle className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">Appointments</h3>
                <p className="text-gray-500 mb-4">
                  The Appointments component is not yet implemented. It will include
                  appointment history and scheduling features.
                </p>
                <Button disabled>Coming Soon</Button>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default PatientChart;