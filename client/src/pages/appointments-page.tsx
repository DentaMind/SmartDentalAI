import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Appointment } from "@shared/schema";
import { Sidebar } from "@/components/layout/sidebar";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Video, Calendar, Bell, Settings, Clock, ListFilter, LayoutGrid } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ReminderSettings } from "@/components/appointments/reminder-settings";
import { AppointmentScheduler } from "@/components/appointments/appointment-scheduler";
import { WeeklySchedule } from "@/components/appointments/weekly-schedule";
import { AppointmentForm } from "@/components/appointments/appointment-form";
import { AppointmentDetails } from "@/components/appointments/appointment-details";
// Import our new enhanced scheduler
import { EnhancedSchedulerV2 } from "@/components/appointments/enhanced-scheduler-v2";
import { SchedulerV3 } from "@/components/appointments/scheduler-v3";

// Debug helper - check if patients page exists
let patientsPageExists = false;
try {
  // Webpack magic comment for debugging only
  import(/* webpackIgnore: true */ '../pages/patients-page.tsx')
    .then(() => { patientsPageExists = true; })
    .catch(() => { patientsPageExists = false; });
} catch (e) {
  console.error("Error checking for patients page:", e);
}
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AppointmentsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  
  // Debug state for helping troubleshoot the patients page issue
  const [debugInfo, setDebugInfo] = useState({
    patientsApiAvailable: false,
    patientsModuleExists: patientsPageExists,
    lastApiTest: ""
  });
  
  // Test the patients API endpoint
  useEffect(() => {
    const testPatientsApi = async () => {
      try {
        // Try both endpoints to see if either works
        const patientApiResponse = await fetch('/api/patients');
        const patientApiStatus = patientApiResponse.status;
        
        const patientsResponse = await fetch('/patients');
        const patientsStatus = patientsResponse.status;
        
        setDebugInfo(prev => ({
          ...prev,
          patientsApiAvailable: (patientApiStatus === 200 || patientsStatus === 200),
          lastApiTest: `API Test Results: /api/patients (${patientApiStatus}), /patients (${patientsStatus})`
        }));
        
        // Try to read the content
        if (patientApiStatus === 200) {
          const data = await patientApiResponse.json();
          console.log("PATIENTS API DATA:", data);
        }
        
        if (patientsStatus === 200) {
          const data = await patientsResponse.json();
          console.log("PATIENTS ROUTE DATA:", data);
        }
      } catch (error) {
        console.error("Error testing patients API:", error);
        setDebugInfo(prev => ({
          ...prev,
          lastApiTest: `Error testing API: ${error instanceof Error ? error.message : String(error)}`
        }));
      }
    };
    
    testPatientsApi();
  }, []);
  
  const { data: appointments } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments/doctor", user?.id],
  });

  const handleAddAppointment = () => {
    setAppointmentDialogOpen(true);
  };

  const handleViewAppointment = (appointmentId: number) => {
    setSelectedAppointmentId(appointmentId);
    setAppointmentDialogOpen(true);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Debug Information Panel */}
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">🔍 Debug Information for Patients Page</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Patients API Available:</strong> {debugInfo.patientsApiAvailable ? '✅ Yes' : '❌ No'}</p>
            <p><strong>Patients Module Exists:</strong> {debugInfo.patientsModuleExists ? '✅ Yes' : '❌ No'}</p>
            <p><strong>API Test Results:</strong> {debugInfo.lastApiTest}</p>
          </div>
        </div>
      
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {t("nav.appointments")}
          </h1>
          <div className="flex space-x-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  New Patient
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Send New Patient Form</DialogTitle>
                  <DialogDescription>
                    Send a registration form to the new patient. They will receive a link to complete their information and schedule an appointment.
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Patient Name
                    </Label>
                    <input
                      id="name"
                      className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                      placeholder="Full name"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      Email
                    </Label>
                    <input
                      id="email"
                      type="email"
                      className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                      placeholder="patient@example.com"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right">
                      Phone
                    </Label>
                    <input
                      id="phone"
                      type="tel"
                      className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                      placeholder="(555) 555-5555"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="appointment-date" className="text-right">
                      Proposed Date
                    </Label>
                    <input
                      id="appointment-date"
                      type="date"
                      className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="appointment-time" className="text-right">
                      Proposed Time
                    </Label>
                    <input
                      id="appointment-time"
                      type="time"
                      className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="reason" className="text-right">
                      Reason for Visit
                    </Label>
                    <textarea
                      id="reason"
                      className="col-span-3 flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2"
                      placeholder="Brief description of reason for visit"
                    />
                  </div>
                </form>
                <DialogFooter>
                  <Button type="submit">Send Invitation</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Button onClick={handleAddAppointment}>
              <Plus className="h-4 w-4 mr-2" />
              {t("appointment.schedule")}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="scheduler" className="space-y-4">
          <TabsList>
            <TabsTrigger value="scheduler" className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center">
              <ListFilter className="h-4 w-4 mr-2" />
              List View
            </TabsTrigger>
            <TabsTrigger value="reminders" className="flex items-center">
              <Bell className="h-4 w-4 mr-2" />
              Reminders
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="scheduler">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4">
                <SchedulerV3 />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="appointments" className="space-y-4">
            <div className="bg-white rounded-lg shadow">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("appointment.date")}</TableHead>
                    <TableHead>{t("appointment.time")}</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments?.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        {new Date(appointment.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(appointment.date).toLocaleTimeString()}
                      </TableCell>
                      <TableCell>Patient #{appointment.patientId}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{appointment.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {appointment.isOnline ? (
                          <Badge variant="secondary">
                            <Video className="h-4 w-4 mr-1" />
                            Online
                          </Badge>
                        ) : (
                          <Badge>In-Person</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewAppointment(appointment.id)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!appointments || appointments.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        No appointments found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="reminders">
            <ReminderSettings />
          </TabsContent>
          
          <TabsContent value="settings">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium mb-4">Appointment Settings</h2>
              <p className="text-muted-foreground mb-4">
                Configure general settings for appointments and scheduling.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="online-appointments">Online Appointments</Label>
                    <p className="text-sm text-muted-foreground">Allow patients to book online appointments</p>
                  </div>
                  <Switch id="online-appointments" defaultChecked={true} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="confirmation-required">Confirmation Required</Label>
                    <p className="text-sm text-muted-foreground">Require confirmation for all new appointments</p>
                  </div>
                  <Switch id="confirmation-required" defaultChecked={true} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="buffer-time">Appointment Buffer Time</Label>
                    <p className="text-sm text-muted-foreground">Set buffer time between appointments (minutes)</p>
                  </div>
                  <div className="w-24">
                    <select
                      id="buffer-time"
                      className="w-full p-2 border rounded-md"
                      defaultValue="10"
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="15">15</option>
                      <option value="30">30</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="insurance-verification">Automatic Insurance Verification</Label>
                    <p className="text-sm text-muted-foreground">Verify insurance automatically for new appointments</p>
                  </div>
                  <Switch id="insurance-verification" defaultChecked={true} />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      {/* Appointment Dialog */}
      <Dialog open={appointmentDialogOpen} onOpenChange={setAppointmentDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedAppointmentId 
                ? "Appointment Details" 
                : "Schedule New Appointment"}
            </DialogTitle>
            <DialogDescription>
              {selectedAppointmentId 
                ? "View and manage appointment details" 
                : "Create a new appointment by selecting a patient, provider, and time slot"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {selectedAppointmentId ? (
              <AppointmentDetails 
                appointmentId={selectedAppointmentId} 
                onClose={() => setAppointmentDialogOpen(false)}
              />
            ) : (
              <AppointmentForm 
                onSuccess={() => setAppointmentDialogOpen(false)}
                onCancel={() => setAppointmentDialogOpen(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
