import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Info,
  Loader2,
  MoreHorizontal,
  PackagePlus,
  Plus,
  RefreshCcw,
  Search,
  UserCircle,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { WeeklySchedule } from "./weekly-schedule";

// Types
interface Doctor {
  id: number;
  name: string;
  specialization: string;
  avatar?: string;
  availableDays?: string[];
  color?: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
  doctor?: Doctor;
}

interface Appointment {
  id: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  date: string;
  timeSlot: string;
  duration: number;
  status: "confirmed" | "canceled" | "completed" | "no-show";
  type: "initial" | "follow-up" | "cleaning" | "procedure" | "emergency";
  reasonForVisit?: string;
  notes?: string;
  insuranceVerified?: boolean;
  createdAt: string;
}

interface AppointmentFormValues {
  patientId: number;
  patientName?: string;
  doctorId: number;
  date: string;
  timeSlot: string;
  duration: number;
  type: "initial" | "follow-up" | "cleaning" | "procedure" | "emergency";
  reasonForVisit?: string;
  notes?: string;
}

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  email?: string;
  phoneNumber?: string;
  insuranceProvider?: string;
}

interface AppointmentSchedulerProps {
  patientId?: number;
  initialDate?: Date;
  onAppointmentCreated?: (appointment: Appointment) => void;
  onAppointmentCanceled?: (appointmentId: number) => void;
}

export function AppointmentScheduler({
  patientId,
  initialDate,
  onAppointmentCreated,
  onAppointmentCanceled,
}: AppointmentSchedulerProps) {
  const [date, setDate] = useState<Date>(initialDate || new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [appointmentType, setAppointmentType] = useState<string>("cleaning");
  const [reasonForVisit, setReasonForVisit] = useState<string>("");
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState<string>("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [view, setView] = useState<"day" | "week" | "month">("day");
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Generate time slots from 8 AM to 5 PM with 30 minute intervals
  useEffect(() => {
    const generateTimeSlots = () => {
      const slots: TimeSlot[] = [];
      const startHour = 8;
      const endHour = 17;
      
      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          
          // For demo purposes, we'll create somewhat randomized availability
          const available = Math.random() > 0.3;
          
          slots.push({
            time,
            available
          });
        }
      }
      
      return slots;
    };
    
    // Set the time slots
    setAvailableTimeSlots(generateTimeSlots());
  }, [date, selectedDoctor]);
  
  // Reset form when dialog is closed
  useEffect(() => {
    if (!createDialogOpen) {
      setSelectedTimeSlot(null);
      setAppointmentType("cleaning");
      setReasonForVisit("");
      setDuration(30);
      setNotes("");
      
      if (!patientId) {
        setSelectedPatient(null);
        setShowPatientSearch(false);
      }
    }
  }, [createDialogOpen, patientId]);
  
  // Fetch doctors
  const { data: doctors, isLoading: isLoadingDoctors } = useQuery<Doctor[]>({
    queryKey: ["/api/doctors"],
    queryFn: async () => {
      try {
        const data = await apiRequest<Doctor[]>("/api/doctors");
        return data;
      } catch (error) {
        console.error("Failed to fetch doctors:", error);
        // Return sample doctors for demonstration
        return [
          {
            id: 1,
            name: "Dr. Jane Smith",
            specialization: "General Dentistry",
            availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
            color: "#4f46e5"
          },
          {
            id: 2,
            name: "Dr. Michael Johnson",
            specialization: "Orthodontics",
            availableDays: ["Mon", "Wed", "Fri"],
            color: "#0891b2"
          },
          {
            id: 3,
            name: "Dr. Sarah Williams",
            specialization: "Pediatric Dentistry",
            availableDays: ["Tue", "Thu"],
            color: "#7c3aed"
          }
        ];
      }
    }
  });
  
  // Fetch appointments for the selected date
  const { data: appointments, isLoading: isLoadingAppointments } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments", date.toISOString().split('T')[0], selectedDoctor],
    queryFn: async () => {
      try {
        const formattedDate = date.toISOString().split('T')[0];
        const endpoint = selectedDoctor 
          ? `/api/appointments?date=${formattedDate}&doctorId=${selectedDoctor}`
          : `/api/appointments?date=${formattedDate}`;
        
        const data = await apiRequest<Appointment[]>(endpoint);
        return data;
      } catch (error) {
        console.error("Failed to fetch appointments:", error);
        // Return sample appointments for demonstration
        return [
          {
            id: 1,
            patientId: 101,
            patientName: "Robert Davis",
            doctorId: 1,
            doctorName: "Dr. Jane Smith",
            date: date.toISOString().split('T')[0],
            timeSlot: "09:00",
            duration: 30,
            status: "confirmed",
            type: "cleaning",
            reasonForVisit: "Regular cleaning",
            insuranceVerified: true,
            createdAt: "2025-02-15T10:30:00Z"
          },
          {
            id: 2,
            patientId: 102,
            patientName: "Emily Brown",
            doctorId: 1,
            doctorName: "Dr. Jane Smith",
            date: date.toISOString().split('T')[0],
            timeSlot: "11:30",
            duration: 60,
            status: "confirmed",
            type: "procedure",
            reasonForVisit: "Root canal treatment",
            insuranceVerified: true,
            createdAt: "2025-02-20T14:15:00Z"
          },
          {
            id: 3,
            patientId: 103,
            patientName: "James Wilson",
            doctorId: 2,
            doctorName: "Dr. Michael Johnson",
            date: date.toISOString().split('T')[0],
            timeSlot: "14:00",
            duration: 45,
            status: "confirmed",
            type: "follow-up",
            reasonForVisit: "Braces adjustment",
            insuranceVerified: true,
            createdAt: "2025-02-25T09:45:00Z"
          }
        ];
      }
    },
    enabled: !!date
  });
  
  // Fetch patients for search
  const { data: patients, isLoading: isLoadingPatients } = useQuery<Patient[]>({
    queryKey: ["/api/patients", searchQuery],
    queryFn: async () => {
      try {
        const endpoint = searchQuery
          ? `/api/patients?search=${encodeURIComponent(searchQuery)}`
          : "/api/patients";
        
        const data = await apiRequest<Patient[]>(endpoint);
        return data;
      } catch (error) {
        console.error("Failed to fetch patients:", error);
        // Return sample patients for demonstration
        return [
          {
            id: 101,
            firstName: "Robert",
            lastName: "Davis",
            dateOfBirth: "1980-06-15",
            email: "rdavis@example.com",
            phoneNumber: "(617) 555-4444",
            insuranceProvider: "Delta Dental"
          },
          {
            id: 102,
            firstName: "Emily",
            lastName: "Brown",
            dateOfBirth: "1992-09-22",
            email: "ebrown@example.com",
            phoneNumber: "(617) 555-5555",
            insuranceProvider: "Cigna"
          },
          {
            id: 103,
            firstName: "James",
            lastName: "Wilson",
            dateOfBirth: "1975-03-10",
            email: "jwilson@example.com",
            phoneNumber: "(617) 555-6666",
            insuranceProvider: "Aetna"
          },
          {
            id: 104,
            firstName: "Sophie",
            lastName: "Taylor",
            dateOfBirth: "1990-11-28",
            email: "staylor@example.com",
            phoneNumber: "(617) 555-7777",
            insuranceProvider: "BlueCross"
          },
        ];
      }
    },
    enabled: showPatientSearch && !patientId
  });
  
  // Fetch single patient if patientId is provided
  const { data: singlePatient } = useQuery<Patient>({
    queryKey: ["/api/patients", patientId],
    queryFn: async () => {
      try {
        const data = await apiRequest<Patient>(`/api/patients/${patientId}`);
        return data;
      } catch (error) {
        console.error("Failed to fetch patient:", error);
        // Return a sample patient for demonstration
        return {
          id: patientId || 101,
          firstName: "Robert",
          lastName: "Davis",
          dateOfBirth: "1980-06-15",
          email: "rdavis@example.com",
          phoneNumber: "(617) 555-4444",
          insuranceProvider: "Delta Dental"
        };
      }
    },
    enabled: !!patientId,
    onSuccess: (data) => {
      setSelectedPatient(data);
    }
  });
  
  // Mutation for creating a new appointment
  const createAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: AppointmentFormValues) => {
      return apiRequest({
        method: "POST",
        url: "/api/appointments",
        body: appointmentData
      });
    },
    onSuccess: (data: Appointment) => {
      setCreateDialogOpen(false);
      
      queryClient.invalidateQueries({ 
        queryKey: ["/api/appointments", date.toISOString().split('T')[0], selectedDoctor] 
      });
      
      toast({
        title: "Appointment scheduled",
        description: `Appointment scheduled successfully for ${formatDate(data.date)} at ${data.timeSlot}`,
        variant: "default",
      });
      
      if (onAppointmentCreated) {
        onAppointmentCreated(data);
      }
    },
    onError: (error) => {
      console.error("Error creating appointment:", error);
      
      toast({
        title: "Error scheduling appointment",
        description: "There was an error scheduling the appointment. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for canceling an appointment
  const cancelAppointmentMutation = useMutation({
    mutationFn: async (appointmentId: number) => {
      return apiRequest({
        method: "PATCH",
        url: `/api/appointments/${appointmentId}`,
        body: { status: "canceled" }
      });
    },
    onSuccess: (_, appointmentId) => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/appointments", date.toISOString().split('T')[0], selectedDoctor] 
      });
      
      toast({
        title: "Appointment canceled",
        description: "The appointment has been canceled successfully.",
        variant: "default",
      });
      
      if (onAppointmentCanceled) {
        onAppointmentCanceled(appointmentId);
      }
    },
    onError: (error) => {
      console.error("Error canceling appointment:", error);
      
      toast({
        title: "Error canceling appointment",
        description: "There was an error canceling the appointment. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const handleCreateAppointment = () => {
    if (!selectedDoctor || !selectedTimeSlot || !selectedPatient) {
      toast({
        title: "Missing information",
        description: "Please select a doctor, time slot, and patient before scheduling.",
        variant: "destructive",
      });
      return;
    }
    
    const appointmentData: AppointmentFormValues = {
      patientId: selectedPatient.id,
      patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
      doctorId: selectedDoctor,
      date: date.toISOString().split('T')[0],
      timeSlot: selectedTimeSlot,
      duration: duration,
      type: appointmentType as any,
      reasonForVisit: reasonForVisit,
      notes: notes,
    };
    
    createAppointmentMutation.mutate(appointmentData);
  };
  
  // Handle canceling an appointment
  const handleCancelAppointment = (appointmentId: number) => {
    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      cancelAppointmentMutation.mutate(appointmentId);
    }
  };
  
  // Get the current day of week as a string
  const getDayOfWeek = (date: Date): string => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days[date.getDay()];
  };
  
  // Check if a doctor is available on the selected date
  const isDoctorAvailable = (doctor: Doctor): boolean => {
    if (!doctor.availableDays) return true;
    const dayOfWeek = getDayOfWeek(date);
    return doctor.availableDays.includes(dayOfWeek);
  };
  
  // Filter out unavailable doctors
  const availableDoctors = doctors?.filter(isDoctorAvailable) || [];
  
  // Get appointment duration options
  const getDurationOptions = () => {
    const options: { value: number; label: string }[] = [];
    for (let i = 15; i <= 120; i += 15) {
      options.push({ value: i, label: `${i} minutes` });
    }
    return options;
  };
  
  // Get appointment type options
  const getAppointmentTypeOptions = () => [
    { value: "cleaning", label: "Regular Cleaning" },
    { value: "initial", label: "Initial Consultation" },
    { value: "follow-up", label: "Follow-up Visit" },
    { value: "procedure", label: "Dental Procedure" },
    { value: "emergency", label: "Emergency" },
  ];
  
  // Get appointment color based on type
  const getAppointmentColor = (type: string): string => {
    switch (type) {
      case "cleaning":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "initial":
        return "bg-green-100 text-green-800 border-green-200";
      case "follow-up":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "procedure":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "emergency":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };
  
  // Get appointment status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Confirmed</Badge>;
      case "canceled":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Canceled</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Completed</Badge>;
      case "no-show":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">No-Show</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Render day view
  const renderDayView = () => {
    const filteredAppointments = appointments?.filter(appointment => 
      selectedDoctor ? appointment.doctorId === selectedDoctor : true
    ) || [];
    
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="grid grid-cols-[auto_1fr] border-b">
            {/* Time column */}
            <div className="w-24 py-2 px-4 font-medium text-center border-r">
              Time
            </div>
            
            {/* Appointments column */}
            <div className="py-2 px-4 font-medium">
              {selectedDoctor ? 
                doctors?.find(d => d.id === selectedDoctor)?.name || "Doctor" : 
                "All Doctors"}
            </div>
          </div>
          
          {/* Time slots */}
          {availableTimeSlots.map((slot, index) => {
            const slotAppointments = filteredAppointments.filter(
              apt => apt.timeSlot === slot.time
            );
            
            return (
              <div key={slot.time} className="grid grid-cols-[auto_1fr] border-b last:border-b-0">
                {/* Time */}
                <div className="w-24 py-3 px-4 text-sm text-center border-r">
                  {slot.time}
                </div>
                
                {/* Appointment slot */}
                <div className="min-h-16 py-1 px-2">
                  {slotAppointments.length > 0 ? (
                    <div className="space-y-1 py-1">
                      {slotAppointments.map(appointment => (
                        <div 
                          key={appointment.id}
                          className={`rounded-md border p-2 ${getAppointmentColor(appointment.type)}`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{appointment.patientName}</div>
                              <div className="text-xs flex items-center gap-1">
                                <UserCircle className="h-3 w-3" />
                                <span>{appointment.doctorName}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(appointment.status)}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <FileText className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <PackagePlus className="h-4 w-4 mr-2" />
                                    Check In
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={() => handleCancelAppointment(appointment.id)}
                                    disabled={appointment.status !== "confirmed"}
                                  >
                                    <X className="h-4 w-4 mr-2" />
                                    Cancel
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          {appointment.reasonForVisit && (
                            <div className="text-xs mt-1">
                              {appointment.reasonForVisit}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      className="w-full h-full justify-start text-left opacity-70 hover:opacity-100 hover:bg-gray-50"
                      onClick={() => {
                        setSelectedTimeSlot(slot.time);
                        setCreateDialogOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      <span className="text-xs">Available</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Appointment Scheduler</h2>
          <p className="text-muted-foreground">
            Schedule and manage patient appointments
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {formatDate(date)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(selectedDate) => selectedDate && setDate(selectedDate)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          <Select
            value={selectedDoctor?.toString() || ""}
            onValueChange={(value) => setSelectedDoctor(value ? parseInt(value) : null)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Doctor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Doctors</SelectItem>
              {availableDoctors?.map((doctor) => (
                <SelectItem key={doctor.id} value={doctor.id.toString()}>
                  {doctor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            onClick={() => setCreateDialogOpen(true)}
            className="gap-2 ml-auto md:ml-0"
          >
            <Plus className="h-4 w-4" />
            New Appointment
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="day" value={view} onValueChange={(v) => setView(v as any)}>
        <TabsList>
          <TabsTrigger value="day">Day</TabsTrigger>
          <TabsTrigger value="week">Week</TabsTrigger>
          <TabsTrigger value="month">Month</TabsTrigger>
        </TabsList>
        
        <TabsContent value="day" className="pt-4">
          {renderDayView()}
        </TabsContent>
        
        <TabsContent value="week" className="pt-4">
          <div className="h-64 flex items-center justify-center border rounded-lg bg-muted/30 p-6">
            <div className="text-center space-y-2">
              <Calendar className="h-10 w-10 text-muted-foreground mx-auto" />
              <h3 className="font-medium">Week View Coming Soon</h3>
              <p className="text-sm text-muted-foreground">
                This feature is under development. Please use Day view for now.
              </p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="month" className="pt-4">
          <div className="h-64 flex items-center justify-center border rounded-lg bg-muted/30 p-6">
            <div className="text-center space-y-2">
              <Calendar className="h-10 w-10 text-muted-foreground mx-auto" />
              <h3 className="font-medium">Month View Coming Soon</h3>
              <p className="text-sm text-muted-foreground">
                This feature is under development. Please use Day view for now.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Create Appointment Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Schedule New Appointment</DialogTitle>
            <DialogDescription>
              Fill in the details to schedule a new appointment.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Patient Selection */}
              <div className="space-y-2">
                <Label>Patient</Label>
                
                {patientId ? (
                  <div className="flex items-center gap-3 p-3 border rounded-md">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {selectedPatient?.firstName?.charAt(0) || ""}{selectedPatient?.lastName?.charAt(0) || ""}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{selectedPatient?.firstName} {selectedPatient?.lastName}</div>
                      <div className="text-xs text-muted-foreground">
                        {selectedPatient?.dateOfBirth && `DOB: ${formatDate(selectedPatient.dateOfBirth)}`}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    {!showPatientSearch ? (
                      <Button 
                        variant="outline" 
                        className="w-full justify-start gap-2"
                        onClick={() => setShowPatientSearch(true)}
                      >
                        <Search className="h-4 w-4" />
                        Search for a patient
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search patients by name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        
                        {isLoadingPatients ? (
                          <div className="flex justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : (
                          <div className="max-h-48 overflow-y-auto border rounded-md divide-y">
                            {patients && patients.length > 0 ? (
                              patients.map((patient) => (
                                <div
                                  key={patient.id}
                                  className="p-2 hover:bg-muted cursor-pointer"
                                  onClick={() => {
                                    setSelectedPatient(patient);
                                    setShowPatientSearch(false);
                                  }}
                                >
                                  <div className="font-medium">{patient.firstName} {patient.lastName}</div>
                                  <div className="text-xs text-muted-foreground flex items-center gap-3">
                                    <span>{patient.email}</span>
                                    <span>{patient.dateOfBirth && formatDate(patient.dateOfBirth)}</span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="p-4 text-center text-muted-foreground">
                                No patients found
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {selectedPatient && !showPatientSearch && (
                      <div className="flex items-center gap-3 p-3 mt-2 border rounded-md">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {selectedPatient.firstName.charAt(0)}{selectedPatient.lastName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-grow">
                          <div className="font-medium">{selectedPatient.firstName} {selectedPatient.lastName}</div>
                          <div className="text-xs text-muted-foreground">
                            {selectedPatient.dateOfBirth && `DOB: ${formatDate(selectedPatient.dateOfBirth)}`}
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setSelectedPatient(null);
                            setShowPatientSearch(true);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        {formatDate(date)}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(selectedDate) => selectedDate && setDate(selectedDate)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Select
                    value={selectedTimeSlot || ""}
                    onValueChange={setSelectedTimeSlot}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTimeSlots
                        .filter(slot => slot.available)
                        .map((slot) => (
                          <SelectItem key={slot.time} value={slot.time}>
                            {slot.time}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Doctor Selection */}
              <div className="space-y-2">
                <Label>Doctor</Label>
                <Select
                  value={selectedDoctor?.toString() || ""}
                  onValueChange={(value) => setSelectedDoctor(value ? parseInt(value) : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {(doctors || []).map((doctor) => (
                      <SelectItem 
                        key={doctor.id} 
                        value={doctor.id.toString()}
                        disabled={!isDoctorAvailable(doctor)}
                      >
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: doctor.color || '#6b7280' }}
                          ></span>
                          <span>{doctor.name}</span>
                          {!isDoctorAvailable(doctor) && (
                            <span className="text-xs text-muted-foreground">(Unavailable)</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Right Column */}
            <div className="space-y-6">
              {/* Appointment Type */}
              <div className="space-y-2">
                <Label>Appointment Type</Label>
                <Select
                  value={appointmentType}
                  onValueChange={setAppointmentType}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getAppointmentTypeOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Duration */}
              <div className="space-y-2">
                <Label>Duration</Label>
                <Select
                  value={duration.toString()}
                  onValueChange={(value) => setDuration(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getDurationOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Reason for Visit */}
              <div className="space-y-2">
                <Label>Reason for Visit</Label>
                <Textarea
                  placeholder="Enter reason for visit..."
                  value={reasonForVisit}
                  onChange={(e) => setReasonForVisit(e.target.value)}
                  rows={2}
                />
              </div>
              
              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  placeholder="Additional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
              
              {/* Insurance Verification */}
              <div className="flex items-start space-x-3 space-y-0">
                <Checkbox id="verify-insurance" />
                <div className="space-y-1 leading-none">
                  <Label
                    htmlFor="verify-insurance"
                    className="cursor-pointer"
                  >
                    Verify insurance before appointment
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    System will automatically verify patient's insurance coverage
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateAppointment}
              disabled={createAppointmentMutation.isPending || !selectedPatient || !selectedDoctor || !selectedTimeSlot}
            >
              {createAppointmentMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Schedule Appointment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}