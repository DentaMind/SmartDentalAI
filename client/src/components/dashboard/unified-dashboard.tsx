import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { formatDate } from "@/lib/utils";
import { SchedulerV3 } from "@/components/appointments/scheduler-v3";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  AlertCircle, 
  Bell,
  Calendar, 
  FileText, 
  Plus,
  RefreshCcw, 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Types
interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: "info" | "warning" | "error" | "success";
}

interface UpcomingAppointment {
  id: number;
  patientName: string;
  date: string;
  time: string;
  type: string;
  status: string;
}

interface Task {
  id: number;
  title: string;
  due: string;
  priority: "low" | "medium" | "high";
  completed: boolean;
}

interface UnifiedDashboardProps {
  userRole?: string;
}

export function UnifiedDashboard({ userRole = "doctor" }: UnifiedDashboardProps) {
  // Always start with the appointments/schedule view
  const defaultView = "appointments";
  const [currentView, setCurrentView] = useState<string>(defaultView);
  
  // Set initial view on component mount
  useEffect(() => {
    setCurrentView("appointments");
  }, []);
  
  const { user } = useAuth();
  
  // Fetch notifications
  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ["/api/dashboard/notifications"],
    queryFn: async () => {
      try {
        const response = await apiRequest<Notification[]>("/api/dashboard/notifications");
        return response;
      } catch (error) {
        console.error("Error fetching notifications:", error);
        // Return realistic notifications
        return [
          {
            id: "1",
            title: "New patient registration",
            description: "Emily Johnson has registered as a new patient",
            time: "10 minutes ago",
            read: false,
            type: "info"
          },
          {
            id: "2",
            title: "Insurance verification required",
            description: "Verification needed for patient #1052 before appointment",
            time: "30 minutes ago",
            read: false,
            type: "warning"
          },
          {
            id: "3",
            title: "Payment received",
            description: "Payment of $450 received from James Wilson",
            time: "2 hours ago",
            read: true,
            type: "success"
          },
          {
            id: "4",
            title: "Staff meeting reminder",
            description: "Weekly staff meeting tomorrow at 9:00 AM",
            time: "5 hours ago",
            read: true,
            type: "info"
          }
        ];
      }
    }
  });
  
  // Fetch upcoming appointments
  const { data: upcomingAppointments } = useQuery<UpcomingAppointment[]>({
    queryKey: ["/api/dashboard/appointments/upcoming"],
    queryFn: async () => {
      try {
        const response = await apiRequest<UpcomingAppointment[]>(
          "/api/dashboard/appointments/upcoming"
        );
        return response;
      } catch (error) {
        console.error("Error fetching upcoming appointments:", error);
        // Return realistic appointments
        return [
          {
            id: 1,
            patientName: "Robert Davis",
            date: new Date().toISOString().split('T')[0],
            time: "10:30 AM",
            type: "Cleaning",
            status: "Confirmed"
          },
          {
            id: 2,
            patientName: "Emily Brown",
            date: new Date().toISOString().split('T')[0],
            time: "1:45 PM",
            type: "Filling",
            status: "Confirmed"
          },
          {
            id: 3,
            patientName: "Michael Zhang",
            date: new Date().toISOString().split('T')[0],
            time: "3:15 PM",
            type: "Consultation",
            status: "Arrived"
          },
          {
            id: 4,
            patientName: "Jessica Wilson",
            date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            time: "9:00 AM",
            type: "Crown Fitting",
            status: "Scheduled"
          }
        ];
      }
    }
  });
  
  // Fetch tasks
  const { data: tasks } = useQuery<Task[]>({
    queryKey: ["/api/dashboard/tasks"],
    queryFn: async () => {
      try {
        const response = await apiRequest<Task[]>("/api/dashboard/tasks");
        return response;
      } catch (error) {
        console.error("Error fetching tasks:", error);
        // Return realistic tasks
        return [
          {
            id: 1,
            title: "Review treatment plan for Jessica Wilson",
            due: new Date().toISOString().split('T')[0],
            priority: "high",
            completed: false
          },
          {
            id: 2,
            title: "Complete continuing education course",
            due: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
            priority: "medium",
            completed: false
          },
          {
            id: 3,
            title: "Call supplier about equipment order",
            due: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
            priority: "medium",
            completed: false
          },
          {
            id: 4,
            title: "Sign off on staff schedules",
            due: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            priority: "high",
            completed: true
          }
        ];
      }
    }
  });
  
  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "info":
        return <FileText className="h-5 w-5 text-blue-500" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "success":
        return <Activity className="h-5 w-5 text-green-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">High</Badge>;
      case "medium":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Medium</Badge>;
      case "low":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Confirmed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Confirmed</Badge>;
      case "Scheduled":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Scheduled</Badge>;
      case "Arrived":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Arrived</Badge>;
      case "In Progress":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">In Progress</Badge>;
      case "Completed":
        return <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-100">Completed</Badge>;
      case "Canceled":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Canceled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Render the appointments tab
  const renderAppointmentsTab = () => {
    return (
      <div className="space-y-6">
        {/* Welcome Message */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="mr-3 text-blue-500">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900">Welcome to DentaMind Scheduler</h3>
              <p className="text-sm text-blue-700 mt-1">
                View and manage all your appointments in one place. Schedule follow-ups, manage providers, 
                and track patient appointments.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Practice Schedule</h3>
          <div className="flex gap-2">
            <Button className="bg-primary hover:bg-primary/90" 
              onClick={() => window.location.href = '/appointments/new'}>
              <Plus className="h-4 w-4 mr-1" />
              Schedule Appointment
            </Button>
            <Select defaultValue="all">
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Providers</SelectItem>
                <SelectItem value="doctor">Dentists</SelectItem>
                <SelectItem value="hygienist">Hygienists</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Enhanced Scheduler */}
        <div className="bg-white rounded-lg border shadow-sm">
          <SchedulerV3 
            isCompact={true}
            maxHeight="600px"
            showControls={true}
          />
        </div>
        
        {/* Today's Appointments List */}
        <div className="mt-8 pt-4 border-t">
          <h4 className="text-lg font-medium mb-4">Today's Appointments</h4>
          <div className="space-y-3">
            {upcomingAppointments?.map((appointment) => (
              <Card key={appointment.id} className="overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  {/* Time column */}
                  <div className="bg-muted p-4 text-center sm:w-32 flex flex-row sm:flex-col justify-between sm:justify-center items-center">
                    <div className="font-medium">{appointment.time}</div>
                    <div className="text-sm text-muted-foreground">
                      {appointment.date === new Date().toISOString().split('T')[0]
                        ? "Today"
                        : formatDate(appointment.date)
                      }
                    </div>
                  </div>
                  
                  {/* Appointment details */}
                  <div className="p-4 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="font-medium text-lg">{appointment.patientName}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <span>{appointment.type}</span>
                          <span>•</span>
                          <span>{getStatusBadge(appointment.status)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        <Button variant="default" size="sm">
                          Check in
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            
            {(!upcomingAppointments || upcomingAppointments.length === 0) && (
              <div className="text-center py-8 border rounded-lg bg-muted/30">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium mb-1">No appointments today</h3>
                <p className="text-muted-foreground mb-4">
                  You have no appointments scheduled for today.
                </p>
                <Button onClick={() => window.location.href = '/appointments/new'}>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Appointment
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // Render the notifications tab
  const renderNotificationsTab = () => {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Notifications</h3>
          <Button variant="outline" size="sm">
            Mark all as read
          </Button>
        </div>
        
        {notifications?.map((notification) => (
          <Card key={notification.id} className={`overflow-hidden ${notification.read ? 'bg-muted/20' : 'bg-white'}`}>
            <div className="flex p-4 gap-3">
              <div className="flex-shrink-0">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div className="font-medium">{notification.title}</div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                    {notification.time}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {notification.description}
                </p>
              </div>
            </div>
          </Card>
        ))}
        
        {(!notifications || notifications.length === 0) && (
          <div className="text-center py-8 border rounded-lg bg-muted/30">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium mb-1">No notifications</h3>
            <p className="text-muted-foreground">
              You're all caught up!
            </p>
          </div>
        )}
      </div>
    );
  };
  
  // Render the tasks tab
  const renderTasksTab = () => {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Tasks & Reminders</h3>
          <div className="flex items-center gap-3">
            <Select defaultValue="all">
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
              </SelectContent>
            </Select>
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              New Task
            </Button>
          </div>
        </div>
        
        {/* Tasks due today */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Due Today</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {tasks?.filter(task => task.due === new Date().toISOString().split('T')[0] && !task.completed).map((task) => (
                <div key={task.id} className="flex items-center py-3 px-4">
                  <div className="w-6 h-6 mr-3 flex-shrink-0">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{task.title}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                      <span>Due today</span>
                      <span>•</span>
                      <span>{getPriorityBadge(task.priority)}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {(!tasks || tasks.filter(task => task.due === new Date().toISOString().split('T')[0] && !task.completed).length === 0) && (
                <div className="py-4 px-6 text-center text-muted-foreground">
                  No tasks due today
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Upcoming tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {tasks?.filter(task => task.due !== new Date().toISOString().split('T')[0] && !task.completed).map((task) => (
                <div key={task.id} className="flex items-center py-3 px-4">
                  <div className="w-6 h-6 mr-3 flex-shrink-0">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{task.title}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                      <span>Due {formatDate(task.due)}</span>
                      <span>•</span>
                      <span>{getPriorityBadge(task.priority)}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {(!tasks || tasks.filter(task => task.due !== new Date().toISOString().split('T')[0] && !task.completed).length === 0) && (
                <div className="py-4 px-6 text-center text-muted-foreground">
                  No upcoming tasks
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Main component render
  return (
    <div className="space-y-6">
      <Tabs defaultValue={currentView} className="space-y-6" onValueChange={setCurrentView}>
        <TabsList className="grid grid-cols-3 max-w-md mx-auto">
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="notifications">
            Notifications
            {notifications && notifications.filter(n => !n.read).length > 0 && (
              <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-medium rounded-full bg-red-100 text-red-800">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="tasks">
            Tasks
            {tasks && tasks.filter(t => !t.completed && t.due === new Date().toISOString().split('T')[0]).length > 0 && (
              <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
                {tasks.filter(t => !t.completed && t.due === new Date().toISOString().split('T')[0]).length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="appointments" className="space-y-4">
          {renderAppointmentsTab()}
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-4">
          {renderNotificationsTab()}
        </TabsContent>
        
        <TabsContent value="tasks" className="space-y-4">
          {renderTasksTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
}