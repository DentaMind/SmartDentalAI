import React, { useState } from "react";
import { 
  format, addDays, subDays, setHours, setMinutes, addMinutes, 
  startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth,
  isSameDay, getDay, getDate, addMonths, subMonths, addWeeks, subWeeks
} from "date-fns";
import { 
  Calendar, Clock, Plus, Filter, MapPin, ChevronLeft, ChevronRight, 
  Calendar as CalendarIcon, AlertCircle, CheckCircle2, Clock4, 
  X, Info, Phone, User, Edit2, Trash2, Zap, Search, LayoutGrid,
  CalendarDays, CalendarClock, CalendarRange, Check, CircleAlert, CircleX
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

// Types
interface Provider {
  id: number;
  name: string;
  role: string;
  specialization?: string;
  color?: string;
}

interface SampleAppointment {
  id: number;
  patientId: number;
  patientName: string;
  date: Date;
  duration: number;
  procedureType: string;
  customProcedureName?: string;
  operatory: string;
  notes?: string;
  status: 'confirmed' | 'cancelled' | 'completed' | 'noshow' | 'pending';
  patientStatus?: 'here' | 'confirmed' | 'unconfirmed' | 'noshow';
  providerId: number;
}

type AppointmentStatus = 'confirmed' | 'cancelled' | 'completed' | 'noshow' | 'pending';

// Mock data for providers
const providers: Provider[] = [
  { 
    id: 1, 
    name: "Dr. Abdin", 
    role: "doctor", 
    specialization: "General Dentist",
    color: "#4338ca" // indigo-700
  },
  { 
    id: 2, 
    name: "Mary RDH", 
    role: "hygienist", 
    specialization: "Hygienist",
    color: "#0284c7" // sky-600
  }
];

// Mock data for patients
const patients = [
  {
    id: 1,
    firstName: "Sarah",
    lastName: "Johnson",
    dateOfBirth: "1985-05-12",
    insuranceProvider: "Delta Dental",
    insuranceNumber: "DD12345678",
    phoneNumber: "555-123-4567",
    email: "sarah.johnson@example.com",
    profileImage: "/assets/patient-sarah.jpg"
  },
  {
    id: 2,
    firstName: "Michael",
    lastName: "Williams",
    dateOfBirth: "1975-08-23",
    insuranceProvider: "Cigna Dental",
    insuranceNumber: "CG987654321",
    phoneNumber: "555-987-6543",
    email: "michael.williams@example.com",
    profileImage: "/assets/patient-michael.jpg"
  }
];

// Sample appointments for the scheduler
const sampleAppointments: SampleAppointment[] = [
  // Dr. Abdin's appointments
  {
    id: 1,
    patientId: 1,
    patientName: "Sarah Johnson",
    date: setMinutes(setHours(new Date(), 8), 0),
    duration: 60,
    procedureType: "Comprehensive Exam",
    notes: "Comprehensive exam - new patient",
    status: "confirmed",
    operatory: "Room 1",
    providerId: 1
  },
  {
    id: 2,
    patientId: 2,
    patientName: "Michael Williams",
    date: setMinutes(setHours(new Date(), 9), 0),
    duration: 90,
    procedureType: "Crown Prep",
    notes: "Crown prep for tooth #19",
    status: "confirmed",
    operatory: "Room 2",
    providerId: 1
  },
  // Mary RDH's appointments (Hygienist)
  {
    id: 7,
    patientId: 1,
    patientName: "Sarah Johnson",
    date: setMinutes(setHours(new Date(), 7), 0),
    duration: 60,
    procedureType: "Prophylaxis",
    notes: "Regular cleaning",
    status: "confirmed",
    operatory: "Hygiene Room 1",
    providerId: 2
  },
  {
    id: 8,
    patientId: 2,
    patientName: "Michael Williams",
    date: setMinutes(setHours(new Date(), 8), 0),
    duration: 60,
    procedureType: "Perio Maintenance",
    notes: "Periodontal maintenance",
    status: "confirmed",
    operatory: "Hygiene Room 1",
    providerId: 2
  }
];

// Mapping procedure types to colors for visual distinction
const procedureTypeColors: Record<string, string> = {
  "Comprehensive Exam": "bg-indigo-200 hover:bg-indigo-300 text-indigo-800",
  "Crown Prep": "bg-amber-200 hover:bg-amber-300 text-amber-800",
  "Root Canal": "bg-purple-200 hover:bg-purple-300 text-purple-800",
  "Composite": "bg-yellow-200 hover:bg-yellow-300 text-yellow-800",
  "Recement Crown": "bg-rose-200 hover:bg-rose-300 text-rose-800",
  "Prophylaxis": "bg-green-200 hover:bg-green-300 text-green-800",
  "Perio Maintenance": "bg-emerald-200 hover:bg-emerald-300 text-emerald-800"
};

/**
 * Props for the enhanced scheduler component
 */
interface SchedulerV3Props {
  /** Whether the scheduler is being displayed in compact mode (e.g. on dashboard) */
  isCompact?: boolean;
  /** Maximum height for the scheduler content */
  maxHeight?: string;
  /** Whether to show the search bar and filter options */
  showControls?: boolean;
  /** Whether to show notification banners */
  showNotifications?: boolean;
  /** Initial date to display (defaults to today) */
  initialDate?: Date;
  /** Optional custom list of providers (defaults to internal providers) */
  customProviders?: Provider[];
  /** Optional custom list of appointments (defaults to internal appointments) */
  customAppointments?: SampleAppointment[];
}

/**
 * Enhanced scheduler component with provider columns
 * Supports both full-page scheduling and compact dashboard views
 */
// Define view mode type
type ViewMode = "day" | "week";

export function SchedulerV3({
  isCompact = false,
  maxHeight = '800px',
  showControls = true,
  showNotifications = true,
  initialDate = new Date(),
  customProviders,
  customAppointments
}: SchedulerV3Props = {}) {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState<Date>(initialDate);
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [appointments, setAppointments] = useState<SampleAppointment[]>(customAppointments || sampleAppointments);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeProviders, setActiveProviders] = useState<Provider[]>(customProviders || providers);
  const [selectedAppointment, setSelectedAppointment] = useState<SampleAppointment | null>(null);
  const [isNewAppointment, setIsNewAppointment] = useState(false);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // New appointment form state
  const [newAppointmentState, setNewAppointmentState] = useState({
    patientId: 1,
    patientName: "Sarah Johnson",
    date: new Date(),
    duration: 30,
    procedureType: "Comprehensive Exam",
    customProcedureName: "",
    operatory: "Room 1",
    notes: "",
    status: "confirmed" as AppointmentStatus,
    patientStatus: "confirmed" as 'here' | 'confirmed' | 'unconfirmed' | 'noshow',
    providerId: 1
  });
  
  // Show custom procedure name input when "Other" is selected
  const [showCustomProcedure, setShowCustomProcedure] = useState(false);
  
  // Available operatories 
  const operatories = [
    { id: "op1", name: "Operatory 1", type: "treatment" },
    { id: "op2", name: "Operatory 2", type: "treatment" },
    { id: "op3", name: "Operatory 3", type: "treatment" },
    { id: "hyg1", name: "Hygiene Op 1", type: "hygiene" },
    { id: "hyg2", name: "Hygiene Op 2", type: "hygiene" }
  ];
  
  // Time slot generation (7am to 5pm in 15-minute increments)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 7; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const showLabel = minute === 0 || minute === 30;
        slots.push({
          hour,
          minute,
          label: showLabel ? format(setMinutes(setHours(new Date(), hour), minute), "h:mm a") : "",
          isHour: minute === 0,
          isHalfHour: minute === 30
        });
      }
    }
    return slots;
  };
  
  const timeSlots = generateTimeSlots();
  
  // Helper function for creating a new appointment at a specific time slot
  const createAppointmentAt = (hour: number, minute: number, operatory: string, providerId: number) => {
    // Create appointment date from current date and selected time
    const appointmentDate = new Date(currentDate);
    appointmentDate.setHours(hour, minute, 0, 0);
    
    // Set default appointment data
    setNewAppointmentState({
      patientId: 1,
      patientName: "Sarah Johnson", // Default patient
      date: appointmentDate,
      duration: 30, // Default duration
      procedureType: "Comprehensive Exam",
      customProcedureName: "",
      operatory: operatory,
      notes: "",
      status: "confirmed" as AppointmentStatus,
      patientStatus: "confirmed" as 'here' | 'confirmed' | 'unconfirmed' | 'noshow',
      providerId: providerId
    });
    
    setIsNewAppointment(true);
    setAppointmentDialogOpen(true);
  };
  
  // Handle date navigation based on current view mode
  const navigateDate = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      switch(viewMode) {
        case 'day':
          return direction === 'next' ? addDays(prev, 1) : subDays(prev, 1);
        case 'week':
          return direction === 'next' ? addDays(prev, 7) : subDays(prev, 7);
        default:
          return direction === 'next' ? addDays(prev, 1) : subDays(prev, 1);
      }
    });
  };
  
  // Helper function to get patient details by ID
  const getPatientById = (patientId: number) => {
    return patients.find(p => p.id === patientId);
  };
  
  // Get provider by ID
  const getProviderById = (providerId: number) => {
    return providers.find(p => p.id === providerId);
  };
  
  // Helper function to get all appointments for a time slot for a specific provider
  // This allows for side booking (multiple appointments in the same slot)
  const getAppointmentsForTimeSlot = (hour: number, minute: number, providerId: number) => {
    return appointments.filter(appointment => {
      const apptDate = new Date(appointment.date);
      return (
        appointment.providerId === providerId &&
        apptDate.getHours() === hour &&
        apptDate.getMinutes() === minute &&
        apptDate.getDate() === currentDate.getDate() &&
        apptDate.getMonth() === currentDate.getMonth() &&
        apptDate.getFullYear() === currentDate.getFullYear()
      );
    });
  };
  
  // Legacy function for backward compatibility
  const getAppointmentForTimeSlot = (hour: number, minute: number, providerId: number) => {
    const appointments = getAppointmentsForTimeSlot(hour, minute, providerId);
    return appointments.length > 0 ? appointments[0] : undefined;
  };
  
  // Save appointment (create new or update existing)
  const saveAppointment = () => {
    if (isNewAppointment) {
      // Create new appointment with a unique ID
      const newId = Math.max(...appointments.map(a => a.id)) + 1;
      const newAppointment: SampleAppointment = {
        ...newAppointmentState,
        id: newId,
        status: newAppointmentState.status
      };
      
      setAppointments([...appointments, newAppointment]);
      toast({
        title: "Appointment created",
        description: `Appointment for ${newAppointment.patientName} on ${format(newAppointment.date, 'MMM d, yyyy h:mm a')} has been created.`,
      });
    } else if (selectedAppointment) {
      // Update existing appointment
      const updatedAppointments = appointments.map(appt => 
        appt.id === selectedAppointment.id ? 
          {...appt, ...newAppointmentState, status: newAppointmentState.status } as SampleAppointment 
          : appt
      );
      setAppointments(updatedAppointments);
      toast({
        title: "Appointment updated",
        description: `Appointment for ${newAppointmentState.patientName} has been updated.`,
      });
    }
    
    setAppointmentDialogOpen(false);
    setEditDialogOpen(false);
    setSelectedAppointment(null);
  };
  
  // Delete selected appointment
  const deleteAppointment = () => {
    if (selectedAppointment) {
      const updatedAppointments = appointments.filter(appt => appt.id !== selectedAppointment.id);
      setAppointments(updatedAppointments);
      toast({
        title: "Appointment deleted",
        description: `Appointment for ${selectedAppointment.patientName} has been deleted.`,
        variant: "destructive",
      });
      setDeleteDialogOpen(false);
      setSelectedAppointment(null);
    }
  };
  
  // Edit appointment handler
  const handleEditAppointment = (appointment: SampleAppointment) => {
    setSelectedAppointment(appointment);
    setShowCustomProcedure(appointment.procedureType === "Other");
    setNewAppointmentState({
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      date: new Date(appointment.date),
      duration: appointment.duration,
      procedureType: appointment.procedureType,
      customProcedureName: appointment.customProcedureName || "",
      operatory: appointment.operatory,
      notes: appointment.notes || "",
      status: appointment.status,
      patientStatus: appointment.patientStatus || "confirmed",
      providerId: appointment.providerId
    });
    setIsNewAppointment(false);
    setEditDialogOpen(true);
  };
  
  // Handle empty cell click to create a new appointment
  const handleEmptyCellClick = (hour: number, minute: number, operatory: string, providerId: number) => {
    createAppointmentAt(hour, minute, operatory, providerId);
  };
  
  // Render appointment card with hover behavior
  const renderAppointment = (appointment: SampleAppointment) => {
    if (!appointment) return null;
    
    const patient = getPatientById(appointment.patientId);
    
    return (
      <HoverCard>
        <HoverCardTrigger asChild>
          <div 
            className={`${procedureTypeColors[appointment.procedureType]} p-1 rounded-md mb-1 cursor-pointer hover:shadow-md transition-shadow duration-200 relative min-h-[50px] overflow-hidden`}
            onClick={() => handleEditAppointment(appointment)}
          >
            <div className="flex items-center mb-1">
              <Badge variant="outline" className="bg-white">
                {appointment.operatory}
              </Badge>
            </div>
            <div className="flex items-center">
              <div className="mr-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback>
                    {appointment.patientName.split(' ').map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1 min-w-0">
                <h5 
                  className="font-semibold text-xs truncate cursor-pointer hover:underline" 
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering the parent click
                    handleEditAppointment(appointment);
                  }}
                >
                  {appointment.patientName}
                </h5>
                <p className="text-xs truncate">
                  {format(new Date(appointment.date), "h:mm a")} - 
                  {format(
                    new Date(new Date(appointment.date).getTime() + appointment.duration * 60000),
                    "h:mm a"
                  )}
                </p>
              </div>
            </div>
            <div className="text-xs mt-1 truncate">
              <span className="font-medium">
                {appointment.procedureType === "Other" 
                  ? (appointment.customProcedureName || "Custom Procedure") 
                  : appointment.procedureType}
              </span>
            </div>
            <div className="absolute bottom-1 right-1 flex items-center space-x-1">
              {/* Patient Status Indicator */}
              {appointment.patientStatus && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={`h-3 w-3 rounded-full ${
                        appointment.patientStatus === 'here' ? 'bg-green-500' :
                        appointment.patientStatus === 'confirmed' ? 'bg-blue-500' :
                        appointment.patientStatus === 'unconfirmed' ? 'bg-red-500' :
                        appointment.patientStatus === 'noshow' ? 'bg-orange-500' : 'bg-gray-500'
                      }`} />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
                        {appointment.patientStatus === 'here' ? 'Patient is here' :
                         appointment.patientStatus === 'confirmed' ? 'Confirmed' :
                         appointment.patientStatus === 'unconfirmed' ? 'Unconfirmed' :
                         appointment.patientStatus === 'noshow' ? 'No show' : 'Unknown status'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {/* Appointment Status Indicator */}
              {appointment.status === 'confirmed' && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Confirmed</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {appointment.status === 'pending' && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Pending confirmation</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {appointment.status === 'cancelled' && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <X className="h-4 w-4 text-red-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Cancelled</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </HoverCardTrigger>
        <HoverCardContent className="w-72">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-indigo-100 text-indigo-800">
                  {appointment.patientName.split(' ').map((n: string) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="text-sm font-semibold">{appointment.patientName}</h4>
                <p className="text-xs text-muted-foreground">
                  {patient?.dateOfBirth 
                    ? `DOB: ${format(new Date(patient.dateOfBirth), "MMM d, yyyy")}` 
                    : 'No DOB'}
                </p>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center text-xs">
                <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                <span>{format(new Date(appointment.date), "EEEE, MMMM d, yyyy")}</span>
              </div>
              <div className="flex items-center text-xs">
                <Clock className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                <span>
                  {format(new Date(appointment.date), "h:mm a")} - 
                  {format(
                    new Date(new Date(appointment.date).getTime() + appointment.duration * 60000),
                    "h:mm a"
                  )} ({appointment.duration} min)
                </span>
              </div>
              <div className="flex items-center text-xs">
                <MapPin className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                <span>{appointment.operatory}</span>
              </div>
              {patient?.insuranceProvider && (
                <div className="flex items-center text-xs">
                  <Info className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  <span>{patient.insuranceProvider}</span>
                </div>
              )}
              {patient?.phoneNumber && (
                <div className="flex items-center text-xs">
                  <Phone className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  <span>{patient.phoneNumber}</span>
                </div>
              )}
            </div>
            
            <div className="pt-2 border-t">
              <h5 className="text-xs font-medium mb-1 flex items-center">
                <User className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                Procedure Details
              </h5>
              <div className="px-2 py-1 text-xs bg-muted rounded-sm">
                {appointment.notes || "No notes"}
              </div>
            </div>
            
            <div className="flex justify-between pt-2">
              <div className="flex items-center space-x-2">
                <Badge variant={
                  appointment.status === 'confirmed' ? 'default' : 
                  appointment.status === 'pending' ? 'outline' :
                  appointment.status === 'cancelled' ? 'destructive' : 'secondary'
                }>
                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                </Badge>
                
                {appointment.patientStatus && (
                  <Badge variant="outline" className={`
                    ${appointment.patientStatus === 'here' ? 'bg-green-100 text-green-800 border-green-300' : 
                      appointment.patientStatus === 'confirmed' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                      appointment.patientStatus === 'unconfirmed' ? 'bg-red-100 text-red-800 border-red-300' :
                      appointment.patientStatus === 'noshow' ? 'bg-orange-100 text-orange-800 border-orange-300' : ''
                    }
                  `}>
                    <div className="flex items-center space-x-1">
                      <div className={`h-2 w-2 rounded-full ${
                        appointment.patientStatus === 'here' ? 'bg-green-500' :
                        appointment.patientStatus === 'confirmed' ? 'bg-blue-500' :
                        appointment.patientStatus === 'unconfirmed' ? 'bg-red-500' :
                        appointment.patientStatus === 'noshow' ? 'bg-orange-500' : 'bg-gray-500'
                      }`} />
                      <span>
                        {appointment.patientStatus === 'here' ? 'Here' :
                         appointment.patientStatus === 'confirmed' ? 'Confirmed' :
                         appointment.patientStatus === 'unconfirmed' ? 'Unconfirmed' :
                         appointment.patientStatus === 'noshow' ? 'No Show' : 'Unknown'}
                      </span>
                    </div>
                  </Badge>
                )}
              </div>
              
              <div className="flex space-x-1">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-7 px-2"
                    onClick={() => handleEditAppointment(appointment)}
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    className="h-7 px-2 bg-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Navigate to patient profile - using direct navigation instead of window.location
                      window.open(`/patients/${appointment.patientId}`, '_blank');
                    }}
                  >
                    <User className="h-3.5 w-3.5 mr-1" />
                    Profile
                  </Button>
              </div>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  };
  
  // Render empty time slot
  const renderEmptySlot = (hour: number, minute: number, providerId: number, operatory: string) => {
    return (
      <div 
        className="h-full w-full cursor-pointer hover:bg-gray-50"
        onClick={() => handleEmptyCellClick(hour, minute, operatory, providerId)}
      >
        <div className="h-full w-full rounded-md border-dashed border border-gray-200 hover:border-gray-400 flex items-center justify-center">
          <Plus className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100" />
        </div>
      </div>
    );
  };
  
  // Various notification states for the scheduler
  const schedulerNotifications = {
    gaps: {
      title: "Schedule gaps detected",
      description: "There are open time slots that could be filled with appointments.",
      icon: <AlertCircle className="h-4 w-4" />,
      variant: "default" as const
    },
    noShows: {
      title: "Potential no-shows today",
      description: "2 patients have previously missed appointments.",
      icon: <Info className="h-4 w-4" />,
      variant: "outline" as const
    },
    waitlist: {
      title: "Patients on waitlist",
      description: "3 patients are waiting for earlier appointment times.",
      icon: <Clock4 className="h-4 w-4" />,
      variant: "default" as const
    }
  };

  // Render a notification banner
  const renderNotification = (notification: { title: string; description: string; icon: React.ReactNode; variant: "default" | "outline" | "secondary" | "destructive" }) => {
    return (
      <div className={`mb-3 p-3 border rounded-md flex items-start space-x-2 bg-background
        ${notification.variant === "default" ? "border-blue-200 bg-blue-50" : 
          notification.variant === "destructive" ? "border-red-200 bg-red-50" :
          notification.variant === "outline" ? "border-gray-200" : "border-gray-200 bg-gray-50"}`
      }>
        <div className="shrink-0 text-blue-500">
          {notification.icon}
        </div>
        <div className="flex-1 space-y-1">
          <h4 className="text-sm font-medium">{notification.title}</h4>
          <p className="text-xs text-muted-foreground">{notification.description}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <>
      {/* Appointment Creation/Edit Dialog */}
      <Dialog open={appointmentDialogOpen} onOpenChange={setAppointmentDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{isNewAppointment ? "Create New Appointment" : "Edit Appointment"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="patient" className="text-right">Patient</Label>
              <Select
                value={newAppointmentState.patientId.toString()}
                onValueChange={(value) => {
                  const patientId = parseInt(value);
                  const patient = getPatientById(patientId);
                  setNewAppointmentState({
                    ...newAppointmentState,
                    patientId,
                    patientName: patient ? `${patient.firstName} ${patient.lastName}` : "Unknown"
                  });
                }}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map(patient => (
                    <SelectItem key={patient.id} value={patient.id.toString()}>
                      {patient.firstName} {patient.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">Date & Time</Label>
              <div className="col-span-3 flex space-x-2">
                <Input
                  id="date"
                  type="date"
                  className="flex-1"
                  value={format(newAppointmentState.date, "yyyy-MM-dd")}
                  onChange={(e) => {
                    const newDate = new Date(newAppointmentState.date);
                    const [year, month, day] = e.target.value.split('-').map(Number);
                    newDate.setFullYear(year, month - 1, day);
                    setNewAppointmentState({
                      ...newAppointmentState,
                      date: newDate
                    });
                  }}
                />
                <Input
                  id="time"
                  type="time"
                  className="w-32"
                  value={format(newAppointmentState.date, "HH:mm")}
                  onChange={(e) => {
                    const newDate = new Date(newAppointmentState.date);
                    const [hours, minutes] = e.target.value.split(':').map(Number);
                    newDate.setHours(hours, minutes);
                    setNewAppointmentState({
                      ...newAppointmentState,
                      date: newDate
                    });
                  }}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="duration" className="text-right">Duration (min)</Label>
              <Select
                value={newAppointmentState.duration.toString()}
                onValueChange={(value) => {
                  setNewAppointmentState({
                    ...newAppointmentState,
                    duration: parseInt(value)
                  });
                }}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="procedureType" className="text-right">Procedure</Label>
              <Select
                value={newAppointmentState.procedureType}
                onValueChange={(value) => {
                  setShowCustomProcedure(value === "Other");
                  setNewAppointmentState({
                    ...newAppointmentState,
                    procedureType: value
                  });
                }}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select procedure" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Comprehensive Exam">Comprehensive Exam</SelectItem>
                  <SelectItem value="Crown Prep">Crown Prep</SelectItem>
                  <SelectItem value="Root Canal">Root Canal</SelectItem>
                  <SelectItem value="Composite">Composite Filling</SelectItem>
                  <SelectItem value="Recement Crown">Recement Crown</SelectItem>
                  <SelectItem value="Prophylaxis">Prophylaxis (Cleaning)</SelectItem>
                  <SelectItem value="Perio Maintenance">Periodontal Maintenance</SelectItem>
                  <SelectItem value="Other">Other (Manual Entry)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {showCustomProcedure && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="customProcedureName" className="text-right">Procedure Name</Label>
                <Input
                  id="customProcedureName"
                  className="col-span-3"
                  placeholder="Enter custom procedure name"
                  value={newAppointmentState.customProcedureName}
                  onChange={(e) => {
                    setNewAppointmentState({
                      ...newAppointmentState,
                      customProcedureName: e.target.value
                    });
                  }}
                />
              </div>
            )}
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="operatory" className="text-right">Operatory</Label>
              <Select
                value={newAppointmentState.operatory}
                onValueChange={(value) => {
                  setNewAppointmentState({
                    ...newAppointmentState,
                    operatory: value
                  });
                }}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select operatory" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Room 1">Operatory 1</SelectItem>
                  <SelectItem value="Room 2">Operatory 2</SelectItem>
                  <SelectItem value="Room 3">Operatory 3</SelectItem>
                  <SelectItem value="Hygiene Room 1">Hygiene Room 1</SelectItem>
                  <SelectItem value="Hygiene Room 2">Hygiene Room 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="provider" className="text-right">Provider</Label>
              <Select
                value={newAppointmentState.providerId.toString()}
                onValueChange={(value) => {
                  setNewAppointmentState({
                    ...newAppointmentState,
                    providerId: parseInt(value)
                  });
                }}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map(provider => (
                    <SelectItem key={provider.id} value={provider.id.toString()}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">Status</Label>
              <Select
                value={newAppointmentState.status}
                onValueChange={(value) => {
                  setNewAppointmentState({
                    ...newAppointmentState,
                    status: value as AppointmentStatus
                  });
                }}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="noshow">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="patientStatus" className="text-right">Patient Status</Label>
              <Select
                value={newAppointmentState.patientStatus}
                onValueChange={(value) => {
                  setNewAppointmentState({
                    ...newAppointmentState,
                    patientStatus: value as 'here' | 'confirmed' | 'unconfirmed' | 'noshow'
                  });
                }}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select patient status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="here">
                    <div className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                      Patient is Here
                    </div>
                  </SelectItem>
                  <SelectItem value="confirmed">
                    <div className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
                      Confirmed
                    </div>
                  </SelectItem>
                  <SelectItem value="unconfirmed">
                    <div className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-red-500 mr-2"></div>
                      Unconfirmed
                    </div>
                  </SelectItem>
                  <SelectItem value="noshow">
                    <div className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-orange-500 mr-2"></div>
                      No Show
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="notes" className="text-right pt-2">Notes</Label>
              <Textarea
                id="notes"
                className="col-span-3"
                placeholder="Add appointment notes here..."
                value={newAppointmentState.notes}
                onChange={(e) => {
                  setNewAppointmentState({
                    ...newAppointmentState,
                    notes: e.target.value
                  });
                }}
              />
            </div>
          </div>
          <DialogFooter className="flex space-x-2">
            {!isNewAppointment && (
              <Button 
                variant="destructive" 
                onClick={() => {
                  setAppointmentDialogOpen(false);
                  setDeleteDialogOpen(true);
                }}
              >
                Delete
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => setAppointmentDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={saveAppointment}>
              {isNewAppointment ? "Create Appointment" : "Update Appointment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this appointment for {selectedAppointment?.patientName}? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={deleteAppointment}
            >
              Delete Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Main Schedule Card */}
      <Card className="w-full">
        <CardHeader className={`${isCompact ? 'p-2' : 'p-4'} pb-0`}>
          {/* Notification Area */}
          {showNotifications && (
            <div className="mb-3">
              {renderNotification(schedulerNotifications.gaps)}
              {renderNotification(schedulerNotifications.noShows)}
              {renderNotification(schedulerNotifications.waitlist)}
            </div>
          )}
        
          <div className={`flex ${isCompact ? 'flex-col space-y-2' : 'justify-between items-center'}`}>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => navigateDate('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2 text-primary" />
                <CardTitle className={`${isCompact ? 'text-base' : 'text-lg'} font-medium`}>
                  {format(currentDate, "EEEE, MMMM d, yyyy")}
                </CardTitle>
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => navigateDate('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentDate(new Date())}
                className="ml-2"
              >
                Today
              </Button>
            </div>
            
            {showControls && (
              <div className={`flex items-center ${isCompact ? 'justify-between w-full' : 'space-x-2'}`}>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <Input
                      placeholder="Search patients..."
                      className={`${isCompact ? "w-36" : "w-48"} pl-9`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  {!isCompact && (
                    <Select 
                      value={viewMode}
                      onValueChange={(value: 'day' | 'week') => setViewMode(value)}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="View" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Day View</SelectItem>
                        <SelectItem value="week">Week View</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                
                <Button 
                  size="sm"
                  onClick={() => {
                    const now = new Date();
                    createAppointmentAt(now.getHours(), now.getMinutes(), "Room 1", 1);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {isCompact ? "New" : "New Appointment"}
                </Button>
              </div>
            )}
          </div>
          
          {viewMode === 'day' && (
            <div className="flex mt-4 border-b pb-1 font-medium text-sm text-center">
              <div className="w-16">Time</div>
              {activeProviders.map(provider => (
                <div 
                  key={provider.id} 
                  className="flex-1 px-2"
                  style={{ borderLeft: `4px solid ${provider.color || '#888'}` }}
                >
                  {provider.name}
                  <Badge variant="outline" className="ml-2">
                    {provider.role === 'doctor' ? 'Doctor' : 'Hygienist'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
          
          {viewMode === 'week' && (
            <div className="flex mt-4 border-b pb-1 font-medium text-sm text-center">
              <div className="w-16">Time</div>
              <div className="flex-1 flex justify-between">
                {Array.from({ length: 7 }).map((_, dayIndex) => {
                  const day = new Date(startOfWeek(currentDate));
                  day.setDate(day.getDate() + dayIndex);
                  return (
                    <div key={`weekday-${dayIndex}`} className="px-2 flex-1 text-center">
                      {format(day, 'EEE')}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardHeader>
        
        <CardContent className={`p-0 overflow-auto max-h-${maxHeight}`}>
          {viewMode === 'day' && (
            <div className="flex min-w-full">
              {/* Time column */}
              <div className="w-16 bg-gray-50 border-r sticky left-0 z-10">
                {timeSlots.map((timeSlot, index) => (
                  <div 
                    key={`time-${index}`}
                    className={`h-16 border-b flex items-center justify-center text-xs font-medium text-gray-600
                      ${timeSlot.isHour ? 'bg-gray-100' : ''}`}
                  >
                    {timeSlot.label}
                  </div>
                ))}
              </div>
              
              {/* Provider columns */}
              {activeProviders.map(provider => (
                <div key={provider.id} className="flex-1 min-w-[220px]">
                  {timeSlots.map((timeSlot, index) => {
                    const slotAppointments = getAppointmentsForTimeSlot(
                      timeSlot.hour, 
                      timeSlot.minute, 
                      provider.id
                    );
                    
                    // Determine which operatory to use based on provider role
                    const operatory = provider.role === 'doctor' ? 'Room 1' : 'Hygiene Room 1';
                    
                    return (
                      <div 
                        key={`slot-${provider.id}-${index}`}
                        className={`h-16 border-b border-r p-1 relative group
                          ${timeSlot.isHour ? 'bg-gray-50' : ''}`}
                      >
                        {slotAppointments.length > 0 ? (
                          <div className="flex h-full space-x-1 overflow-x-auto">
                            {slotAppointments.map((appointment, appIdx) => (
                              <div key={`app-${appointment.id}`} className="flex-1 min-w-0" style={{ maxWidth: slotAppointments.length > 1 ? `${100 / slotAppointments.length}%` : '100%' }}>
                                {renderAppointment(appointment)}
                              </div>
                            ))}
                          </div>
                        ) : (
                          renderEmptySlot(timeSlot.hour, timeSlot.minute, provider.id, operatory)
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
          
          {viewMode === 'week' && (
            <div className="flex flex-col min-w-full">
              
              {/* Week body with appointments */}
              <div className="flex min-w-full">
                {/* Time column */}
                <div className="w-16 bg-gray-50 border-r sticky left-0 z-10">
                  {/* Use fewer time slots for week view */}
                  {timeSlots.filter(slot => slot.isHour).map((timeSlot, index) => (
                    <div 
                      key={`time-${index}`}
                      className="h-24 border-b flex items-center justify-center text-xs font-medium text-gray-600"
                    >
                      {timeSlot.label}
                    </div>
                  ))}
                </div>
                
                {/* Days columns */}
                {Array.from({ length: 7 }).map((_, dayIndex) => {
                  const day = new Date(startOfWeek(currentDate));
                  day.setDate(day.getDate() + dayIndex);
                  
                  const isToday = isSameDay(day, new Date());
                  
                  // Filter appointments for this day
                  const dayAppointments = appointments.filter(appt => 
                    isSameDay(new Date(appt.date), day)
                  );
                  
                  return (
                    <div 
                      key={`day-column-${dayIndex}`} 
                      className={`flex-1 min-w-[150px] ${isToday ? 'bg-blue-50/20' : ''}`}
                    >
                      {timeSlots.filter(slot => slot.isHour).map((timeSlot, timeIndex) => {
                        // Get appointments that fall in this hour
                        const hourAppointments = dayAppointments.filter(appt => {
                          const apptDate = new Date(appt.date);
                          return apptDate.getHours() === timeSlot.hour;
                        });
                        
                        return (
                          <div 
                            key={`day-${dayIndex}-hour-${timeIndex}`}
                            className="h-24 border-b border-r p-1 relative"
                          >
                            {hourAppointments.length > 0 ? (
                              <div className="flex flex-col space-y-1 overflow-y-auto max-h-full">
                                {/* Group appointments by minute */}
                                {Array.from(
                                  hourAppointments.reduce((acc, appt) => {
                                    const minute = new Date(appt.date).getMinutes();
                                    if (!acc.has(minute)) acc.set(minute, []);
                                    acc.get(minute)!.push(appt);
                                    return acc;
                                  }, new Map<number, SampleAppointment[]>())
                                ).map(([minute, minuteAppts]) => (
                                  <div key={`week-minute-${timeSlot.hour}-${minute}`} className="mb-1">
                                    {/* Display multiple appointments side by side if they're at the same minute */}
                                    {minuteAppts.length > 1 ? (
                                      <div className="flex space-x-1">
                                        {minuteAppts.map(appt => (
                                          <div 
                                            key={`week-appt-${appt.id}`}
                                            className={`${procedureTypeColors[appt.procedureType]} p-1 rounded text-xs cursor-pointer flex-1 min-w-0`}
                                            onClick={() => handleEditAppointment(appt)}
                                          >
                                            <div className="font-medium truncate flex items-center">
                                              {format(new Date(appt.date), 'h:mm a')} {appt.patientName}
                                              {appt.patientStatus && (
                                                <div className={`h-2 w-2 rounded-full ml-1 ${
                                                  appt.patientStatus === 'here' ? 'bg-green-500' :
                                                  appt.patientStatus === 'confirmed' ? 'bg-blue-500' :
                                                  appt.patientStatus === 'unconfirmed' ? 'bg-red-500' :
                                                  appt.patientStatus === 'noshow' ? 'bg-orange-500' : 'bg-gray-500'
                                                }`} />
                                              )}
                                            </div>
                                            <div className="truncate">
                                              {appt.procedureType === "Other" 
                                                ? (appt.customProcedureName || "Custom Procedure") 
                                                : appt.procedureType}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      // Single appointment display
                                      <div 
                                        key={`week-appt-${minuteAppts[0].id}`}
                                        className={`${procedureTypeColors[minuteAppts[0].procedureType]} p-1 rounded text-xs cursor-pointer`}
                                        onClick={() => handleEditAppointment(minuteAppts[0])}
                                      >
                                        <div className="font-medium truncate flex items-center">
                                          {format(new Date(minuteAppts[0].date), 'h:mm a')} {minuteAppts[0].patientName}
                                          {minuteAppts[0].patientStatus && (
                                            <div className={`h-2 w-2 rounded-full ml-1 ${
                                              minuteAppts[0].patientStatus === 'here' ? 'bg-green-500' :
                                              minuteAppts[0].patientStatus === 'confirmed' ? 'bg-blue-500' :
                                              minuteAppts[0].patientStatus === 'unconfirmed' ? 'bg-red-500' :
                                              minuteAppts[0].patientStatus === 'noshow' ? 'bg-orange-500' : 'bg-gray-500'
                                            }`} />
                                          )}
                                        </div>
                                        <div className="truncate">
                                          {minuteAppts[0].procedureType === "Other" 
                                            ? (minuteAppts[0].customProcedureName || "Custom Procedure") 
                                            : minuteAppts[0].procedureType}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div 
                                className="h-full w-full rounded-md border-dashed border border-gray-200 hover:border-gray-400 flex items-center justify-center cursor-pointer"
                                onClick={() => {
                                  // Create appointment at the beginning of this hour on this day
                                  const newDate = new Date(day);
                                  newDate.setHours(timeSlot.hour, 0, 0, 0);
                                  
                                  // Set date directly when creating appointment from week view
                                  setCurrentDate(newDate);
                                  createAppointmentAt(timeSlot.hour, 0, "Room 1", 1);
                                }}
                              >
                                <Plus className="h-4 w-4 text-gray-400" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Month view has been removed */}
        </CardContent>
      </Card>
    </>
  );
}