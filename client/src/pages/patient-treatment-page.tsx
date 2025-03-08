import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { usePatientById } from "@/hooks/use-patient";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { PatientXrays } from "@/components/patients/patient-xrays";
import { PatientTreatmentPlan } from "@/components/patients/patient-treatment-plan";
import { PatientHealthAlerts } from "@/components/patients/patient-health-alerts";
import { PatientNotes } from "@/components/patients/patient-notes";
import { PatientIntakeForm } from "@/components/patients/patient-intake-form";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useParams, useLocation } from "wouter";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Edit, 
  FileText, 
  Mail, 
  MessageSquare, 
  Phone, 
  Plus, 
  User,
  Video
} from "lucide-react";

export default function PatientTreatmentPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Fetch patient data
  const { patient, loading: isLoading, error } = usePatientById(patientId ? parseInt(patientId) : undefined);
  
  // Fetch additional patient data
  const { data: patientDetails } = useQuery({
    queryKey: ["/api/patient-details", patientId],
    queryFn: async () => {
      try {
        const res = await apiRequest<any>("GET", `/api/patients/${patientId}/details`);
        return res;
      } catch (error) {
        console.error("Failed to fetch patient details:", error);
        return null;
      }
    },
    enabled: !!patientId
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load patient information. Please try again.",
        variant: "destructive"
      });
      navigate("/patients");
    }
  }, [error, toast, navigate]);

  const handleNewAppointment = () => {
    navigate(`/appointments/new?patientId=${patientId}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite] mr-3"></div>
        <span className="text-muted-foreground">Loading patient information...</span>
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-7xl">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          className="gap-2 mb-4"
          onClick={() => navigate("/patients")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Patients
        </Button>
        
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              {patient?.firstName} {patient?.lastName}
            </h1>
            <p className="text-muted-foreground">
              Patient #{patient?.id} · DOB: {new Date(patient?.dateOfBirth || "").toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2">
              <Phone className="h-4 w-4" />
              Call
            </Button>
            <Button variant="outline" className="gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Button>
            <Button variant="outline" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Message
            </Button>
            <Button 
              className="gap-2"
              onClick={handleNewAppointment}
            >
              <Plus className="h-4 w-4" />
              New Appointment
            </Button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Patient Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-3 items-center">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{patient?.firstName} {patient?.lastName}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date().getFullYear() - new Date(patient?.dateOfBirth || "").getFullYear()} years old
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm">{patient?.phoneNumber || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm">{patient?.email || "Not provided"}</p>
                </div>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground">Insurance</p>
                <p className="text-sm">{patient?.insuranceProvider || "Not provided"}</p>
                {patient?.insuranceNumber && (
                  <p className="text-xs text-muted-foreground mt-1">Policy: {patient.insuranceNumber}</p>
                )}
              </div>
              
              <Separator />
              
              <div className="pt-1">
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Information
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Upcoming Appointment</CardTitle>
          </CardHeader>
          <CardContent>
            {patientDetails?.nextAppointment ? (
              <div className="space-y-3">
                <div className="flex gap-3 items-center">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{patientDetails.nextAppointment.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(patientDetails.nextAppointment.date).toLocaleDateString()} at {
                        new Date(patientDetails.nextAppointment.date).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      }
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Provider</p>
                    <p className="text-sm">{patientDetails.nextAppointment.provider}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="text-sm">{patientDetails.nextAppointment.duration} minutes</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-sm">
                    {patientDetails.nextAppointment.notes || "No additional notes"}
                  </p>
                </div>
                
                <Separator />
                
                <div className="pt-1 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-2">
                    <Edit className="h-4 w-4" />
                    Reschedule
                  </Button>
                  <Button variant="default" size="sm" className="flex-1 gap-2">
                    <Video className="h-4 w-4" />
                    Start Visit
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Calendar className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="font-medium">No upcoming appointments</p>
                <p className="text-sm text-muted-foreground mb-4">
                  This patient doesn't have any scheduled appointments
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleNewAppointment}
                >
                  Schedule Appointment
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Treatment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-3 items-center">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">
                    {patientDetails?.activeTreatmentPlans || 0} Active Treatment {
                      patientDetails?.activeTreatmentPlans === 1 ? "Plan" : "Plans"
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Last update: {
                      patientDetails?.lastTreatmentUpdate 
                        ? new Date(patientDetails.lastTreatmentUpdate).toLocaleDateString()
                        : "Never"
                    }
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Last Visit</p>
                  <p className="text-sm">
                    {patientDetails?.lastVisit 
                      ? new Date(patientDetails.lastVisit).toLocaleDateString()
                      : "No previous visits"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last Cleaning</p>
                  <p className="text-sm">
                    {patientDetails?.lastCleaning 
                      ? new Date(patientDetails.lastCleaning).toLocaleDateString()
                      : "None recorded"}
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground">Active Treatments</p>
                {patientDetails?.treatmentSummary ? (
                  <ul className="text-sm list-disc pl-4 mt-1 space-y-1">
                    {patientDetails.treatmentSummary.map((treatment, index) => (
                      <li key={index}>{treatment}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm">No active treatments</p>
                )}
              </div>
              
              <Separator />
              
              <div className="pt-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full gap-2"
                  onClick={() => setActiveTab("treatment")}
                >
                  <FileText className="h-4 w-4" />
                  View Treatment Plans
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="treatment">Treatment Plan</TabsTrigger>
          <TabsTrigger value="xrays">X-Rays & Imaging</TabsTrigger>
          <TabsTrigger value="notes">Clinical Notes</TabsTrigger>
          <TabsTrigger value="forms">Patient Forms</TabsTrigger>
          <TabsTrigger value="history">Appointment History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 gap-6">
            <PatientHealthAlerts patient={patient} />
          </div>
        </TabsContent>
        
        <TabsContent value="treatment">
          <div className="grid grid-cols-1 gap-6">
            {patientId && <PatientTreatmentPlan patientId={parseInt(patientId)} />}
          </div>
        </TabsContent>
        
        <TabsContent value="xrays">
          <div className="grid grid-cols-1 gap-6">
            {patientId && <PatientXrays patientId={parseInt(patientId)} />}
          </div>
        </TabsContent>
        
        <TabsContent value="notes">
          <div className="grid grid-cols-1 gap-6">
            {patientId && <PatientNotes patientId={parseInt(patientId)} />}
          </div>
        </TabsContent>
        
        <TabsContent value="forms">
          <div className="grid grid-cols-1 gap-6">
            {patientId && <PatientIntakeForm patientId={parseInt(patientId)} />}
          </div>
        </TabsContent>
        
        <TabsContent value="history">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Appointment History</h2>
            
            {patientDetails?.appointmentHistory && patientDetails.appointmentHistory.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 font-medium">Date</th>
                      <th className="text-left p-3 font-medium">Type</th>
                      <th className="text-left p-3 font-medium">Provider</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {patientDetails.appointmentHistory.map((appointment, index) => (
                      <tr key={index} className="hover:bg-muted/50">
                        <td className="p-3">
                          <div className="font-medium">
                            {new Date(appointment.date).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(appointment.date).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </td>
                        <td className="p-3">{appointment.type}</td>
                        <td className="p-3">{appointment.provider}</td>
                        <td className="p-3">
                          <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            appointment.status === "completed" ? "bg-green-100 text-green-800" :
                            appointment.status === "cancelled" ? "bg-red-100 text-red-800" :
                            appointment.status === "no-show" ? "bg-amber-100 text-amber-800" :
                            "bg-blue-100 text-blue-800"
                          }`}>
                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          </div>
                        </td>
                        <td className="p-3">
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-lg border">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium">No Appointment History</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mt-1">
                  This patient doesn't have any past appointments on record.
                </p>
                <Button 
                  className="mt-4"
                  onClick={handleNewAppointment}
                >
                  Schedule First Appointment
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}