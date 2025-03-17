import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { UnifiedDashboard } from "@/components/dashboard/unified-dashboard";
import { EnhancedScheduler } from "@/components/appointments/enhanced-scheduler";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, Plus, ChevronDown, ArrowRight, Grid, BarChart3, Settings } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Appointment } from "../../shared/schema";

export default function DashboardPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showDashboardStats, setShowDashboardStats] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  
  const handleAddAppointment = (startTime?: Date, doctorId?: number) => {
    // If we have specific time and doctor, include them in the query params
    if (startTime && doctorId) {
      const dateParam = startTime.toISOString();
      setLocation(`/appointments/new?date=${dateParam}&doctorId=${doctorId}`);
    } else {
      // Otherwise just redirect to the appointments page with the scheduler tab open
      setLocation("/appointments?tab=scheduler");
    }
  };
  
  const handleViewAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowAppointmentDetails(true);
  };

  const handlePatientSelect = (patientId: number) => {
    setLocation(`/patients/${patientId}`);
  };
  
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <PageHeader 
          title="DentaMind"
          description={`Welcome back, ${user?.firstName || 'Doctor'}!`}
          actions={
            <Button onClick={() => handleAddAppointment()}>
              <Plus className="h-4 w-4 mr-2" />
              New Appointment
            </Button>
          }
        />
        
        <div className="p-6 space-y-6">
          {/* Main Schedule View */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Today's Schedule</h2>
            <EnhancedScheduler 
              onAppointmentSelect={handleViewAppointment}
              onNewAppointment={handleAddAppointment}
            />
          </div>
          
          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle>Patient Management</CardTitle>
                <CardDescription>Add or search for patients</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full justify-between" onClick={() => setLocation('/patients')}>
                  <span>View Patients</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle>Clinical Tools</CardTitle>
                <CardDescription>X-rays, periodontal charts, and AI analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full justify-between" onClick={() => setLocation('/dental-ai-hub')}>
                  <span>Open AI Hub</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle>Practice Analytics</CardTitle>
                <CardDescription>Financial insights and practice metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full justify-between" 
                  onClick={() => setShowDashboardStats(!showDashboardStats)}
                >
                  <span>View Analytics</span>
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Dashboard Analytics (collapsible) */}
          {showDashboardStats && (
            <div className="mt-6 animate-in fade-in slide-in-from-top-4 duration-300">
              <Card>
                <CardHeader>
                  <CardTitle>Practice Analytics Dashboard</CardTitle>
                  <CardDescription>Key metrics and insights for your practice</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <UnifiedDashboard userRole={user?.role} />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
      
      {/* Appointment Details Dialog */}
      {selectedAppointment && (
        <Dialog open={showAppointmentDetails} onOpenChange={setShowAppointmentDetails}>
          <DialogContent className="sm:max-w-md">
            <DialogTitle>Appointment Details</DialogTitle>
            <div className="space-y-4 py-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Date & Time</h3>
                  <p className="text-sm">{new Date(selectedAppointment.date).toLocaleString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <p className="text-sm capitalize">{selectedAppointment.status}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Patient ID</h3>
                  <p className="text-sm">{selectedAppointment.patientId}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Doctor ID</h3>
                  <p className="text-sm">{selectedAppointment.doctorId}</p>
                </div>
              </div>
              
              {selectedAppointment.notes && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                  <p className="text-sm">{selectedAppointment.notes}</p>
                </div>
              )}
              
              <div className="flex justify-between mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setShowAppointmentDetails(false);
                    handlePatientSelect(selectedAppointment.patientId);
                  }}
                >
                  View Patient
                </Button>
                <Button 
                  size="sm"
                  onClick={() => {
                    setShowAppointmentDetails(false);
                    setLocation(`/appointments/details/${selectedAppointment.id}`);
                  }}
                >
                  Full Details
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}