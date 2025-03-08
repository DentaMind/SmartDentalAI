import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock } from "lucide-react";
import { format } from "date-fns";
import { TimeClock, TimeClockReport, Location } from "@shared/schema";

interface TimeClockProps {
  userId?: number;
  supervisorView?: boolean;
}

export function TimeClockComponent({ userId, supervisorView = false }: TimeClockProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"clock" | "history" | "reports">("clock");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [activeClock, setActiveClock] = useState<TimeClock | null>(null);
  const [dateRange, setDateRange] = useState({ 
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1), 
    endDate: new Date() 
  });

  // Get current user ID or passed userId
  const currentUserId = userId || (user?.id || 0);

  // Fetch user's active clock-in status
  const { data: activeClockData, isLoading: isLoadingActiveClock } = useQuery({
    queryKey: ['/api/timeclock/active', currentUserId],
    queryFn: () => apiRequest<TimeClock | null>(`/api/timeclock/active?userId=${currentUserId}`),
    enabled: !!currentUserId,
  });

  // Fetch locations
  const { data: locations, isLoading: isLoadingLocations } = useQuery({
    queryKey: ['/api/locations'],
    queryFn: () => apiRequest<Location[]>('/api/locations'),
  });

  // Fetch time clock history
  const { data: timeClockHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['/api/timeclock/history', currentUserId, dateRange],
    queryFn: () => apiRequest<TimeClock[]>(
      `/api/timeclock/history?userId=${currentUserId}&startDate=${dateRange.startDate.toISOString()}&endDate=${dateRange.endDate.toISOString()}`
    ),
    enabled: !!currentUserId && activeTab === "history",
  });

  // Fetch time clock reports
  const { data: timeClockReports, isLoading: isLoadingReports } = useQuery({
    queryKey: ['/api/timeclock/reports', currentUserId],
    queryFn: () => apiRequest<TimeClockReport[]>(`/api/timeclock/reports?userId=${currentUserId}`),
    enabled: !!currentUserId && activeTab === "reports",
  });

  // Clock-in mutation
  const clockInMutation = useMutation({
    mutationFn: (data: { userId: number; locationId: number; notes: string }) => 
      apiRequest<TimeClock>('/api/timeclock/clockin', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      toast({
        title: "Clocked In",
        description: `Successfully clocked in at ${format(new Date(data.clockInTime), 'h:mm a')}`,
      });
      setActiveClock(data);
      queryClient.invalidateQueries({ queryKey: ['/api/timeclock/active'] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to clock in: ${error.message}`,
      });
    }
  });

  // Clock-out mutation
  const clockOutMutation = useMutation({
    mutationFn: (data: { timeClockId: number; notes: string }) => 
      apiRequest<TimeClock>('/api/timeclock/clockout', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      toast({
        title: "Clocked Out",
        description: `Successfully clocked out at ${format(new Date(data.clockOutTime || new Date()), 'h:mm a')}`,
      });
      setActiveClock(null);
      queryClient.invalidateQueries({ queryKey: ['/api/timeclock/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/timeclock/history'] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to clock out: ${error.message}`,
      });
    }
  });

  // Initialize active clock state from data
  useEffect(() => {
    if (activeClockData) {
      setActiveClock(activeClockData);
    }
  }, [activeClockData]);

  // Handle clock in 
  const handleClockIn = () => {
    if (!selectedLocation) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a location before clocking in",
      });
      return;
    }

    clockInMutation.mutate({
      userId: currentUserId,
      locationId: parseInt(selectedLocation),
      notes,
    });
  };

  // Handle clock out
  const handleClockOut = () => {
    if (!activeClock?.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No active clock-in found",
      });
      return;
    }

    clockOutMutation.mutate({
      timeClockId: activeClock.id,
      notes,
    });
  };

  // Format time from date string
  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "—";
    return format(new Date(dateStr), 'h:mm a');
  };

  // Calculate hours worked
  const calculateHoursWorked = (clockIn: string, clockOut?: string) => {
    if (!clockOut) return "Active";
    
    const startTime = new Date(clockIn).getTime();
    const endTime = new Date(clockOut).getTime();
    const diffHours = (endTime - startTime) / (1000 * 60 * 60);
    
    return diffHours.toFixed(2);
  };

  // Format date display
  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'MMM d, yyyy');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="mr-2 h-5 w-5" />
          Time Clock System
        </CardTitle>
        <CardDescription>
          Track your work hours and manage time records
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="clock">Clock In/Out</TabsTrigger>
            <TabsTrigger value="history">Time History</TabsTrigger>
            <TabsTrigger value="reports">Pay Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="clock" className="space-y-4">
            <div className="mt-6 space-y-4">
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-base">Current Status</h3>
                  <div className="flex items-center mt-1">
                    {activeClock ? (
                      <>
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          Clocked In
                        </Badge>
                        <span className="ml-2 text-sm text-gray-500">
                          Since {formatTime(activeClock.clockInTime)}
                        </span>
                      </>
                    ) : (
                      <Badge variant="outline" className="bg-gray-100">
                        Not Clocked In
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-2xl font-bold text-primary">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <div className="space-y-4 p-4 border rounded-lg">
                {!activeClock ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Location
                      </label>
                      <Select
                        value={selectedLocation}
                        onValueChange={setSelectedLocation}
                        disabled={isLoadingLocations || clockInMutation.isPending}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations?.map((location) => (
                            <SelectItem key={location.id} value={location.id.toString()}>
                              {location.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Notes (optional)
                      </label>
                      <Textarea
                        placeholder="Add any notes about this shift"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        disabled={clockInMutation.isPending}
                      />
                    </div>

                    <Button 
                      className="w-full" 
                      onClick={handleClockIn}
                      disabled={!selectedLocation || clockInMutation.isPending}
                    >
                      {clockInMutation.isPending ? "Processing..." : "Clock In"}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Work Notes (optional)
                      </label>
                      <Textarea
                        placeholder="Add any notes about this shift"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        disabled={clockOutMutation.isPending}
                      />
                    </div>

                    <Button 
                      className="w-full bg-red-500 hover:bg-red-600" 
                      onClick={handleClockOut}
                      disabled={clockOutMutation.isPending}
                    >
                      {clockOutMutation.isPending ? "Processing..." : "Clock Out"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-4">
                <h3 className="font-medium">Time Clock History</h3>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const now = new Date();
                      setDateRange({
                        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
                        endDate: now
                      });
                    }}
                  >
                    This Month
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const now = new Date();
                      setDateRange({
                        startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
                        endDate: new Date(now.getFullYear(), now.getMonth(), 0)
                      });
                    }}
                  >
                    Last Month
                  </Button>
                </div>
              </div>

              {isLoadingHistory ? (
                <div className="text-center py-8">Loading time history...</div>
              ) : timeClockHistory && timeClockHistory.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Clock In</TableHead>
                      <TableHead>Clock Out</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeClockHistory.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{formatDate(record.workDate.toString())}</TableCell>
                        <TableCell>{formatTime(record.clockInTime)}</TableCell>
                        <TableCell>{formatTime(record.clockOutTime)}</TableCell>
                        <TableCell>
                          {calculateHoursWorked(record.clockInTime, record.clockOutTime)}
                        </TableCell>
                        <TableCell>
                          {locations?.find(l => l.id === record.locationId)?.name || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={record.status === 'approved' ? 'outline' : 'outline'}
                            className={record.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                          >
                            {record.status === 'active' ? 'In Progress' : 
                             record.status === 'completed' ? 'Pending' : 
                             record.status === 'approved' ? 'Approved' : 
                             record.status === 'rejected' ? 'Rejected' : 
                             record.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No time clock records found for this period
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <div className="space-y-4">
              <h3 className="font-medium py-4">Payroll Reports</h3>
              
              {isLoadingReports ? (
                <div className="text-center py-8">Loading reports...</div>
              ) : timeClockReports && timeClockReports.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Processed Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeClockReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          {formatDate(report.startDate.toString())} - {formatDate(report.endDate.toString())}
                        </TableCell>
                        <TableCell>{report.totalHours}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={report.status === 'paid' ? 'outline' : 'outline'}
                            className={report.status === 'paid' ? 'bg-green-100 text-green-800' : ''}
                          >
                            {report.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {report.payrollProcessedDate ? 
                            formatDate(report.payrollProcessedDate.toString()) : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No payroll reports available
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="bg-slate-50 border-t px-6 py-3">
        <div className="text-xs text-gray-500">
          Note: Please make sure to clock in and out daily. Payroll is processed every two weeks.
        </div>
      </CardFooter>
    </Card>
  );
}