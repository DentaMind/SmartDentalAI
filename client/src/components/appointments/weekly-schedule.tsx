import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  Calendar, 
  AlertCircle, 
  Phone, 
  Info, 
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Types
interface Doctor {
  id: number;
  firstName: string;
  lastName: string;
  specialization: string;
  avatar?: string;
  color?: string;
}

interface Patient {
  id: number;
  userId: number;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  email?: string;
  phoneNumber?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  medicalHistory?: Record<string, any>;
}

interface Appointment {
  id: number;
  patientId: number;
  patientName?: string;
  doctorId: number;
  date: Date | string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled";
  notes?: string | null;
  isOnline?: boolean | null;
  insuranceVerified?: boolean | null;
  appointmentType?: string;
  reasonForVisit?: string;
  duration?: number;
  isNewPatient?: boolean;
  needsXray?: boolean;
  isEmergency?: boolean;
  isFollowUp?: boolean;
  medicalAlerts?: string[];
}

interface WeeklyScheduleProps {
  onAddAppointment?: () => void;
  onViewAppointment?: (appointmentId: number) => void;
  showMiniVersion?: boolean;
}

export function WeeklySchedule({ onAddAppointment, onViewAppointment }: WeeklyScheduleProps) {
  const { user } = useAuth();
  const [currentWeek, setCurrentWeek] = useState(getWeekDates(new Date()));
  const [selectedHygienist, setSelectedHygienist] = useState<number | null>(null);

  // Fetch doctors
  const { data: doctors, isLoading: isLoadingDoctors } = useQuery<Doctor[]>({
    queryKey: ["/api/doctors"],
  });

  // Fetch hygienists
  const { data: hygienists, isLoading: isLoadingHygienists } = useQuery<Doctor[]>({
    queryKey: ["/api/hygienists"],
  });

  // Fetch appointments for the current week
  const { data: appointments, isLoading: isLoadingAppointments } = useQuery<Appointment[]>({
    queryKey: [
      "/api/appointments", 
      currentWeek[0].toISOString().split('T')[0], 
      currentWeek[6].toISOString().split('T')[0]
    ],
  });

  // Helper functions
  function getWeekDates(date: Date): Date[] {
    const day = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const diff = date.getDate() - day;
    const sunday = new Date(date.setDate(diff));
    
    const weekDates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const nextDate = new Date(sunday);
      nextDate.setDate(sunday.getDate() + i);
      weekDates.push(nextDate);
    }
    
    return weekDates;
  }

  function navigateWeek(direction: 'prev' | 'next') {
    const firstDay = new Date(currentWeek[0]);
    if (direction === 'prev') {
      firstDay.setDate(firstDay.getDate() - 7);
    } else {
      firstDay.setDate(firstDay.getDate() + 7);
    }
    setCurrentWeek(getWeekDates(firstDay));
  }

  function getTimeSlots(): string[] {
    const slots: string[] = [];
    // 7am to 7pm in 15-minute increments
    for (let hour = 7; hour < 19; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        slots.push(
          `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        );
      }
    }
    return slots;
  }

  function formatTime(time: string): string {
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour, 10);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const hour12 = hourNum % 12 || 12;
    return `${hour12}:${minute} ${ampm}`;
  }

  function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  }

  function getAppointmentForSlot(doctorId: number, date: Date, timeSlot: string): Appointment | undefined {
    if (!appointments) return undefined;
    
    const formattedDate = date.toISOString().split('T')[0];
    
    return appointments.find(apt => {
      const aptDate = new Date(apt.date);
      const aptDateStr = aptDate.toISOString().split('T')[0];
      const aptTime = aptDate.toTimeString().substring(0, 5);
      
      return apt.doctorId === doctorId && 
             aptDateStr === formattedDate && 
             aptTime === timeSlot;
    });
  }

  // Generate time slots
  const timeSlots = getTimeSlots();
  
  // If data is still loading, show loading state
  if (isLoadingDoctors || isLoadingHygienists || isLoadingAppointments) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading schedule...</p>
      </div>
    );
  }

  // If no doctors are available
  if (!doctors?.length) {
    return (
      <div className="text-center p-8">
        <h3 className="font-medium text-lg mb-2">No providers available</h3>
        <p className="text-gray-500 mb-4">There are no providers configured in the system.</p>
        <Button onClick={onAddAppointment}>
          <Plus className="h-4 w-4 mr-2" />
          Add Provider
        </Button>
      </div>
    );
  }

  // Combine doctors and hygienists for display
  const providers = [...(doctors || []), ...(hygienists || [])].filter(provider => {
    if (selectedHygienist !== null) {
      return provider.id === selectedHygienist;
    }
    return true;
  });

  return (
    <div className="flex flex-col">
      {/* Schedule Controls */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium">
            {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentWeek[0])}
          </span>
          <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" 
            onClick={() => setCurrentWeek(getWeekDates(new Date()))}>
            Today
          </Button>
          <Button size="sm" onClick={onAddAppointment}>
            <Plus className="h-4 w-4 mr-2" />
            Add Appointment
          </Button>
        </div>
      </div>
      
      {/* Main Schedule Grid */}
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-[100px_repeat(7,1fr)] bg-gray-50">
          {/* Time Column */}
          <div className="border-r border-gray-200 font-medium p-2 text-center">
            Time
          </div>
          
          {/* Day Headers */}
          {currentWeek.map((date, i) => (
            <div 
              key={i} 
              className={cn(
                "border-r border-gray-200 p-2 text-center font-medium",
                new Date().toDateString() === date.toDateString() && "bg-blue-50"
              )}
            >
              {formatDate(date)}
            </div>
          ))}
        </div>
        
        {/* Time Slots */}
        <div className="overflow-auto max-h-[600px]">
          {timeSlots.map((timeSlot, timeIndex) => (
            <div 
              key={timeSlot} 
              className={cn(
                "grid grid-cols-[100px_repeat(7,1fr)] border-b border-gray-200",
                timeIndex % 4 === 0 && "bg-gray-50" // Highlight full hours
              )}
            >
              {/* Time Label */}
              <div className={cn(
                "border-r border-gray-200 p-2 text-xs font-medium flex items-center justify-center",
                timeIndex % 4 === 0 ? "text-gray-700" : "text-gray-400"
              )}>
                {timeIndex % 4 === 0 ? formatTime(timeSlot) : ""}
              </div>
              
              {/* Provider Columns */}
              {currentWeek.map((date, dateIndex) => (
                <div key={dateIndex} className="relative min-h-[30px] border-r border-gray-200 group">
                  <div className="absolute inset-0 grid grid-cols-1 divide-y divide-gray-100">
                    {providers.map((provider, providerIndex) => {
                      const appointment = getAppointmentForSlot(provider.id, date, timeSlot);
                      
                      return (
                        <div 
                          key={provider.id} 
                          className={cn(
                            "h-full w-full p-0.5",
                            providerIndex % 2 === 0 ? "bg-opacity-5" : "bg-opacity-0"
                          )}
                        >
                          {appointment && (
                            <TooltipProvider>
                              <Tooltip delayDuration={300}>
                                <TooltipTrigger asChild>
                                  <div 
                                    className={cn(
                                      "h-full w-full rounded p-1 text-xs cursor-pointer hover:ring-2 hover:ring-offset-1 ring-primary transition-all",
                                      appointment.status === "confirmed" ? "bg-green-100" : 
                                      appointment.status === "scheduled" ? "bg-blue-100" : 
                                      appointment.status === "cancelled" ? "bg-red-100" : 
                                      appointment.isEmergency ? "bg-amber-100" : "bg-gray-100"
                                    )}
                                    onClick={() => onViewAppointment?.(appointment.id)}
                                  >
                                    <div className="font-medium truncate">
                                      {appointment.patientName || `Patient #${appointment.patientId}`}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1">
                                      <Badge 
                                        variant="outline" 
                                        className={cn(
                                          "text-[10px] h-4 px-1 py-0",
                                          appointment.status === "confirmed" ? "bg-green-50 text-green-800" :
                                          appointment.status === "scheduled" ? "bg-blue-50 text-blue-800" :
                                          appointment.status === "cancelled" ? "bg-red-50 text-red-800" :
                                          "bg-gray-50 text-gray-800"
                                        )}
                                      >
                                        {appointment.status}
                                      </Badge>
                                      {appointment.isOnline && (
                                        <Badge 
                                          variant="secondary"
                                          className="text-[10px] h-4 px-1 py-0 bg-indigo-50 text-indigo-800"
                                        >
                                          <Phone className="h-2 w-2 mr-1" />
                                          online
                                        </Badge>
                                      )}
                                      {appointment.isNewPatient && (
                                        <Badge 
                                          variant="secondary"
                                          className="text-[10px] h-4 px-1 py-0 bg-purple-50 text-purple-800"
                                        >
                                          <User className="h-2 w-2 mr-1" />
                                          new
                                        </Badge>
                                      )}
                                      {appointment.needsXray && (
                                        <Badge 
                                          variant="secondary"
                                          className="text-[10px] h-4 px-1 py-0 bg-amber-50 text-amber-800"
                                        >
                                          x-ray
                                        </Badge>
                                      )}
                                      {appointment.isEmergency && (
                                        <Badge 
                                          variant="secondary"
                                          className="text-[10px] h-4 px-1 py-0 bg-red-50 text-red-800"
                                        >
                                          <AlertCircle className="h-2 w-2 mr-1" />
                                          emergency
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="p-0 overflow-hidden max-w-xs">
                                  <div className="text-xs p-3 space-y-2">
                                    <div className="font-semibold border-b pb-1">
                                      {appointment.patientName || `Patient #${appointment.patientId}`}
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex gap-2 items-center text-[11px]">
                                        <Clock className="h-3 w-3 text-gray-500" />
                                        <span>{formatTime(timeSlot)} - {appointment.duration || 30} min</span>
                                      </div>
                                      {appointment.appointmentType && (
                                        <div className="flex gap-2 items-center text-[11px]">
                                          <Calendar className="h-3 w-3 text-gray-500" />
                                          <span>{appointment.appointmentType}</span>
                                        </div>
                                      )}
                                      {appointment.reasonForVisit && (
                                        <div className="flex gap-2 items-center text-[11px]">
                                          <Info className="h-3 w-3 text-gray-500" />
                                          <span>Reason: {appointment.reasonForVisit}</span>
                                        </div>
                                      )}
                                      {appointment.medicalAlerts && appointment.medicalAlerts.length > 0 && (
                                        <div className="flex gap-2 items-start text-[11px]">
                                          <AlertCircle className="h-3 w-3 text-red-500 mt-0.5" />
                                          <div className="flex flex-col">
                                            <span className="font-medium">Alerts:</span>
                                            <ul className="list-disc list-inside pl-1">
                                              {appointment.medicalAlerts.map((alert, i) => (
                                                <li key={i} className="text-red-600">{alert}</li>
                                              ))}
                                            </ul>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    <div className="pt-1 flex flex-wrap gap-1">
                                      {appointment.isNewPatient && (
                                        <Badge className="text-[10px] bg-purple-100 text-purple-800">New Patient</Badge>
                                      )}
                                      {appointment.isFollowUp && (
                                        <Badge className="text-[10px] bg-blue-100 text-blue-800">Follow-up</Badge>
                                      )}
                                      {appointment.needsXray && (
                                        <Badge className="text-[10px] bg-amber-100 text-amber-800">X-ray Needed</Badge>
                                      )}
                                      {appointment.isEmergency && (
                                        <Badge className="text-[10px] bg-red-100 text-red-800">Emergency</Badge>
                                      )}
                                      {!appointment.insuranceVerified && (
                                        <Badge className="text-[10px] bg-gray-100 text-gray-800">Insurance TBD</Badge>
                                      )}
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {/* Provider Legend */}
      <div className="mt-4 flex flex-wrap gap-2">
        {providers.map(provider => (
          <Card key={provider.id} className="p-2 flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {provider.firstName?.[0]}{provider.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium">
              {provider.firstName} {provider.lastName}
            </span>
            <Badge variant="outline" className="text-[10px]">
              {provider.specialization}
            </Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}