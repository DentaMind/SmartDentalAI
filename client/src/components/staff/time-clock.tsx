import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CalendarDays, CalendarIcon, CheckCircle2, Clock, Download, Play, Search, Square } from "lucide-react";
import { type DateRange } from "react-day-picker";

// Types for time clock entities
type TimeClockStatus = "active" | "completed" | "approved" | "rejected" | "modified";

interface TimeClockEntry {
  id: number;
  status: TimeClockStatus;
  userId: number;
  locationId?: number;
  clockInTime: Date;
  clockOutTime: Date | null;
  totalHours: number | null;
  notes: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface TimeClockReport {
  id: number;
  userId: number;
  startDate: Date;
  endDate: Date;
  totalHours: number;
  status: "draft" | "submitted" | "approved" | "rejected";
  notes: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface Location {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

interface UserWithDetails {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface TimeClockProps {
  userId?: number;
  supervisorView?: boolean;
}

export function TimeClockComponent({ userId, supervisorView = false }: TimeClockProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeEntry, setActiveEntry] = useState<TimeClockEntry | null>(null);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 14)),
    to: new Date(),
  });
  const [notes, setNotes] = useState<string>("");

  // Fetch current user's active time clock entry
  const { data: currentEntry, refetch: refetchCurrentEntry } = useQuery<TimeClockEntry | null>({
    queryKey: ['/api/time-clock/current', userId],
    queryFn: () => apiRequest<TimeClockEntry | null>(`/api/time-clock/current${userId ? `?userId=${userId}` : ''}`),
    enabled: !!user
  });

  // Fetch user's time clock entries
  const { data: timeEntries, refetch: refetchTimeEntries } = useQuery<TimeClockEntry[]>({
    queryKey: ['/api/time-clock/entries', userId, dateRange],
    queryFn: () => apiRequest<TimeClockEntry[]>(`/api/time-clock/entries?${userId ? `userId=${userId}&` : ''}${dateRange.from ? `startDate=${dateRange.from.toISOString()}&` : ''}${dateRange.to ? `endDate=${dateRange.to.toISOString()}` : ''}`),
    enabled: !!user && (!!dateRange.from || !!dateRange.to)
  });

  // Fetch locations for dropdown
  const { data: locations } = useQuery<Location[]>({
    queryKey: ['/api/locations'],
    queryFn: () => apiRequest<Location[]>('/api/locations'),
    enabled: !!user
  });

  // Fetch users for supervisor view
  const { data: users } = useQuery<UserWithDetails[]>({
    queryKey: ['/api/users'],
    queryFn: () => apiRequest<UserWithDetails[]>('/api/users'),
    enabled: !!supervisorView && !!user && (user.role === 'doctor' || user.role === 'admin')
  });

  // Fetch time clock reports
  const { data: timeReports } = useQuery<TimeClockReport[]>({
    queryKey: ['/api/time-clock/reports', userId],
    queryFn: () => apiRequest<TimeClockReport[]>(`/api/time-clock/reports${userId ? `?userId=${userId}` : ''}`),
    enabled: !!user
  });

  // Set active entry when data is fetched
  useEffect(() => {
    if (currentEntry) {
      setActiveEntry(currentEntry);
    } else {
      setActiveEntry(null);
    }
  }, [currentEntry]);

  // Clock In mutation
  const clockInMutation = useMutation<TimeClockEntry>({
    mutationFn: async () => {
      const data = {
        userId: userId || user?.id,
        locationId: selectedLocation,
        notes: notes.trim() || null
      };
      return await apiRequest<TimeClockEntry>({
        url: '/api/time-clock/clock-in',
        method: 'POST',
        body: data
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Clocked In",
        description: `Successfully clocked in at ${format(new Date(data.clockInTime), 'h:mm a')}`,
      });
      setActiveEntry(data);
      setNotes("");
      refetchCurrentEntry();
      refetchTimeEntries();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to clock in: ${error.message}`,
      });
    }
  });

  // Clock Out mutation
  const clockOutMutation = useMutation<TimeClockEntry | null>({
    mutationFn: async () => {
      if (!activeEntry) return null;
      
      const data = {
        id: activeEntry.id,
        notes: notes.trim() || null
      };
      
      return await apiRequest<TimeClockEntry>({
        url: '/api/time-clock/clock-out',
        method: 'POST',
        body: data
      });
    },
    onSuccess: (data) => {
      if (!data) return;
      
      const hours = data.totalHours || 0;
      const minutes = Math.round((hours % 1) * 60);
      
      toast({
        title: "Clocked Out",
        description: `Successfully clocked out at ${format(new Date(data.clockOutTime), 'h:mm a')}. Total time: ${Math.floor(hours)}h ${minutes}m.`,
      });
      
      setActiveEntry(null);
      setNotes("");
      refetchCurrentEntry();
      refetchTimeEntries();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to clock out: ${error.message}`,
      });
    }
  });

  // Submit time report mutation
  const submitReportMutation = useMutation<TimeClockReport>({
    mutationFn: async () => {
      const data = {
        userId: selectedUser || userId || user?.id,
        startDate: dateRange.from,
        endDate: dateRange.to
      };
      
      return await apiRequest<TimeClockReport>({
        url: '/api/time-clock/reports',
        method: 'POST',
        body: data
      });
    },
    onSuccess: () => {
      toast({
        title: "Report Submitted",
        description: "Time report has been submitted successfully.",
      });
      
      // Invalidate reports cache
      queryClient.invalidateQueries({ queryKey: ['/api/time-clock/reports'] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to submit report: ${error.message}`,
      });
    }
  });

  // Handle clock in
  const handleClockIn = () => {
    if (!selectedLocation && !supervisorView) {
      toast({
        variant: "destructive",
        title: "Location Required",
        description: "Please select a location before clocking in.",
      });
      return;
    }
    
    clockInMutation.mutate();
  };

  // Handle clock out
  const handleClockOut = () => {
    if (!activeEntry) return;
    clockOutMutation.mutate();
  };

  // Format duration
  const formatDuration = (hours: number | null) => {
    if (hours === null) return "N/A";
    
    const h = Math.floor(hours);
    const m = Math.round((hours % 1) * 60);
    
    return `${h}h ${m}m`;
  };

  // Format date
  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return format(new Date(date instanceof Date ? date : new Date(date)), 'MMM d, yyyy h:mm a');
  };

  // Get status badge
  const getStatusBadge = (status: TimeClockStatus) => {
    switch (status) {
      case "active":
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Active</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Completed</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Rejected</Badge>;
      case "modified":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">Modified</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Get report status badge
  const getReportStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">Draft</Badge>;
      case "submitted":
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Submitted</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Get location name
  const getLocationName = (locationId: number | undefined) => {
    if (!locationId || !locations || !locations.length) return "Unknown";
    
    const location = locations.find((l: Location) => l.id === locationId);
    return location ? location.name : "Unknown";
  };

  if (supervisorView) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:gap-6">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Team Overview</CardTitle>
              <CardDescription>
                Monitor your team's time clock activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-6">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Employee</label>
                  <Select 
                    value={selectedUser?.toString() || ""} 
                    onValueChange={(value) => setSelectedUser(value ? parseInt(value) : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All employees</SelectItem>
                      {users && users.map((user: UserWithDetails) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.firstName} {user.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                  <DatePickerWithRange dateRange={dateRange} onDateRangeChange={setDateRange} />
                </div>
                
                <Button
                  onClick={() => submitReportMutation.mutate()}
                  disabled={submitReportMutation.isPending || !dateRange.from || !dateRange.to}
                  className="mt-4 md:mt-0"
                >
                  Generate Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Time Entries</CardTitle>
            <CardDescription>
              {selectedUser 
                ? "View time entries for selected employee" 
                : "View time entries for all employees"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {timeEntries && timeEntries.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeEntries.map((entry: TimeClockEntry & { user?: UserWithDetails }) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {entry.user 
                          ? `${entry.user.firstName} ${entry.user.lastName}` 
                          : `User #${entry.userId}`}
                      </TableCell>
                      <TableCell>{formatDate(entry.clockInTime)}</TableCell>
                      <TableCell>{formatDate(entry.clockOutTime)}</TableCell>
                      <TableCell>{formatDuration(entry.totalHours)}</TableCell>
                      <TableCell>{getLocationName(entry.locationId)}</TableCell>
                      <TableCell>{getStatusBadge(entry.status)}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={entry.notes || ""}>
                        {entry.notes || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center text-gray-500">
                <Clock className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No time entries found</h3>
                <p>
                  {selectedUser 
                    ? "No time entries for the selected employee in this date range." 
                    : "No time entries found for the selected date range."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Time Reports</CardTitle>
            <CardDescription>
              View and manage time reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            {timeReports && timeReports.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Total Hours</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeReports.map((report: TimeClockReport & { user?: UserWithDetails }) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        {report.user 
                          ? `${report.user.firstName} ${report.user.lastName}` 
                          : `User #${report.userId}`}
                      </TableCell>
                      <TableCell>
                        {format(new Date(report.startDate), 'MMM d')} - {format(new Date(report.endDate), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>{formatDuration(report.totalHours)}</TableCell>
                      <TableCell>{getReportStatusBadge(report.status)}</TableCell>
                      <TableCell>{formatDate(report.createdAt)}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" className="h-8 gap-1">
                          <Download className="h-3.5 w-3.5" />
                          <span>Export</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center text-gray-500">
                <CalendarDays className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No time reports</h3>
                <p>There are no time reports available.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle>Time Clock Status</CardTitle>
          <CardDescription>
            {activeEntry 
              ? `You've been clocked in since ${formatDate(activeEntry.clockInTime)}` 
              : "You are currently clocked out"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex gap-2 items-center">
              <div className={`p-3 rounded-full ${activeEntry ? "bg-green-100" : "bg-gray-100"}`}>
                {activeEntry 
                  ? <CheckCircle2 className="h-6 w-6 text-green-600" /> 
                  : <Clock className="h-6 w-6 text-gray-600" />}
              </div>
              <div>
                <h3 className="font-medium">Current Status</h3>
                <p className={activeEntry ? "text-green-600 font-medium" : "text-gray-600"}>
                  {activeEntry ? "Clocked In" : "Clocked Out"}
                </p>
              </div>
            </div>
            
            {activeEntry && (
              <div className="flex flex-col">
                <span className="text-sm text-gray-500">Location</span>
                <span className="font-medium">{getLocationName(activeEntry.locationId)}</span>
              </div>
            )}
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <Textarea
              placeholder="Add notes about your work shift..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>
          
          {!activeEntry && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Location</label>
              <Select 
                value={selectedLocation?.toString() || ""} 
                onValueChange={(value) => setSelectedLocation(value ? parseInt(value) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location..." />
                </SelectTrigger>
                <SelectContent>
                  {locations && locations.map((location: Location) => (
                    <SelectItem key={location.id} value={location.id.toString()}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
        <CardFooter>
          {activeEntry ? (
            <Button 
              variant="destructive" 
              size="lg"
              className="w-full gap-2"
              disabled={clockOutMutation.isPending}
              onClick={handleClockOut}
            >
              <Square className="h-5 w-5" />
              {clockOutMutation.isPending ? "Processing..." : "Clock Out"}
            </Button>
          ) : (
            <Button 
              size="lg"
              className="w-full gap-2"
              disabled={clockInMutation.isPending}
              onClick={handleClockIn}
            >
              <Play className="h-5 w-5" />
              {clockInMutation.isPending ? "Processing..." : "Clock In"}
            </Button>
          )}
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Your time clock history for the past 2 weeks
          </CardDescription>
        </CardHeader>
        <CardContent>
          {timeEntries && timeEntries.length > 0 ? (
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
                {timeEntries.map((entry: TimeClockEntry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{format(new Date(entry.clockInTime), 'MMM d, yyyy')}</TableCell>
                    <TableCell>{format(new Date(entry.clockInTime), 'h:mm a')}</TableCell>
                    <TableCell>
                      {entry.clockOutTime 
                        ? format(new Date(entry.clockOutTime), 'h:mm a') 
                        : "—"}
                    </TableCell>
                    <TableCell>{formatDuration(entry.totalHours)}</TableCell>
                    <TableCell>{getLocationName(entry.locationId)}</TableCell>
                    <TableCell>{getStatusBadge(entry.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <Clock className="mx-auto h-12 w-12 text-gray-300 mb-2" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No time entries</h3>
              <p>You haven't clocked in or out in the past 2 weeks.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}