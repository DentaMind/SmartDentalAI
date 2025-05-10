import React, { useState } from 'react';
import EnhancedScheduleView from '@/components/scheduler/enhanced-schedule-view';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Shield, Award, Calendar } from 'lucide-react';

// Sample schedule data
const sampleSchedule = [
  { time: "8:00 AM", patient: "John Smith", staff: "Jane Doe", appointmentType: "Cleaning", duration: 60 },
  { time: "9:00 AM", patient: "Emily Chen", staff: "Dr. Smith", appointmentType: "Checkup", duration: 45 },
  { time: "10:00 AM", patient: "Liam Nguyen", staff: "Mike Adams", appointmentType: "Root Canal", duration: 90 },
  { time: "11:00 AM", patient: "Sarah Jones", staff: "Lisa Tran", appointmentType: "Crown Fitting", duration: 60 },
  { time: "1:00 PM", patient: "Alex Ford", staff: "Carlos Vega", appointmentType: "Extraction", duration: 45 },
  { time: "2:00 PM", patient: "Maria Rodriguez", staff: "Jane Doe", appointmentType: "Filling", duration: 60 },
  { time: "3:00 PM", patient: "Thomas Wilson", staff: "Dr. Smith", appointmentType: "Consultation", duration: 30 },
  { time: "4:00 PM", patient: "Olivia Parker", staff: "Mike Adams", appointmentType: "Whitening", duration: 60 }
];

// Sample training data
const trainingStatus = {
  "Jane Doe": { hipaa: 92, osha: 88, ada: 95, cpr: 100 },
  "Dr. Smith": { hipaa: 100, osha: 100, ada: 100, cpr: 100, infection_control: 100 },
  "Mike Adams": { hipaa: 85, osha: 91, ada: 90, cpr: 88 },
  "Lisa Tran": { hipaa: 95, osha: 89, ada: 91, cpr: 100 },
  "Carlos Vega": { hipaa: 100, osha: 100, ada: 100, cpr: 100, infection_control: 100 }
};

export default function SchedulingWithCertifications() {
  const { toast } = useToast();
  const [passingScore, setPassingScore] = useState(90);
  const [showAlerts, setShowAlerts] = useState(true);

  // Handle sending reminder to staff
  const handleSendReminder = async (staffName: string) => {
    // In a real implementation, this would call an API endpoint
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        toast({
          title: "Reminder Sent",
          description: `Training certification reminder sent to ${staffName}`,
        });
        resolve();
      }, 1000);
    });
  };

  // Handle viewing staff profile
  const handleViewStaffProfile = (staffName: string) => {
    toast({
      title: "Staff Profile",
      description: `Viewing training profile for ${staffName}`,
    });
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Calendar className="h-8 w-8 text-primary" />
          <span>Scheduler with Certification Tracking</span>
        </h1>
        <p className="text-gray-500 max-w-3xl">
          View your daily schedule with built-in certification tracking. 
          Quickly see which staff members are fully certified and which need to complete their training requirements.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-lg">Certification System</CardTitle>
              <CardDescription>Track staff training compliance</CardDescription>
            </div>
            <Shield className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="font-medium mb-1">Key Features:</div>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Visual indicator of certification status</li>
                  <li>Automated alerts for uncertified staff</li>
                  <li>One-click reminders for incomplete training</li>
                  <li>Filter schedule by certification status</li>
                </ul>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="font-medium">Show Certification Alerts:</div>
                  <Button
                    variant={showAlerts ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowAlerts(!showAlerts)}
                  >
                    {showAlerts ? "Enabled" : "Disabled"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-lg">Required Certifications</CardTitle>
              <CardDescription>Staff training requirements</CardDescription>
            </div>
            <Award className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="font-medium mb-1">Mandatory Training:</div>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li><span className="font-medium">HIPAA Compliance</span> - Privacy practices</li>
                  <li><span className="font-medium">OSHA Safety</span> - Workplace safety protocols</li> 
                  <li><span className="font-medium">ADA Guidelines</span> - Accessibility standards</li>
                </ul>
              </div>
              
              <div>
                <div className="font-medium mb-1">Optional Training (Role-based):</div>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li><span className="font-medium">CPR Certification</span> - For clinical staff</li>
                  <li><span className="font-medium">Infection Control</span> - For clinical staff</li>
                  <li><span className="font-medium">Emergency Protocols</span> - For all staff</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <EnhancedScheduleView 
        scheduleData={sampleSchedule}
        certificationData={trainingStatus}
        onSendReminder={handleSendReminder}
        onViewStaffProfile={handleViewStaffProfile}
        passingScore={passingScore}
        showAlerts={showAlerts}
      />
    </div>
  );
}