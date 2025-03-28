import React, { useEffect, useState } from "react";
import axios from "axios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, ListChecks, Plus, Brain, AlertTriangle, Pencil, ChevronRight, 
         Phone, Bell, Activity, FileText, CreditCard, Clock4 } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Appointment {
  id: number;
  date: string;
  time: string;
  reason: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";
  provider: string;
  duration: number;
  procedures?: string[];
  patientId?: number;
  patientName?: string;
  phone?: string;
  insurance?: string;
  notes?: string;
  aiFlags?: Array<{
    type: string;
    severity: "low" | "medium" | "high";
    message: string;
  }>;
}

interface AIInsight {
  summary: string;
  questions: string[];
  flags: {
    text: string;
    level: "low" | "medium" | "high";
  }[];
  recommendations: string[];
  perioRisk?: string;
  cariesRisk?: string;
  systemicFlags?: string;
  missedTreatments?: string[];
  optimizations?: string[];
}

export default function PatientSchedulerAndAIHub({ patientId }: { patientId: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("schedule");
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [reminderMessage, setReminderMessage] = useState("");
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
        
        // Attempt to get additional AI insights data
        let enhancedAI = aiRes.data || { 
          summary: "No AI insights available yet", 
          questions: [], 
          flags: [],
          recommendations: [] 
        };
        
        try {
          // Try to get risk assessment and treatment insights
          const [riskRes, treatmentRes] = await Promise.all([
            axios.get(`/api/aihub/${patientId}/risk-assessment`),
            axios.get(`/api/aihub/${patientId}/treatment-insights`)
          ]);
          
          enhancedAI = {
            ...enhancedAI,
            perioRisk: riskRes.data.perioRisk?.level || "unknown",
            cariesRisk: riskRes.data.cariesRisk?.level || "unknown",
            systemicFlags: riskRes.data.systemicRisk?.level || "unknown",
            missedTreatments: treatmentRes.data.missedTreatments?.map((t: any) => t.treatment) || [],
            optimizations: treatmentRes.data.insuranceOptimization?.recommendations || []
          };
        } catch (error) {
          console.warn("Could not fetch extended AI data:", error);
        }
        
        setAiInsights(enhancedAI);
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

  const submitFeedback = async () => {
    if (!feedback) return;
    
    setSubmittingFeedback(true);
    try {
      await axios.post(`/api/ai/feedback/${patientId}`, { feedback });
      toast({
        title: "Feedback Submitted",
        description: "Your feedback has been submitted to the AI system."
      });
      setFeedback("");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const sendReminder = async () => {
    if (!reminderMessage) return;
    
    try {
      await axios.post(`/api/aihub/${patientId}/send-reminder`, { 
        message: reminderMessage,
        treatmentId: 1 // In a real implementation, we'd specify which treatment
      });
      toast({
        title: "Reminder Sent",
        description: "Patient reminder has been sent successfully."
      });
      setReminderMessage("");
      setShowReminderDialog(false);
    } catch (error) {
      console.error("Error sending reminder:", error);
      toast({
        title: "Error",
        description: "Failed to send reminder. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "scheduled": return "bg-blue-100 text-blue-800";
      case "confirmed": return "bg-green-100 text-green-800";
      case "completed": return "bg-gray-100 text-gray-800";
      case "cancelled": return "bg-red-100 text-red-800";
      case "no_show": return "bg-yellow-100 text-yellow-800";
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

  const getRiskColor = (level: string): string => {
    switch (level) {
      case "low": return "bg-green-500";
      case "moderate": return "bg-orange-400";
      case "high": return "bg-red-500";
      default: return "bg-gray-300";
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
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setShowReminderDialog(true)}>
            <Bell className="h-4 w-4 mr-1" /> Send Reminder
          </Button>
          <Button size="sm" onClick={scheduleNewAppointment}>
            <Plus className="h-4 w-4 mr-1" /> New Appointment
          </Button>
        </div>
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
          <Card key={appt.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">{appt.date}</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                  <span className="text-sm text-muted-foreground">{appt.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(appt.status)}>
                    {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingAppt(appt)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
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
              
              {/* Quick Action Links */}
              <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                <div className="flex space-x-2">
                  <a href={`/patients/${patientId}/chart`} className="text-xs text-blue-600 hover:underline flex items-center">
                    <FileText className="h-3 w-3 mr-1" /> Chart
                  </a>
                  <a href={`/patients/${patientId}/notes`} className="text-xs text-blue-600 hover:underline flex items-center">
                    <Pencil className="h-3 w-3 mr-1" /> Notes
                  </a>
                </div>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
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
          
          {/* Risk Profile */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Risk Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge className={getRiskColor(aiInsights.perioRisk || "unknown")}>
                  Perio: {aiInsights.perioRisk || "Unknown"}
                </Badge>
                <Badge className={getRiskColor(aiInsights.cariesRisk || "unknown")}>
                  Caries: {aiInsights.cariesRisk || "Unknown"}
                </Badge>
                <Badge className={getRiskColor(aiInsights.systemicFlags || "unknown")}>
                  Systemic: {aiInsights.systemicFlags || "Unknown"}
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          {/* Attention Items */}
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
          
          {/* Missed Treatments */}
          {aiInsights.missedTreatments && aiInsights.missedTreatments.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock4 className="h-4 w-4 text-orange-500" />
                  Missed/Delayed Treatments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {aiInsights.missedTreatments.map((treatment, idx) => (
                    <li key={idx} className="flex items-center justify-between">
                      <span>{treatment}</span>
                      <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => {
                        setReminderMessage(`Friendly reminder about your recommended treatment: ${treatment}`);
                        setShowReminderDialog(true);
                      }}>
                        Remind
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          
          {/* Insurance Optimization */}
          {aiInsights.optimizations && aiInsights.optimizations.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-blue-500" />
                  Insurance Optimization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {aiInsights.optimizations.map((opt, idx) => (
                    <li key={idx}>{opt}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          
          {/* Follow-up Questions */}
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
          
          {/* Recommendations */}
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
          
          {/* Doctor Feedback for AI */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Provider Feedback to AI</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Provide feedback to improve AI recommendations..."
                className="min-h-[100px] mb-2"
              />
              <Button 
                onClick={submitFeedback} 
                disabled={submittingFeedback || !feedback}
                className="w-full"
              >
                {submittingFeedback ? "Submitting..." : "Submit Feedback"}
              </Button>
            </CardContent>
          </Card>
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
      
      {/* Appointment Edit Dialog */}
      <Dialog open={!!editingAppt} onOpenChange={(open) => !open && setEditingAppt(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Appointment</DialogTitle>
          </DialogHeader>
          
          {editingAppt && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Input 
                    type="date" 
                    value={editingAppt.date} 
                    onChange={(e) => setEditingAppt({...editingAppt, date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Time</label>
                  <Input 
                    type="time" 
                    value={editingAppt.time} 
                    onChange={(e) => setEditingAppt({...editingAppt, time: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Reason</label>
                <Input 
                  value={editingAppt.reason} 
                  onChange={(e) => setEditingAppt({...editingAppt, reason: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Provider</label>
                <Input 
                  value={editingAppt.provider} 
                  onChange={(e) => setEditingAppt({...editingAppt, provider: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={editingAppt.status} onValueChange={(value) => setEditingAppt({
                  ...editingAppt, 
                  status: value as "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show"
                })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="no_show">No Show</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea 
                  value={editingAppt.notes || ""} 
                  onChange={(e) => setEditingAppt({...editingAppt, notes: e.target.value})}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAppt(null)}>Cancel</Button>
            <Button onClick={() => {
              // In a real implementation, we'd save the changes
              toast({
                title: "Success",
                description: "Appointment updated successfully.",
              });
              setEditingAppt(null);
            }}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Reminder Dialog */}
      <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Patient Reminder</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Reminder Message</label>
              <Textarea 
                value={reminderMessage} 
                onChange={(e) => setReminderMessage(e.target.value)}
                placeholder="Enter reminder message for the patient..."
                className="min-h-[150px]"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Send Method</label>
              <Select defaultValue="both">
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">SMS Only</SelectItem>
                  <SelectItem value="email">Email Only</SelectItem>
                  <SelectItem value="both">Both SMS & Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReminderDialog(false)}>Cancel</Button>
            <Button onClick={sendReminder} disabled={!reminderMessage}>Send Reminder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}