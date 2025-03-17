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
import type { Appointment } from "../../../shared/schema";

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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">Today's Schedule</h2>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-blue-500/20 border-blue-500/30 text-white hover:bg-blue-500/30 hover:text-white hover:border-blue-500/40"
                onClick={() => setLocation('/appointments')}
              >
                View All Appointments
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            <Card className="border border-white/5 bg-white/5 backdrop-blur-sm shadow-lg">
              <CardContent className="p-0">
                <EnhancedScheduler 
                  onAppointmentSelect={handleViewAppointment}
                  onNewAppointment={handleAddAppointment}
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="group">
              <Card className="border border-white/5 bg-white/5 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all hover:bg-white/10 hover:border-white/10 duration-300 h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white group-hover:text-blue-100 transition-colors">Patient Management</CardTitle>
                  <CardDescription className="text-blue-100/70">Add or search for patients</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    className="w-full justify-between bg-white/10 border-white/10 text-white hover:bg-white/20 hover:text-white hover:border-white/20" 
                    onClick={() => setLocation('/patients')}
                  >
                    <span>View Patients</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            <div className="group">
              <Card className="border border-white/5 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all hover:bg-white/10 hover:border-white/10 duration-300 h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white group-hover:text-blue-100 transition-colors">Clinical Tools</CardTitle>
                  <CardDescription className="text-blue-100/70">X-rays, periodontal charts, and AI analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    className="w-full justify-between bg-blue-500/20 border-blue-500/30 text-white hover:bg-blue-500/30 hover:text-white hover:border-blue-500/50" 
                    onClick={() => setLocation('/dental-ai-hub')}
                  >
                    <span>Open AI Hub</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            <div className="group">
              <Card className="border border-white/5 bg-white/5 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all hover:bg-white/10 hover:border-white/10 duration-300 h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white group-hover:text-blue-100 transition-colors">Practice Analytics</CardTitle>
                  <CardDescription className="text-blue-100/70">Financial insights and practice metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    className="w-full justify-between bg-white/10 border-white/10 text-white hover:bg-white/20 hover:text-white hover:border-white/20" 
                    onClick={() => setShowDashboardStats(!showDashboardStats)}
                  >
                    <span>View Analytics</span>
                    <BarChart3 className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Dashboard Analytics (collapsible) */}
          {showDashboardStats && (
            <div className="mt-6 animate-in fade-in slide-in-from-top-4 duration-300">
              <Card className="border border-white/5 bg-white/5 backdrop-blur-sm shadow-lg">
                <CardHeader className="border-b border-white/10">
                  <CardTitle className="text-white text-2xl">Practice Analytics Dashboard</CardTitle>
                  <CardDescription className="text-blue-100/70">Key metrics and insights for your practice</CardDescription>
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
          <DialogContent className="sm:max-w-md border border-blue-500/30 bg-gradient-to-b from-gray-900 to-gray-800 shadow-xl">
            <DialogTitle className="text-white text-xl flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-400" />
              Appointment Details
            </DialogTitle>
            <div className="space-y-5 py-4">
              <div className="grid grid-cols-2 gap-5">
                <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                  <h3 className="text-sm font-medium text-blue-300">Date & Time</h3>
                  <p className="text-sm text-white">{new Date(selectedAppointment.date).toLocaleString()}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                  <h3 className="text-sm font-medium text-blue-300">Status</h3>
                  <p className="text-sm text-white capitalize flex items-center gap-1.5">
                    {selectedAppointment.status === "confirmed" && (
                      <span className="h-2 w-2 rounded-full bg-green-500"></span>
                    )}
                    {selectedAppointment.status === "pending" && (
                      <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                    )}
                    {selectedAppointment.status === "canceled" && (
                      <span className="h-2 w-2 rounded-full bg-red-500"></span>
                    )}
                    {selectedAppointment.status}
                  </p>
                </div>
                <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                  <h3 className="text-sm font-medium text-blue-300">Patient ID</h3>
                  <p className="text-sm text-white">{selectedAppointment.patientId}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                  <h3 className="text-sm font-medium text-blue-300">Doctor ID</h3>
                  <p className="text-sm text-white">{selectedAppointment.doctorId}</p>
                </div>
              </div>
              
              {selectedAppointment.notes && (
                <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
                  <h3 className="text-sm font-medium text-blue-300">Notes</h3>
                  <p className="text-sm text-white/90 mt-1">{selectedAppointment.notes}</p>
                </div>
              )}
              
              <div className="flex justify-between mt-6 pt-3 border-t border-white/10">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-white/10 border-white/10 text-white hover:bg-white/20 hover:text-white hover:border-white/20"
                  onClick={() => {
                    setShowAppointmentDetails(false);
                    handlePatientSelect(selectedAppointment.patientId);
                  }}
                >
                  View Patient
                </Button>
                <Button 
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white" 
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