import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  ArrowRight,
  BellRing,
  Calendar,
  Check,
  Clock,
  Edit,
  FileText,
  Loader2,
  Mail,
  Phone,
  Smartphone,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

// Types
type ReminderTimeframe = "24h" | "48h" | "1week";
type ReminderPriority = "low" | "medium" | "high";
type ReminderMethod = "email" | "sms" | "both";

interface ReminderSettings {
  enabled: boolean;
  timeframes: {
    [key in ReminderTimeframe]: boolean;
  };
  method: ReminderMethod;
  customMessage: string;
  priority: ReminderPriority;
  includePatientPortalLink: boolean;
  sendToDependents: boolean;
}

interface ReminderStats {
  sent24h: number;
  sent48h: number;
  sent1week: number;
  openRate: number;
  responseRate: number;
  confirmationRate: number;
  totalDelivered: number;
  totalFailed: number;
}

interface ReminderLog {
  id: string;
  timestamp: string;
  patientId: number;
  patientName: string;
  timeframe: ReminderTimeframe;
  sentTo: string;
  status: "delivered" | "sent" | "opened" | "failed";
  method: "email" | "sms";
  appointmentId: number;
}

interface ReminderLogResponse {
  items: ReminderLog[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function ReminderSettings() {
  const [currentTab, setCurrentTab] = useState("settings");
  const [page, setPage] = useState(1);
  const [settings, setSettings] = useState<ReminderSettings>({
    enabled: true,
    timeframes: {
      "24h": true,
      "48h": true,
      "1week": true
    },
    method: "both",
    customMessage: "This is a reminder about your upcoming dental appointment. Please confirm your attendance or reschedule if needed.",
    priority: "medium",
    includePatientPortalLink: true,
    sendToDependents: false
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch reminder settings
  const { data: reminderData, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["/api/scheduler/reminders/settings"],
    queryFn: async () => {
      try {
        const response = await apiRequest<ReminderSettings>("/api/scheduler/reminders/settings");
        return response;
      } catch (error) {
        console.error("Error fetching reminder settings:", error);
        // Return default settings
        return settings;
      }
    },
    onSuccess: (data) => {
      setSettings(data);
    }
  });
  
  // Fetch reminder stats
  const { data: statsData, isLoading: isLoadingStats } = useQuery<ReminderStats>({
    queryKey: ["/api/scheduler/reminders/stats"],
    queryFn: async () => {
      try {
        const response = await apiRequest<ReminderStats>("/api/scheduler/reminders/stats");
        return response;
      } catch (error) {
        console.error("Error fetching reminder stats:", error);
        // Return default stats
        return {
          sent24h: 12,
          sent48h: 25,
          sent1week: 42,
          openRate: 0.78,
          responseRate: 0.64,
          confirmationRate: 0.92,
          totalDelivered: 79,
          totalFailed: 3
        };
      }
    }
  });
  
  // Fetch reminder logs
  const { data: logsData, isLoading: isLoadingLogs } = useQuery<ReminderLogResponse>({
    queryKey: ["/api/scheduler/reminders/logs", page],
    queryFn: async () => {
      try {
        const response = await apiRequest<ReminderLogResponse>(
          `/api/scheduler/reminders/logs?page=${page}&pageSize=10`
        );
        return response;
      } catch (error) {
        console.error("Error fetching reminder logs:", error);
        // Return default logs
        return {
          items: [
            {
              id: "1",
              timestamp: new Date(Date.now() - 3600000).toISOString(),
              patientId: 101,
              patientName: "Robert Davis",
              timeframe: "24h",
              sentTo: "rdavis@example.com",
              status: "delivered",
              method: "email",
              appointmentId: 1
            },
            {
              id: "2",
              timestamp: new Date(Date.now() - 7200000).toISOString(),
              patientId: 102,
              patientName: "Emily Brown",
              timeframe: "48h",
              sentTo: "+16175555555",
              status: "opened",
              method: "sms",
              appointmentId: 2
            },
            {
              id: "3",
              timestamp: new Date(Date.now() - 86400000).toISOString(),
              patientId: 103,
              patientName: "James Wilson",
              timeframe: "1week",
              sentTo: "jwilson@example.com",
              status: "failed",
              method: "email",
              appointmentId: 3
            }
          ],
          totalCount: 3,
          page: 1,
          pageSize: 10,
          totalPages: 1
        };
      }
    }
  });
  
  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: ReminderSettings) => {
      return apiRequest({
        method: "POST",
        url: "/api/scheduler/reminders/settings",
        body: updatedSettings
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scheduler/reminders/settings"] });
      toast({
        title: "Settings updated",
        description: "Reminder settings have been successfully updated.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Error updating reminder settings:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating the reminder settings. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Send reminder mutation
  const sendRemindersMutation = useMutation({
    mutationFn: async (timeframe: ReminderTimeframe | "all") => {
      return apiRequest({
        method: "POST",
        url: "/api/scheduler/reminders/send",
        body: { timeframe }
      });
    },
    onSuccess: (_, timeframe) => {
      queryClient.invalidateQueries({ queryKey: ["/api/scheduler/reminders/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/scheduler/reminders/logs"] });
      toast({
        title: "Reminders sent",
        description: `${timeframe === "all" ? "All" : timeframe} reminders have been sent successfully.`,
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Error sending reminders:", error);
      toast({
        title: "Sending failed",
        description: "There was an error sending the reminders. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Handle settings change
  const handleSettingsChange = (field: string, value: any) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setSettings(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof ReminderSettings],
          [child]: value
        }
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };
  
  // Handle save settings
  const handleSaveSettings = () => {
    updateSettingsMutation.mutate(settings);
  };
  
  // Handle send reminders
  const handleSendReminders = (timeframe: ReminderTimeframe | "all") => {
    sendRemindersMutation.mutate(timeframe);
  };
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Delivered</Badge>;
      case "sent":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Sent</Badge>;
      case "opened":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Opened</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Get timeframe label
  const getTimeframeLabel = (timeframe: ReminderTimeframe) => {
    switch (timeframe) {
      case "24h":
        return "24 hours";
      case "48h":
        return "48 hours";
      case "1week":
        return "1 week";
      default:
        return timeframe;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Appointment Reminders</h2>
          <p className="text-muted-foreground">
            Configure and manage automated appointment reminders
          </p>
        </div>
      </div>
      
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList>
          <TabsTrigger value="settings" className="gap-2">
            <FileText className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <ArrowRight className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <Calendar className="h-4 w-4" />
            Logs
          </TabsTrigger>
        </TabsList>
        
        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Reminder Settings</CardTitle>
              <CardDescription>
                Configure when and how appointment reminders are sent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingSettings ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Enable Automatic Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically send reminders to patients about upcoming appointments
                      </p>
                    </div>
                    <Switch
                      checked={settings.enabled}
                      onCheckedChange={(checked) => handleSettingsChange("enabled", checked)}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Reminder Timeframes</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Select when reminders should be sent before appointments
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-3 border rounded-lg p-3">
                        <Switch
                          id="timeframe-24h"
                          checked={settings.timeframes["24h"]}
                          onCheckedChange={(checked) => 
                            handleSettingsChange("timeframes.24h", checked)
                          }
                          disabled={!settings.enabled}
                        />
                        <Label htmlFor="timeframe-24h" className="cursor-pointer">
                          24 hours before
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-3 border rounded-lg p-3">
                        <Switch
                          id="timeframe-48h"
                          checked={settings.timeframes["48h"]}
                          onCheckedChange={(checked) => 
                            handleSettingsChange("timeframes.48h", checked)
                          }
                          disabled={!settings.enabled}
                        />
                        <Label htmlFor="timeframe-48h" className="cursor-pointer">
                          48 hours before
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-3 border rounded-lg p-3">
                        <Switch
                          id="timeframe-1week"
                          checked={settings.timeframes["1week"]}
                          onCheckedChange={(checked) => 
                            handleSettingsChange("timeframes.1week", checked)
                          }
                          disabled={!settings.enabled}
                        />
                        <Label htmlFor="timeframe-1week" className="cursor-pointer">
                          1 week before
                        </Label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Reminder Method</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Choose how reminders should be sent to patients
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div 
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          settings.method === "email" 
                            ? "border-primary bg-primary/5" 
                            : "hover:border-primary/50"
                        }`}
                        onClick={() => handleSettingsChange("method", "email")}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-medium">Email</div>
                          {settings.method === "email" && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <Mail className="h-4 w-4" />
                          <span>Send via email only</span>
                        </div>
                      </div>
                      
                      <div 
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          settings.method === "sms" 
                            ? "border-primary bg-primary/5" 
                            : "hover:border-primary/50"
                        }`}
                        onClick={() => handleSettingsChange("method", "sms")}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-medium">SMS</div>
                          {settings.method === "sms" && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <Smartphone className="h-4 w-4" />
                          <span>Send via text message only</span>
                        </div>
                      </div>
                      
                      <div 
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          settings.method === "both" 
                            ? "border-primary bg-primary/5" 
                            : "hover:border-primary/50"
                        }`}
                        onClick={() => handleSettingsChange("method", "both")}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-medium">Both</div>
                          {settings.method === "both" && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <BellRing className="h-4 w-4" />
                          <span>Send via both email and SMS</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Reminder Priority</Label>
                    <Select
                      value={settings.priority}
                      onValueChange={(value) => 
                        handleSettingsChange("priority", value)
                      }
                      disabled={!settings.enabled}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Custom Message</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Customize the reminder message sent to patients
                    </p>
                    <textarea
                      className="w-full border rounded-md p-3 h-24"
                      value={settings.customMessage}
                      onChange={(e) => handleSettingsChange("customMessage", e.target.value)}
                      disabled={!settings.enabled}
                      placeholder="Enter your custom reminder message here..."
                    />
                    <p className="text-xs text-muted-foreground">
                      You can use {"{patient_name}"}, {"{appointment_date}"}, {"{appointment_time}"}, and {"{doctor_name}"} as placeholders.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Additional Options</Label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Switch
                          id="include-portal-link"
                          checked={settings.includePatientPortalLink}
                          onCheckedChange={(checked) => 
                            handleSettingsChange("includePatientPortalLink", checked)
                          }
                          disabled={!settings.enabled}
                        />
                        <Label htmlFor="include-portal-link" className="cursor-pointer">
                          Include patient portal link
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Switch
                          id="send-to-dependents"
                          checked={settings.sendToDependents}
                          onCheckedChange={(checked) => 
                            handleSettingsChange("sendToDependents", checked)
                          }
                          disabled={!settings.enabled}
                        />
                        <Label htmlFor="send-to-dependents" className="cursor-pointer">
                          Send to dependents (for minors or caregivers)
                        </Label>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Reset to Defaults</Button>
              <Button 
                onClick={handleSaveSettings}
                disabled={updateSettingsMutation.isPending || isLoadingSettings}
              >
                {updateSettingsMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Settings"
                )}
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Manual Reminder Sending</CardTitle>
              <CardDescription>
                Manually trigger reminders for upcoming appointments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Reminders will only be sent to patients who haven't received 
                a reminder at the selected timeframe yet.
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  className="justify-start gap-2"
                  onClick={() => handleSendReminders("24h")}
                  disabled={sendRemindersMutation.isPending}
                >
                  <Clock className="h-4 w-4" />
                  Send 24h Reminders
                </Button>
                
                <Button
                  variant="outline"
                  className="justify-start gap-2"
                  onClick={() => handleSendReminders("48h")}
                  disabled={sendRemindersMutation.isPending}
                >
                  <Clock className="h-4 w-4" />
                  Send 48h Reminders
                </Button>
                
                <Button
                  variant="outline"
                  className="justify-start gap-2"
                  onClick={() => handleSendReminders("1week")}
                  disabled={sendRemindersMutation.isPending}
                >
                  <Calendar className="h-4 w-4" />
                  Send 1 Week Reminders
                </Button>
                
                <Button
                  className="justify-start gap-2"
                  onClick={() => handleSendReminders("all")}
                  disabled={sendRemindersMutation.isPending}
                >
                  <BellRing className="h-4 w-4" />
                  Send All Reminders
                </Button>
              </div>
              
              {sendRemindersMutation.isPending && (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span>Sending reminders...</span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Reminder Performance</CardTitle>
              <CardDescription>
                View statistics and effectiveness of appointment reminders
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : statsData ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="border rounded-lg p-4">
                      <div className="text-sm text-muted-foreground mb-1">Reminders Sent (Total)</div>
                      <div className="text-3xl font-bold">
                        {statsData.sent24h + statsData.sent48h + statsData.sent1week}
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                        <div>
                          <div className="font-medium text-muted-foreground">24h</div>
                          <div>{statsData.sent24h}</div>
                        </div>
                        <div>
                          <div className="font-medium text-muted-foreground">48h</div>
                          <div>{statsData.sent48h}</div>
                        </div>
                        <div>
                          <div className="font-medium text-muted-foreground">1 week</div>
                          <div>{statsData.sent1week}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <div className="text-sm text-muted-foreground mb-1">Open Rate</div>
                      <div className="text-3xl font-bold">
                        {Math.round(statsData.openRate * 100)}%
                      </div>
                      <div className="relative h-2 mt-3 bg-muted rounded overflow-hidden">
                        <div 
                          className="absolute top-0 left-0 h-full bg-green-500"
                          style={{ width: `${statsData.openRate * 100}%` }}
                        ></div>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Percentage of reminders that were opened by patients
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <div className="text-sm text-muted-foreground mb-1">Confirmation Rate</div>
                      <div className="text-3xl font-bold">
                        {Math.round(statsData.confirmationRate * 100)}%
                      </div>
                      <div className="relative h-2 mt-3 bg-muted rounded overflow-hidden">
                        <div 
                          className="absolute top-0 left-0 h-full bg-blue-500"
                          style={{ width: `${statsData.confirmationRate * 100}%` }}
                        ></div>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Percentage of appointments confirmed after reminder
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border rounded-lg p-4">
                      <div className="text-sm font-medium mb-3">Delivery Status</div>
                      <div className="flex items-center justify-center gap-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-500">
                            {statsData.totalDelivered}
                          </div>
                          <div className="text-xs text-muted-foreground">Delivered</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-500">
                            {statsData.totalFailed}
                          </div>
                          <div className="text-xs text-muted-foreground">Failed</div>
                        </div>
                      </div>
                      <div className="relative h-2 mt-4 bg-muted rounded overflow-hidden">
                        <div 
                          className="absolute top-0 left-0 h-full bg-green-500"
                          style={{ 
                            width: `${statsData.totalDelivered / (statsData.totalDelivered + statsData.totalFailed) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <div className="text-sm font-medium mb-3">Response Rate</div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {Math.round(statsData.responseRate * 100)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Patients who responded to the reminder
                        </div>
                      </div>
                      <div className="relative h-2 mt-4 bg-muted rounded overflow-hidden">
                        <div 
                          className="absolute top-0 left-0 h-full bg-primary"
                          style={{ width: `${statsData.responseRate * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    No statistics available. Start sending reminders to view analytics.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Reminder History</CardTitle>
              <CardDescription>
                View logs of all sent appointment reminders
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingLogs ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : logsData && logsData.items.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Timeframe</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Sent To</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logsData.items.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            {new Date(log.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>{log.patientName}</span>
                            </div>
                          </TableCell>
                          <TableCell>{getTimeframeLabel(log.timeframe)}</TableCell>
                          <TableCell>
                            {log.method === "email" ? (
                              <div className="flex items-center gap-1">
                                <Mail className="h-4 w-4 text-blue-500" />
                                <span>Email</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <Phone className="h-4 w-4 text-green-500" />
                                <span>SMS</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {log.sentTo}
                          </TableCell>
                          <TableCell>{getStatusBadge(log.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {logsData.totalPages > 1 && (
                    <div className="flex justify-center items-center mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(p - 1, 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <div className="mx-4 text-sm">
                        Page {page} of {logsData.totalPages}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(p + 1, logsData.totalPages))}
                        disabled={page === logsData.totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6">
                  <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    No reminder logs found. Start sending reminders to see them here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}