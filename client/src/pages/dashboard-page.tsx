import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { UnifiedDashboard } from "@/components/dashboard/unified-dashboard";
import { WeeklySchedule } from "@/components/appointments/weekly-schedule";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Plus } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [createAppointmentOpen, setCreateAppointmentOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  
  const handleAddAppointment = () => {
    // Redirect to the appointments page with the scheduler tab open
    window.location.href = "/appointments?tab=scheduler";
  };
  
  const handleViewAppointment = (appointmentId: number) => {
    setSelectedAppointmentId(appointmentId);
    // Redirect to the appointment details page
    window.location.href = `/appointments/details/${appointmentId}`;
  };
  
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        {/* If the user is a provider (doctor or hygienist), show the schedule view at the top */}
        {user && ["doctor", "hygienist"].includes(user.role) && (
          <div className="mb-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl">Today's Schedule</CardTitle>
                  <Button onClick={handleAddAppointment}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Appointment
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] overflow-auto">
                  <WeeklySchedule 
                    onAddAppointment={handleAddAppointment}
                    onViewAppointment={handleViewAppointment}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Regular dashboard content */}
        <UnifiedDashboard userRole={user?.role} />
      </main>
    </div>
  );
}