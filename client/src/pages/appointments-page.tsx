import { useState } from "react";
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {t("nav.appointments")}
          </h1>
          <Button onClick={handleAddAppointment}>
            <Plus className="h-4 w-4 mr-2" />
            {t("appointment.schedule")}
          </Button>
        </div>

        <Tabs defaultValue="weekly" className="space-y-4">
          <TabsList>
            <TabsTrigger value="weekly" className="flex items-center">
              <LayoutGrid className="h-4 w-4 mr-2" />
              Weekly Schedule
            </TabsTrigger>
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
          
          <TabsContent value="weekly">
            <div className="bg-white rounded-lg shadow p-4">
              <WeeklySchedule 
                onAddAppointment={handleAddAppointment}
                onViewAppointment={handleViewAppointment}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="scheduler">
            <AppointmentScheduler />
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
              <div className="space-y-4">
                <p className="text-sm">Viewing details for appointment #{selectedAppointmentId}</p>
                {/* This would be replaced with actual appointment details */}
                <p className="text-sm text-muted-foreground">
                  Appointment data would be loaded here based on the ID
                </p>
              </div>
            ) : (
              <AppointmentScheduler 
                onAppointmentCreated={() => setAppointmentDialogOpen(false)} 
              />
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAppointmentDialogOpen(false)}>
              Cancel
            </Button>
            {!selectedAppointmentId && (
              <Button type="submit">
                Create Appointment
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
