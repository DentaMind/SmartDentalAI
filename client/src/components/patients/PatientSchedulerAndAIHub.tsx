import React, { useEffect, useState } from "react";
import axios from "axios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, ListChecks, Plus, Brain, AlertTriangle } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Appointment {
  id: number;
  date: string;
  time: string;
  reason: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled";
  provider: string;
  duration: number;
  procedures?: string[];
}

interface AIInsight {
  summary: string;
  questions: string[];
  flags: {
    text: string;
    level: "low" | "medium" | "high";
  }[];
  recommendations: string[];
}

export default function PatientSchedulerAndAIHub({ patientId }: { patientId: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("schedule");
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch both appointments and AI insights in parallel
        const [apptRes, aiRes] = await Promise.all([
          axios.get(`/api/schedule/${patientId}`),
          axios.get(`/api/aihub/${patientId}`)
        ]);
        
        setAppointments(apptRes.data || []);
        setAiInsights(aiRes.data || { 
          summary: "No AI insights available yet", 
          questions: [], 
          flags: [],
          recommendations: [] 
        });
      } catch (error) {
        console.error("Error fetching patient data:", error);
        toast({
          title: "Error",
          description: "Failed to load patient data. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (patientId) {
      fetchData();
    }
  }, [patientId, toast]);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "scheduled": return "bg-blue-100 text-blue-800";
      case "confirmed": return "bg-green-100 text-green-800";
      case "completed": return "bg-gray-100 text-gray-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getFlagColor = (level: string): string => {
    switch (level) {
      case "low": return "bg-yellow-100 text-yellow-800";
      case "medium": return "bg-orange-100 text-orange-800";
      case "high": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const scheduleNewAppointment = () => {
    toast({
      title: "Schedule Appointment",
      description: "Opening appointment scheduler...",
    });
    // In a real implementation, this would open a modal or redirect to the scheduler
  };

  const renderSchedule = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Upcoming Appointments</h3>
        <Button size="sm" onClick={scheduleNewAppointment}>
          <Plus className="h-4 w-4 mr-1" /> New Appointment
        </Button>
      </div>
      
      {appointments.length === 0 ? (
        <Card className="p-4 text-center">
          <p className="text-muted-foreground">No appointments scheduled</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={scheduleNewAppointment}
          >
            Schedule First Appointment
          </Button>
        </Card>
      ) : (
        appointments.map((appt) => (
          <Card key={appt.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">{appt.date}</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                  <span className="text-sm text-muted-foreground">{appt.time}</span>
                </div>
                <Badge className={getStatusColor(appt.status)}>
                  {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium mb-1">{appt.reason}</p>
              <p className="text-xs text-muted-foreground mb-2">Provider: {appt.provider}</p>
              
              {appt.procedures && appt.procedures.length > 0 && (
                <div className="mt-2">
                  <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1">
                    <ListChecks className="h-3 w-3" /> Procedures:
                  </div>
                  <ul className="text-xs list-disc list-inside pl-1">
                    {appt.procedures.map((proc, idx) => (
                      <li key={idx}>{proc}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  const renderAIHub = () => (
    <div className="space-y-4">
      {!aiInsights ? (
        <Card className="p-4 text-center">
          <p className="text-muted-foreground">No AI insights available</p>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                AI Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{aiInsights.summary}</p>
            </CardContent>
          </Card>
          
          {aiInsights.flags && aiInsights.flags.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Attention Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {aiInsights.flags.map((flag, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Badge className={getFlagColor(flag.level)}>
                        {flag.level.toUpperCase()}
                      </Badge>
                      <span className="text-sm">{flag.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          
          {aiInsights.questions && aiInsights.questions.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Follow-up Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {aiInsights.questions.map((q, idx) => (
                    <li key={idx}>{q}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          
          {aiInsights.recommendations && aiInsights.recommendations.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {aiInsights.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="w-full">
      <Tabs defaultValue="schedule" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 grid w-full grid-cols-2">
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="aihub">AI Hub</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="pt-1">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <LoadingSpinner className="h-6 w-6 text-primary" />
              <span className="ml-2">Loading schedule...</span>
            </div>
          ) : (
            renderSchedule()
          )}
        </TabsContent>
        
        <TabsContent value="aihub" className="pt-1">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <LoadingSpinner className="h-6 w-6 text-primary" />
              <span className="ml-2">Loading AI insights...</span>
            </div>
          ) : (
            renderAIHub()
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}