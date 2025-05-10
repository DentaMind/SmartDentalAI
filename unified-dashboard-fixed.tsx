import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { formatDate } from "@/lib/utils";
import { SchedulerV3 } from "@/components/appointments/scheduler-v3";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Area,
  AreaChart, 
  Bar, 
  BarChart, 
  CartesianGrid, 
  Cell, 
  Legend, 
  Line, 
  LineChart, 
  Pie, 
  PieChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis 
} from "recharts";
import { 
  Activity, 
  AlertCircle, 
  ArrowRight, 
  BarChart2, 
  Bell,
  Building2, 
  Calendar, 
  ChevronRight, 
  Clock, 
  CreditCard, 
  DollarSign, 
  FileText, 
  Filter, 
  LayoutDashboard, 
  Loader2,
  MoreHorizontal,
  PieChart as PieChartIcon,
  Plus,
  RefreshCcw, 
  Search, 
  Settings, 
  User, 
  Users,
  Zap
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

// Types
interface DashboardStats {
  patients: {
    total: number;
    newThisMonth: number;
    activePatients: number;
    upcomingAppointments: number;
  };
  appointments: {
    today: number;
    thisWeek: number;
    completionRate: number;
    cancelationRate: number;
  };
  financials: {
    revenueThisMonth: number;
    revenueLastMonth: number;
    outstandingInvoices: number;
    insuranceClaims: number;
  };
  practice: {
    locations: number;
    providers: number;
    staff: number;
    avgDailyPatients: number;
  };
}

interface ChartData {
  patientsByMonth: Array<{
    month: string;
    new: number;
    returning: number;
  }>;
  appointmentsByStatus: Array<{
    status: string;
    count: number;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
  }>;
  insuranceDistribution: Array<{
    name: string;
    value: number;
  }>;
  patientDistributionByAge: Array<{
    age: string;
    count: number;
  }>;
  proceduresByType: Array<{
    name: string;
    count: number;
  }>;
}

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
  const [timeframe, setTimeframe] = useState<string>("month");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  // Always start with the appointments/schedule view
  const defaultView = "appointments";
  const [currentView, setCurrentView] = useState<string>(defaultView);
  
  // Set initial view on component mount
  useEffect(() => {
    setCurrentView("appointments");
  }, []);
  
  const { user } = useAuth();
  
  // Colors for consistent theme
  const colors = {
    primary: "#7c3aed", // Primary purple
    secondary: "#2dd4bf", // Teal accent
    success: "#22c55e",
    warning: "#eab308",
    error: "#ef4444",
    info: "#3b82f6",
    chart: {
      primary: ["#7c3aed", "#a78bfa", "#c4b5fd", "#ddd6fe"],
      secondary: ["#2dd4bf", "#5eead4", "#99f6e4", "#ccfbf1"],
      mixed: ["#7c3aed", "#2dd4bf", "#eab308", "#ef4444", "#3b82f6", "#ec4899"]
    },
    text: {
      primary: "#1e293b",
      secondary: "#64748b",
      muted: "#94a3b8"
    },
    background: {
      card: "#ffffff",
      page: "#f8fafc",
      highlight: "#f1f5f9"
    }
  };
  
  // Fetch dashboard stats
  const { data: stats, isLoading: isLoadingStats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats", timeframe, selectedLocation],
    queryFn: async () => {
      try {
        const response = await apiRequest<DashboardStats>(
          `/api/dashboard/stats?timeframe=${timeframe}&location=${selectedLocation}`
        );
        return response;
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        // Placeholder statistics with realistic values
        return {
          patients: {
            total: 3254,
            newThisMonth: 78,
            activePatients: 1842,
            upcomingAppointments: 153
          },
          appointments: {
            today: 28,
            thisWeek: 142,
            completionRate: 0.92,
            cancelationRate: 0.08
          },
          financials: {
            revenueThisMonth: 128750,
            revenueLastMonth: 115420,
            outstandingInvoices: 32450,
            insuranceClaims: 53
          },
          practice: {
            locations: 3,
            providers: 12,
            staff: 25,
            avgDailyPatients: 45
          }
        };
      }
    }
  });
  
  // Fetch chart data
  const { data: chartData, isLoading: isLoadingCharts } = useQuery<ChartData>({
    queryKey: ["/api/dashboard/charts", timeframe, selectedLocation],
    queryFn: async () => {
      try {
        const response = await apiRequest<ChartData>(
          `/api/dashboard/charts?timeframe=${timeframe}&location=${selectedLocation}`
        );
        return response;
      } catch (error) {
        console.error("Error fetching chart data:", error);
        
        // Generate months for chart data
        const getMonths = () => {
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const currentMonth = new Date().getMonth();
          const recentMonths = [];
          
          for (let i = 6; i >= 0; i--) {
            const monthIndex = (currentMonth - i + 12) % 12;
            recentMonths.push(months[monthIndex]);
          }
          
          return recentMonths;
        };
        
        const months = getMonths();
        
        // Create realistic chart data
        return {
          patientsByMonth: months.map((month, index) => ({
            month,
            new: Math.floor(Math.random() * 50) + 20,
            returning: Math.floor(Math.random() * 100) + 50
          })),
          appointmentsByStatus: [
            { status: "Completed", count: 285 },
            { status: "Scheduled", count: 153 },
            { status: "Canceled", count: 42 },
            { status: "No-show", count: 18 }
          ],
          revenueByMonth: months.map((month, index) => ({
            month,
            revenue: Math.floor(Math.random() * 50000) + 80000
          })),
          insuranceDistribution: [
            { name: "Delta Dental", value: 35 },
            { name: "Cigna", value: 25 },
            { name: "Aetna", value: 20 },
            { name: "BlueCross", value: 15 },
            { name: "Other", value: 5 }
          ],
          patientDistributionByAge: [
            { age: "0-18", count: 524 },
            { age: "19-35", count: 832 },
            { age: "36-50", count: 985 },
            { age: "51-65", count: 675 },
            { age: "66+", count: 238 }
          ],
          proceduresByType: [
            { name: "Cleaning", count: 325 },
            { name: "Fillings", count: 182 },
            { name: "Crowns", count: 84 },
            { name: "Root Canals", count: 46 },
            { name: "Extractions", count: 58 },
            { name: "Other", count: 92 }
          ]
        };
      }
    }
  });
  
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
  
  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
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
  
  // Calculate percent change
  const calculatePercentChange = (current: number, previous: number): string => {
    if (previous === 0) return "+100%";
    const change = ((current - previous) / previous) * 100;
    return `${change > 0 ? "+" : ""}${change.toFixed(1)}%`;
  };
  
  // Render the main overview tab
  const renderOverviewTab = () => {
    return (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Patients Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Patients</CardDescription>
              <CardTitle className="text-3xl font-bold">
                {isLoadingStats ? (
                  <div className="animate-pulse h-8 w-24 bg-muted rounded"></div>
                ) : (
                  stats?.patients.total.toLocaleString()
                )}
              </CardTitle>
              <div className="text-xs text-muted-foreground flex items-center mt-1">
                <span className="text-emerald-600 font-medium">
                  +{isLoadingStats ? "--" : stats?.patients.newThisMonth}
                </span>
                <span className="ml-1">New this month</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-1 w-full bg-muted mt-3 mb-1 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary" 
                  style={{ 
                    width: isLoadingStats ? "0%" : `${(stats?.patients.activePatients || 0) / (stats?.patients.total || 1) * 100}%` 
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Active patients: {isLoadingStats ? "--" : stats?.patients.activePatients.toLocaleString()}</span>
                <span>{isLoadingStats ? "--" : (((stats?.patients.activePatients || 0) / (stats?.patients.total || 1)) * 100).toFixed(0)}%</span>
              </div>
            </CardContent>
          </Card>

          {/* Appointments Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Today's Appointments</CardDescription>
              <CardTitle className="text-3xl font-bold">
                {isLoadingStats ? (
                  <div className="animate-pulse h-8 w-24 bg-muted rounded"></div>
                ) : (
                  stats?.appointments.today
                )}
              </CardTitle>
              <div className="text-xs text-muted-foreground flex items-center mt-1">
                <span className="font-medium">
                  {isLoadingStats ? "--" : stats?.appointments.thisWeek}
                </span>
                <span className="ml-1">Total this week</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Completion rate</div>
                  <div className="font-medium">
                    {isLoadingStats ? "--" : `${((stats?.appointments.completionRate || 0) * 100).toFixed(0)}%`}
                  </div>
                </div>
                <div className="h-8 w-8 rounded-full border-4" style={{ 
                  borderColor: colors.primary,
                  borderLeftColor: "transparent",
                  transform: `rotate(${isLoadingStats ? 0 : (stats?.appointments.completionRate || 0) * 360}deg)`,
                  transition: "transform 1s ease-in-out"
                }}></div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Monthly Revenue</CardDescription>
              <CardTitle className="text-3xl font-bold">
                {isLoadingStats ? (
                  <div className="animate-pulse h-8 w-24 bg-muted rounded"></div>
                ) : (
                  formatCurrency(stats?.financials.revenueThisMonth || 0)
                )}
              </CardTitle>
              <div className="text-xs flex items-center mt-1">
                <span className={
                  isLoadingStats
                    ? "text-muted-foreground"
                    : (stats?.financials.revenueThisMonth || 0) > (stats?.financials.revenueLastMonth || 0)
                      ? "text-emerald-600 font-medium"
                      : "text-red-600 font-medium"
                }>
                  {isLoadingStats
                    ? "--"
                    : calculatePercentChange(
                        stats?.financials.revenueThisMonth || 0,
                        stats?.financials.revenueLastMonth || 0
                      )
                  }
                </span>
                <span className="ml-1 text-muted-foreground">vs last month</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs text-muted-foreground">Outstanding</div>
                  <div className="font-medium">
                    {isLoadingStats ? "--" : formatCurrency(stats?.financials.outstandingInvoices || 0)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Claims</div>
                  <div className="font-medium">
                    {isLoadingStats ? "--" : stats?.financials.insuranceClaims}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Practice Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Practice Summary</CardDescription>
              <CardTitle className="text-3xl font-bold">
                {isLoadingStats ? (
                  <div className="animate-pulse h-8 w-24 bg-muted rounded"></div>
                ) : (
                  stats?.practice.locations
                )}
              </CardTitle>
              <div className="text-xs text-muted-foreground mt-1">
                Location{(stats?.practice.locations || 0) > 1 ? "s" : ""}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs text-muted-foreground">Providers</div>
                  <div className="font-medium">
                    {isLoadingStats ? "--" : stats?.practice.providers}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Staff</div>
                  <div className="font-medium">
                    {isLoadingStats ? "--" : stats?.practice.staff}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-muted-foreground">Avg. Daily Patients</div>
                  <div className="font-medium">
                    {isLoadingStats ? "--" : stats?.practice.avgDailyPatients}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patients By Month Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Patients By Month</CardTitle>
              <CardDescription>
                New and returning patients over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingCharts ? (
                <div className="flex items-center justify-center h-72">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={chartData?.patientsByMonth}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`${value} patients`, '']}
                      itemStyle={{ color: colors.text.primary }}
                      contentStyle={{ 
                        backgroundColor: colors.background.card,
                        borderColor: colors.background.highlight,
                      }}
                    />
                    <Legend />
                    <Bar dataKey="new" name="New Patients" stackId="a" fill={colors.chart.primary[0]} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="returning" name="Returning Patients" stackId="a" fill={colors.chart.primary[1]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Revenue Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Revenue Trend</CardTitle>
              <CardDescription>
                Monthly revenue data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingCharts ? (
                <div className="flex items-center justify-center h-72">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart
                    data={chartData?.revenueByMonth}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value as number), 'Revenue']}
                      itemStyle={{ color: colors.text.primary }}
                      contentStyle={{ 
                        backgroundColor: colors.background.card,
                        borderColor: colors.background.highlight,
                      }}
                    />
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={colors.chart.primary[0]} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={colors.chart.primary[0]} stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke={colors.chart.primary[0]} 
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Additional Charts & Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Appointment Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Appointment Status</CardTitle>
              <CardDescription>
                Distribution by status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingCharts ? (
                <div className="flex items-center justify-center h-60">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={chartData?.appointmentsByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="count"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {chartData?.appointmentsByStatus.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={colors.chart.mixed[index % colors.chart.mixed.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${value} appointments`, '']}
                      itemStyle={{ color: colors.text.primary }}
                      contentStyle={{ 
                        backgroundColor: colors.background.card,
                        borderColor: colors.background.highlight,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          
          {/* Patient By Age */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Patient Demographics</CardTitle>
              <CardDescription>
                Distribution by age group
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingCharts ? (
                <div className="flex items-center justify-center h-60">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={chartData?.patientDistributionByAge}
                    margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} horizontal={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="age" type="category" scale="band" width={40} />
                    <Tooltip 
                      formatter={(value) => [`${value} patients`, '']}
                      itemStyle={{ color: colors.text.primary }}
                      contentStyle={{ 
                        backgroundColor: colors.background.card,
                        borderColor: colors.background.highlight,
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill={colors.chart.primary[1]} 
                      radius={[0, 4, 4, 0]} 
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          
          {/* Insurance Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Insurance Distribution</CardTitle>
              <CardDescription>
                Patients by insurance provider
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingCharts ? (
                <div className="flex items-center justify-center h-60">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={chartData?.insuranceDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {chartData?.insuranceDistribution.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={colors.chart.secondary[index % colors.chart.secondary.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${value}%`, '']}
                      itemStyle={{ color: colors.text.primary }}
                      contentStyle={{ 
                        backgroundColor: colors.background.card,
                        borderColor: colors.background.highlight,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };
  
  // Render today's appointments tab
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
            <Button className="bg-primary hover:bg-primary/90">
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
            displayMode="weekly"
            allowMultipleProviders={true}
            timeIncrement={15}
            defaultView="schedule"
            userRole={userRole}
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
                          <span></span>
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
                <Button>
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
  
  // Render notifications tab
  const renderNotificationsTab = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Recent Notifications</h3>
          <Button variant="outline" size="sm">
            Mark all as read
          </Button>
        </div>
        
        <div className="space-y-3">
          {notifications?.map((notification) => (
            <div 
              key={notification.id}
              className={`p-4 border rounded-lg flex items-start gap-3 ${
                notification.read ? "" : "bg-primary/5 border-primary/20"
              }`}
            >
              <div className="mt-0.5">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div className="font-medium">{notification.title}</div>
                  <div className="text-xs text-muted-foreground">{notification.time}</div>
                </div>
                <div className="text-sm mt-1">{notification.description}</div>
              </div>
              {!notification.read && (
                <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2"></div>
              )}
            </div>
          ))}
          
          {(!notifications || notifications.length === 0) && (
            <div className="text-center py-8 border rounded-lg bg-muted/30">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium mb-1">No notifications</h3>
              <p className="text-muted-foreground">
                You're all caught up! There are no new notifications.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Render tasks tab
  const renderTasksTab = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">My Tasks</h3>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
        
        <div className="space-y-3">
          {tasks?.filter(task => !task.completed).map((task) => (
            <div 
              key={task.id}
              className="p-4 border rounded-lg"
            >
              <div className="flex items-start gap-3">
                <Checkbox id={`task-${task.id}`} />
                <div className="flex-1">
                  <label 
                    htmlFor={`task-${task.id}`} 
                    className="font-medium cursor-pointer"
                  >
                    {task.title}
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Due: {formatDate(task.due)}</span>
                    </div>
                    <div>
                      {getPriorityBadge(task.priority)}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          {tasks?.some(task => task.completed) && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <h4 className="text-sm font-medium">Completed Tasks</h4>
                <div className="h-px flex-1 bg-muted"></div>
              </div>
              
              <div className="space-y-3 opacity-60">
                {tasks?.filter(task => task.completed).map((task) => (
                  <div 
                    key={task.id}
                    className="p-4 border rounded-lg"
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox id={`task-${task.id}`} defaultChecked />
                      <div className="flex-1">
                        <label 
                          htmlFor={`task-${task.id}`} 
                          className="font-medium cursor-pointer line-through"
                        >
                          {task.title}
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Due: {formatDate(task.due)}</span>
                          </div>
                          <div>
                            {getPriorityBadge(task.priority)}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {(!tasks || tasks.length === 0) && (
            <div className="text-center py-8 border rounded-lg bg-muted/30">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium mb-1">No tasks</h3>
              <p className="text-muted-foreground mb-4">
                You have no tasks assigned at the moment.
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div>
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""}! Here's what's happening today.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select 
            value={timeframe} 
            onValueChange={setTimeframe}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={selectedLocation}
            onValueChange={setSelectedLocation}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              <SelectItem value="boston">Boston Office</SelectItem>
              <SelectItem value="cambridge">Cambridge Office</SelectItem>
              <SelectItem value="brookline">Brookline Office</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon">
            <RefreshCcw className="h-4 w-4" />
          </Button>
          
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>
      
      {/* Dashboard Views */}
      <Tabs defaultValue="appointments" value={currentView} onValueChange={setCurrentView}>
        <TabsList className="mb-6">
          <TabsTrigger value="appointments" className="gap-2">
            <Calendar className="h-4 w-4" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2">
            <FileText className="h-4 w-4" />
            Tasks
          </TabsTrigger>
        </TabsList>
        

        <TabsContent value="appointments">
          {renderAppointmentsTab()}
        </TabsContent>
        
        <TabsContent value="notifications">
          {renderNotificationsTab()}
        </TabsContent>
        
        <TabsContent value="tasks">
          {renderTasksTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
}