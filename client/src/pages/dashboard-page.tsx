import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { UnifiedDashboard } from "@/components/dashboard/unified-dashboard";
import { WeeklySchedule } from "@/components/appointments/weekly-schedule";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Plus, ChevronDown } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showDashboardStats, setShowDashboardStats] = useState(false);
  
  const handleAddAppointment = () => {
    // Redirect to the appointments page with the scheduler tab open
    setLocation("/appointments?tab=scheduler");
  };
  
  const handleViewAppointment = (appointmentId: number) => {
    // Redirect to the appointment details page
    setLocation(`/appointments/details/${appointmentId}`);
  };
  
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        {/* Primary Schedule View - Always show for all users */}
        <div className="mb-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle className="text-xl">Weekly Schedule</CardTitle>
                <Button onClick={handleAddAppointment}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Appointment
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <WeeklySchedule 
                onAddAppointment={handleAddAppointment}
                onViewAppointment={handleViewAppointment}
              />
            </CardContent>
          </Card>
        </div>
        
        {/* Collapsible dashboard stats */}
        <div className="mb-6">
          <Button 
            variant="outline" 
            className="w-full flex justify-between items-center"
            onClick={() => setShowDashboardStats(!showDashboardStats)}
          >
            <span>Dashboard Analytics</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${showDashboardStats ? 'rotate-180' : ''}`} />
          </Button>
          
          {showDashboardStats && (
            <div className="mt-4">
              <UnifiedDashboard userRole={user?.role} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}