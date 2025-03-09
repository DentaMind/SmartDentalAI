import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { addDays, format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, addWeeks, subWeeks, setHours, setMinutes, isBefore, isAfter } from "date-fns";
import { Calendar, Clock, Plus, Filter, Users, MapPin, ChevronLeft, ChevronRight, Search, MoreHorizontal, Calendar as CalendarIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Appointment } from "../../../shared/schema";

interface Provider {
  id: number;
  firstName: string;
  lastName: string;
  specialization?: string;
}

interface Location {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
}

interface SchedulerProps {
  initialDate?: Date;
  onAppointmentSelect?: (appointment: Appointment) => void;
  onNewAppointment?: (startTime: Date, doctorId: number) => void;
}

type ViewMode = "day" | "week" | "month";
type AppointmentType = 
  // Exams and hygiene
  | "comprehensive" | "periodic" | "prophylaxis" | "perioMaint"
  // Restorative procedures
  | "composite" | "crownPrep" | "crownDelivery" | "recementCrown" | "veneerPrep"
  // Surgical and endodontic 
  | "extraction" | "rootCanal" | "implant"
  // Quick procedures
  | "quickAdjust" | "emergencyExam" | "postOp"
  // Other
  | "consultation" | "meeting" | "vacation";

interface AppointmentWithMetadata extends Appointment {
  patientName?: string;
  appointmentTypeName?: string;
  appointmentTypeColor?: string;
}

const appointmentTypes: Record<AppointmentType, { name: string; color: string; defaultDuration: number }> = {
  // Exams and hygiene
  comprehensive: { name: "Comprehensive Exam", color: "bg-indigo-200 hover:bg-indigo-300 text-indigo-800", defaultDuration: 60 },
  periodic: { name: "Periodic Exam", color: "bg-blue-200 hover:bg-blue-300 text-blue-800", defaultDuration: 30 },
  prophylaxis: { name: "Prophylaxis", color: "bg-green-200 hover:bg-green-300 text-green-800", defaultDuration: 60 },
  perioMaint: { name: "Perio Maintenance", color: "bg-emerald-200 hover:bg-emerald-300 text-emerald-800", defaultDuration: 60 },
  
  // Restorative procedures  
  composite: { name: "Composite", color: "bg-yellow-200 hover:bg-yellow-300 text-yellow-800", defaultDuration: 60 },
  crownPrep: { name: "Crown Prep", color: "bg-amber-200 hover:bg-amber-300 text-amber-800", defaultDuration: 90 },
  crownDelivery: { name: "Crown Delivery", color: "bg-orange-200 hover:bg-orange-300 text-orange-800", defaultDuration: 45 },
  recementCrown: { name: "Recement Crown", color: "bg-rose-200 hover:bg-rose-300 text-rose-800", defaultDuration: 30 },
  veneerPrep: { name: "Veneer Prep", color: "bg-pink-200 hover:bg-pink-300 text-pink-800", defaultDuration: 120 },
  
  // Surgical and endodontic
  extraction: { name: "Extraction", color: "bg-red-200 hover:bg-red-300 text-red-800", defaultDuration: 60 },
  rootCanal: { name: "Root Canal", color: "bg-purple-200 hover:bg-purple-300 text-purple-800", defaultDuration: 90 },
  implant: { name: "Implant", color: "bg-violet-200 hover:bg-violet-300 text-violet-800", defaultDuration: 120 },
  
  // Quick procedures (for side-booking)
  quickAdjust: { name: "Quick Adjustment", color: "bg-gray-200 hover:bg-gray-300 text-gray-800", defaultDuration: 15 },
  emergencyExam: { name: "Emergency Exam", color: "bg-red-200 hover:bg-red-300 text-red-800", defaultDuration: 30 },
  postOp: { name: "Post-Op Check", color: "bg-cyan-200 hover:bg-cyan-300 text-cyan-800", defaultDuration: 15 },
  
  // Other
  consultation: { name: "Consultation", color: "bg-teal-200 hover:bg-teal-300 text-teal-800", defaultDuration: 45 },
  meeting: { name: "Staff Meeting", color: "bg-slate-200 hover:bg-slate-300 text-slate-800", defaultDuration: 60 },
  vacation: { name: "Vacation", color: "bg-gray-200 hover:bg-gray-300 text-gray-800", defaultDuration: 480 }, // 8 hours
};

// Helper function to generate time slots
const generateTimeSlots = (startHour = 7, endHour = 19, interval = 15) => {
  const slots = [];
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += interval) {
      slots.push({
        hour,
        minute,
        label: format(setMinutes(setHours(new Date(), hour), minute), "h:mm a"),
      });
    }
  }
  return slots;
};

export function EnhancedScheduler({ initialDate = new Date(), onAppointmentSelect, onNewAppointment }: SchedulerProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // States
  const [currentDate, setCurrentDate] = useState<Date>(initialDate);
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [selectedLocation, setSelectedLocation] = useState<number | "all">("all");
  const [selectedProviders, setSelectedProviders] = useState<number[]>([]);
  const [showAllProviders, setShowAllProviders] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [newAppointmentDate, setNewAppointmentDate] = useState<Date | null>(null);
  const [newAppointmentDoctorId, setNewAppointmentDoctorId] = useState<number | null>(null);
  
  // Time slots for the schedule
  const timeSlots = generateTimeSlots();
  
  // Query hooks for data
  const { data: locations = [] } = useQuery({ 
    queryKey: ['/api/locations'],
    queryFn: () => apiRequest<Location[]>('/api/locations')
  });
  
  // Query for all providers (doctors and hygienists)
  const { data: providers = [] } = useQuery({ 
    queryKey: ['/api/providers'],
    queryFn: async () => {
      // Get doctors and hygienists
      const doctors = await apiRequest<Provider[]>('/api/users?role=doctor');
      const hygienists = await apiRequest<Provider[]>('/api/users?role=staff&specialization=hygienist').catch(() => []);
      
      // Combine and return all providers
      return [...doctors, ...hygienists];
    }
  });
  
  // Calculate date range based on view mode
  const getDateRange = () => {
    if (viewMode === 'day') {
      return [currentDate];
    } else if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
      const end = endOfWeek(currentDate, { weekStartsOn: 1 }); // Sunday
      return eachDayOfInterval({ start, end });
    }
    // Month view logic would go here
    return [currentDate];
  };
  
  const dateRange = getDateRange();
  
  // Format date range for API query
  const startDate = format(dateRange[0], 'yyyy-MM-dd');
  const endDate = format(dateRange[dateRange.length - 1], 'yyyy-MM-dd');
  
  // Query for appointments
  const { data: appointments = [], isLoading: isLoadingAppointments } = useQuery({ 
    queryKey: ['/api/appointments', startDate, endDate, selectedLocation, selectedProviders, showAllProviders],
    queryFn: async () => {
      const locationParam = selectedLocation !== 'all' ? `&locationId=${selectedLocation}` : '';
      const providersParam = !showAllProviders && selectedProviders.length > 0 
        ? selectedProviders.map(id => `&doctorId=${id}`).join('') 
        : '';
      
      const url = `/api/appointments?startDate=${startDate}&endDate=${endDate}${locationParam}${providersParam}`;
      const appointmentsData = await apiRequest<Appointment[]>(url);
      
      // Enhance appointments with additional metadata
      return Promise.all(appointmentsData.map(async (appointment) => {
        try {
          // In a real implementation, this would be a batch query or included in the original response
          const patientData = await apiRequest<any>(`/api/patients/${appointment.patientId}`);
          // Map appointment notes to specific dental procedure types
          const appointmentType = 
            // Exams and hygiene
            appointment.notes?.toLowerCase().includes('comprehensive') ? 'comprehensive' 
            : appointment.notes?.toLowerCase().includes('periodic') ? 'periodic'
            : appointment.notes?.toLowerCase().includes('prophy') ? 'prophylaxis'
            : appointment.notes?.toLowerCase().includes('perio maint') ? 'perioMaint'
            // Restorative procedures
            : appointment.notes?.toLowerCase().includes('composite') ? 'composite'
            : appointment.notes?.toLowerCase().includes('crown prep') ? 'crownPrep'
            : appointment.notes?.toLowerCase().includes('crown deliv') ? 'crownDelivery'
            : appointment.notes?.toLowerCase().includes('recement') ? 'recementCrown'
            : appointment.notes?.toLowerCase().includes('veneer') ? 'veneerPrep'
            // Surgical and endodontic
            : appointment.notes?.toLowerCase().includes('extract') ? 'extraction'
            : appointment.notes?.toLowerCase().includes('root canal') ? 'rootCanal'
            : appointment.notes?.toLowerCase().includes('implant') ? 'implant'
            // Quick procedures
            : appointment.notes?.toLowerCase().includes('adjust') ? 'quickAdjust'
            : appointment.notes?.toLowerCase().includes('emergency') ? 'emergencyExam'
            : appointment.notes?.toLowerCase().includes('post-op') ? 'postOp'
            // Other
            : appointment.notes?.toLowerCase().includes('consult') ? 'consultation'
            : appointment.notes?.toLowerCase().includes('meeting') ? 'meeting'
            : appointment.notes?.toLowerCase().includes('vacation') ? 'vacation'
            : 'comprehensive';
          
          return {
            ...appointment,
            patientName: patientData ? `${patientData.firstName} ${patientData.lastName}` : 'Unknown Patient',
            appointmentTypeName: appointmentTypes[appointmentType as AppointmentType].name,
            appointmentTypeColor: appointmentTypes[appointmentType as AppointmentType].color,
          };
        } catch (error) {
          console.error("Error fetching patient data for appointment", error);
          return appointment;
        }
      }));
    }
  });
  
  // Function to navigate dates
  const navigateDate = (direction: 'prev' | 'next') => {
    if (viewMode === 'day') {
      setCurrentDate(prev => direction === 'next' ? addDays(prev, 1) : addDays(prev, -1));
    } else if (viewMode === 'week') {
      setCurrentDate(prev => direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1));
    }
    // Month navigation would go here
  };
  
  // Generate columns based on selected view
  const renderColumns = () => {
    return dateRange.map(date => {
      const dayFormat = format(date, 'EEE, MMM d');
      const isCurrentDay = isToday(date);
      
      return (
        <th 
          key={dayFormat} 
          className={`border-l ${isCurrentDay ? 'bg-blue-50' : ''}`}
        >
          <div className="flex flex-col items-center py-2">
            <span className={`text-sm font-medium ${isCurrentDay ? 'text-blue-700' : ''}`}>
              {dayFormat}
            </span>
            {isCurrentDay && <span className="text-xs text-blue-700">Today</span>}
          </div>
        </th>
      );
    });
  };
  
  // Filter and organize appointments by time slot and provider
  const getAppointmentsForSlot = (timeSlot: { hour: number, minute: number }, date: Date, doctorId: number) => {
    if (!appointments) return [];
    
    const slotStart = new Date(date);
    slotStart.setHours(timeSlot.hour, timeSlot.minute, 0, 0);
    
    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotStart.getMinutes() + 14, 59, 999);
    
    return appointments.filter((appointment: AppointmentWithMetadata) => {
      const appointmentDate = new Date(appointment.date);
      return appointment.doctorId === doctorId && 
             isSameDay(appointmentDate, date) && 
             isBefore(slotStart, appointmentDate) && 
             isAfter(slotEnd, appointmentDate);
    });
  };
  
  const renderAppointmentCell = (timeSlot: { hour: number, minute: number }, date: Date, doctorId: number) => {
    const slotAppointments = getAppointmentsForSlot(timeSlot, date, doctorId);
    
    // Create a click handler for the empty cell
    const handleEmptyCellClick = () => {
      const appointmentDate = new Date(date);
      appointmentDate.setHours(timeSlot.hour, timeSlot.minute, 0, 0);
      setNewAppointmentDate(appointmentDate);
      setNewAppointmentDoctorId(doctorId);
      
      if (onNewAppointment) {
        onNewAppointment(appointmentDate, doctorId);
      }
    };
    
    if (slotAppointments.length === 0) {
      return (
        <td 
          className="border p-0 h-10 relative hover:bg-gray-50 cursor-pointer" 
          onClick={handleEmptyCellClick}
        >
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            {/* Empty cell indicator for scheduling */}
            <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Plus className="h-3 w-3" />
            </span>
          </div>
        </td>
      );
    }
    
    // If we have appointments, display them
    return (
      <td className="border p-0 h-10">
        {slotAppointments.map((appointment: AppointmentWithMetadata) => (
          <div 
            key={appointment.id}
            className={`text-xs p-1 truncate cursor-pointer ${appointment.appointmentTypeColor || 'bg-blue-100'}`}
            onClick={() => onAppointmentSelect && onAppointmentSelect(appointment)}
          >
            {appointment.patientName || 'Appointment'}
          </div>
        ))}
      </td>
    );
  };
  
  // Render the time slots and associated appointments
  const renderTimeSlots = () => {
    return timeSlots.map(timeSlot => (
      <tr key={`${timeSlot.hour}-${timeSlot.minute}`} className="border-b">
        <td className="border-r px-2 py-1 text-xs font-medium sticky left-0 bg-white z-10">
          {timeSlot.label}
        </td>
        
        {/* For each provider, render a slot for each day */}
        {providers
          .filter(provider => showAllProviders || selectedProviders.includes(provider.id))
          .map(provider => (
            // For each day in our range
            dateRange.map(date => (
              <React.Fragment key={`${provider.id}-${format(date, 'yyyy-MM-dd')}-${timeSlot.hour}-${timeSlot.minute}`}>
                {renderAppointmentCell(timeSlot, date, provider.id)}
              </React.Fragment>
            ))
          ))}
      </tr>
    ));
  };
  
  // Conditionally render the provider headers based on view mode
  const renderProviderHeaders = () => {
    if (viewMode === 'day') {
      return providers
        .filter(provider => showAllProviders || selectedProviders.includes(provider.id))
        .map(provider => (
          <th key={provider.id} className="border-l">
            <div className="flex items-center justify-center py-2 px-4">
              <Avatar className="h-6 w-6 mr-2">
                <AvatarFallback>
                  {provider.firstName[0]}{provider.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">
                {provider.role === 'doctor' ? 'Dr.' : provider.specialization === 'hygienist' ? 'Hyg.' : ''} {provider.firstName} {provider.lastName}
              </span>
            </div>
          </th>
        ));
    }
    
    // For week view, we don't show provider headers
    return null;
  };
  
  const handleAddAppointment = () => {
    if (newAppointmentDate && newAppointmentDoctorId) {
      // Logic to add an appointment would go here
      // In a real implementation, this would open a form or modal
      console.log("Adding appointment at", newAppointmentDate, "for doctor", newAppointmentDoctorId);
      setNewAppointmentDate(null);
      setNewAppointmentDoctorId(null);
    }
  };
  
  return (
    <div className="space-y-2">
      {/* Top toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button 
            onClick={() => setCurrentDate(new Date())} 
            variant="outline" 
            size="sm"
          >
            Today
          </Button>
          
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateDate('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="px-2">
              <h2 className="text-lg font-semibold">
                {viewMode === 'day' 
                  ? format(currentDate, 'MMMM d, yyyy')
                  : `${format(dateRange[0], 'MMM d')} - ${format(dateRange[dateRange.length - 1], 'MMM d, yyyy')}`
                }
              </h2>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateDate('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList className="h-8">
              <TabsTrigger value="day" className="text-xs px-3 py-1">Day</TabsTrigger>
              <TabsTrigger value="week" className="text-xs px-3 py-1">Week</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Select 
            value={selectedLocation.toString()} 
            onValueChange={(value) => setSelectedLocation(value === 'all' ? 'all' : parseInt(value))}
          >
            <SelectTrigger className="w-[180px] h-8">
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map(location => (
                <SelectItem key={location.id} value={location.id.toString()}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Users className="h-4 w-4" />
                <span>{showAllProviders ? 'All Providers' : `${selectedProviders.length} Selected`}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-0">
              <div className="p-2 border-b">
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs h-7"
                    onClick={() => {
                      setShowAllProviders(true);
                      setSelectedProviders([]);
                    }}
                  >
                    Select All
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs h-7"
                    onClick={() => {
                      setShowAllProviders(false);
                      setSelectedProviders([]);
                    }}
                  >
                    Clear All
                  </Button>
                </div>
              </div>
              <div className="max-h-[200px] overflow-y-auto p-2">
                {providers.map(provider => (
                  <div key={provider.id} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      id={`provider-${provider.id}`}
                      checked={showAllProviders || selectedProviders.includes(provider.id)}
                      onChange={(e) => {
                        if (showAllProviders) {
                          // Switch to individual selection mode
                          const allExceptCurrent = providers
                            .filter(p => p.id !== provider.id)
                            .map(p => p.id);
                          setShowAllProviders(false);
                          setSelectedProviders(allExceptCurrent);
                        } else {
                          setSelectedProviders(prev => 
                            e.target.checked
                              ? [...prev, provider.id]
                              : prev.filter(id => id !== provider.id)
                          );
                        }
                      }}
                      className="rounded"
                    />
                    <label htmlFor={`provider-${provider.id}`} className="text-sm flex-1 cursor-pointer">
                      Dr. {provider.firstName} {provider.lastName}
                    </label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                New Appointment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Appointment</DialogTitle>
              </DialogHeader>
              {/* The actual appointment form would go here */}
              <div className="py-4">
                <p className="text-center text-muted-foreground">
                  This is a placeholder for the appointment creation form.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Search bar */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patients or appointments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      
      {/* Main schedule grid */}
      <Card className="overflow-hidden">
        <div className="overflow-auto max-h-[calc(100vh-220px)]">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50 sticky top-0 z-20">
              <tr>
                <th className="border-r px-4 py-2 text-left w-24 sticky left-0 z-30 bg-gray-50">
                  Time
                </th>
                {viewMode === 'day' ? renderProviderHeaders() : renderColumns()}
              </tr>
              {viewMode === 'week' && (
                <tr>
                  <th className="border-r sticky left-0 z-30 bg-gray-50"></th>
                  {providers
                    .filter(provider => showAllProviders || selectedProviders.includes(provider.id))
                    .map(provider => (
                      <th key={provider.id} className="border-l py-1">
                        <div className="flex items-center justify-center py-1">
                          <Avatar className="h-5 w-5 mr-1">
                            <AvatarFallback className="text-xs">
                              {provider.firstName[0]}{provider.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium">
                            Dr. {provider.lastName}
                          </span>
                        </div>
                      </th>
                    ))}
                </tr>
              )}
            </thead>
            <tbody>
              {isLoadingAppointments ? (
                <tr>
                  <td colSpan={viewMode === 'day' ? providers.length + 1 : dateRange.length + 1} className="py-4 text-center">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                      <span>Loading schedule...</span>
                    </div>
                  </td>
                </tr>
              ) : (
                renderTimeSlots()
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-2 mt-2">
        {Object.entries(appointmentTypes).map(([key, { name, color }]) => (
          <Badge key={key} className={`${color.split(' ')[0]} text-xs`}>
            {name}
          </Badge>
        ))}
      </div>
    </div>
  );
}