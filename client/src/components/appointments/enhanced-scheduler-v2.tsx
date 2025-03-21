import React, { useState, useEffect } from "react";
import { format, addDays, subDays, setHours, setMinutes, parseISO } from "date-fns";
import { 
  Calendar, Clock, Plus, Filter, MapPin, ChevronLeft, ChevronRight, 
  Calendar as CalendarIcon, AlertCircle, CheckCircle2, Clock4, 
  X, Info, Phone, User
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  operatory: string;
  notes?: string;
  status: 'confirmed' | 'cancelled' | 'completed' | 'noshow' | 'pending';
  providerId: number;
}

/**
 * Mock data for providers
 */
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

/**
 * Mock data for patients
 */
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

/**
 * Sample appointments for the scheduler
 */
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
  {
    id: 3,
    patientId: 1,
    patientName: "Sarah Johnson",
    date: setMinutes(setHours(new Date(), 10), 30),
    duration: 90,
    procedureType: "Root Canal",
    notes: "Root canal treatment on tooth #14",
    status: "confirmed",
    operatory: "Room 1",
    providerId: 1
  },
  {
    id: 4,
    patientId: 2,
    patientName: "Michael Williams",
    date: setMinutes(setHours(new Date(), 12), 0),
    duration: 30,
    procedureType: "Composite",
    notes: "Composite filling on tooth #30",
    status: "confirmed",
    operatory: "Room 2",
    providerId: 1
  },
  {
    id: 5,
    patientId: 1,
    patientName: "Sarah Johnson",
    date: setMinutes(setHours(new Date(), 12), 30),
    duration: 30,
    procedureType: "Recement Crown",
    notes: "Recement crown on tooth #3",
    status: "confirmed",
    operatory: "Room 1",
    providerId: 1
  },
  {
    id: 6,
    patientId: 2,
    patientName: "Michael Williams",
    date: setMinutes(setHours(new Date(), 14), 30),
    duration: 30,
    procedureType: "Composite",
    notes: "Small composite filling on #18",
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
  },
  {
    id: 9,
    patientId: 1,
    patientName: "Sarah Johnson",
    date: setMinutes(setHours(new Date(), 9), 0),
    duration: 60,
    procedureType: "Prophylaxis",
    notes: "Regular cleaning and fluoride treatment",
    status: "confirmed",
    operatory: "Hygiene Room 1",
    providerId: 2
  },
  {
    id: 10,
    patientId: 2,
    patientName: "Michael Williams",
    date: setMinutes(setHours(new Date(), 10), 0),
    duration: 60,
    procedureType: "Perio Maintenance",
    notes: "Periodontal maintenance and oral hygiene instruction",
    status: "confirmed",
    operatory: "Hygiene Room 1",
    providerId: 2
  },
  {
    id: 11,
    patientId: 1,
    patientName: "Sarah Johnson",
    date: setMinutes(setHours(new Date(), 11), 0),
    duration: 60,
    procedureType: "Prophylaxis",
    notes: "Regular cleaning",
    status: "confirmed",
    operatory: "Hygiene Room 1",
    providerId: 2
  },
  {
    id: 12,
    patientId: 2,
    patientName: "Michael Williams",
    date: setMinutes(setHours(new Date(), 13), 0),
    duration: 60,
    procedureType: "Perio Maintenance",
    notes: "Periodontal maintenance",
    status: "confirmed",
    operatory: "Hygiene Room 1",
    providerId: 2
  },
  {
    id: 13,
    patientId: 1,
    patientName: "Sarah Johnson",
    date: setMinutes(setHours(new Date(), 14), 0),
    duration: 60,
    procedureType: "Prophylaxis",
    notes: "Regular cleaning",
    status: "confirmed",
    operatory: "Hygiene Room 1",
    providerId: 2
  },
  {
    id: 14,
    patientId: 2,
    patientName: "Michael Williams",
    date: setMinutes(setHours(new Date(), 15), 0),
    duration: 60,
    procedureType: "Perio Maintenance",
    notes: "Periodontal maintenance",
    status: "confirmed",
    operatory: "Hygiene Room 1",
    providerId: 2
  },
  {
    id: 15,
    patientId: 1,
    patientName: "Sarah Johnson",
    date: setMinutes(setHours(new Date(), 16), 0),
    duration: 60,
    procedureType: "Prophylaxis",
    notes: "Regular cleaning",
    status: "confirmed",
    operatory: "Hygiene Room 1",
    providerId: 2
  },
];

/**
 * Mapping procedure types to colors for visual distinction
 */
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
 * Enhanced scheduler component with provider columns
 */
export function EnhancedSchedulerV2() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<SampleAppointment[]>(sampleAppointments);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Time slot generation (7am to 5pm in 30-minute increments)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 7; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        slots.push({
          hour,
          minute,
          label: format(setMinutes(setHours(new Date(), hour), minute), "h:mm a")
        });
      }
    }
    return slots;
  };
  
  const timeSlots = generateTimeSlots();
  
  // Handle date navigation
  const navigateDate = (direction) => {
    setCurrentDate(prev => 
      direction === 'next' ? addDays(prev, 1) : subDays(prev, 1)
    );
  };
  
  // Helper function to get patient details by ID
  const getPatientById = (patientId) => {
    return patients.find(p => p.id === patientId);
  };
  
  // Helper function to check if a time slot has an appointment for a specific provider
  const getAppointmentForTimeSlot = (hour, minute, providerId) => {
    return appointments.find(appointment => {
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
  
  // Render appointment card with hover behavior
  const renderAppointment = (appointment) => {
    if (!appointment) return null;
    
    const patient = getPatientById(appointment.patientId);
    
    return (
      <HoverCard>
        <HoverCardTrigger asChild>
          <div 
            className={`${procedureTypeColors[appointment.procedureType]} p-2 rounded-md mb-1 cursor-pointer hover:shadow-md transition-shadow duration-200 relative min-h-[60px] overflow-hidden`}
          >
            <div className="flex items-center mb-1">
              <Badge variant="outline" className="bg-white">
                {appointment.operatory}
              </Badge>
              <span className="text-xs ml-auto">
                {format(new Date(appointment.date), "h:mm a")}
              </span>
            </div>
            <div className="flex items-center">
              <div className="mr-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback>
                    {appointment.patientName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-medium text-sm truncate">
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
              <span className="font-medium">{appointment.procedureType}</span>
            </div>
            <div className="absolute bottom-1 right-1">
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
                  {appointment.patientName.split(' ').map(n => n[0]).join('')}
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
              <Badge variant={
                appointment.status === 'confirmed' ? 'default' : 
                appointment.status === 'pending' ? 'outline' :
                appointment.status === 'cancelled' ? 'destructive' : 'secondary'
              }>
                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
              </Badge>
              <div className="space-x-1">
                <Button size="sm" variant="ghost" className="h-7 px-2">
                  <Clock4 className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="outline" className="h-7 px-2">
                  View
                </Button>
              </div>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  };

  // Render empty time slot
  const renderEmptySlot = (hour: number, minute: number, providerId: number) => {
    return (
      <div className="h-16 border-b border-r p-1 group">
        <div className="h-full w-full rounded-md border border-dashed border-gray-200 hover:border-gray-400 hover:bg-gray-50 flex items-center justify-center cursor-pointer transition-colors duration-200">
          <Plus className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="p-4 pb-0">
        <div className="flex justify-between items-center">
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
              <CardTitle className="text-lg font-medium">
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
              className="ml-4"
            >
              Today
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Search patients..."
              className="w-48"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Select defaultValue="today">
              <SelectTrigger className="w-36">
                <SelectValue placeholder="View" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Day View</SelectItem>
                <SelectItem value="week">Week View</SelectItem>
                <SelectItem value="month">Month View</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm">
              <Filter className="h-4 w-4 mr-1" />
              Filter
            </Button>
          </div>
        </div>
        
        <div className="flex mt-4 border-b pb-1 font-medium text-sm text-muted-foreground">
          <div className="w-16 flex justify-center">Time</div>
          {providers.map(provider => (
            <div 
              key={provider.id} 
              className="flex-1 flex justify-center items-center"
              style={{ borderLeft: `4px solid ${provider.color || '#888'}` }}
            >
              {provider.name}
              <Badge variant="outline" className="ml-2">
                {provider.role === 'doctor' ? 'Doctor' : 'Hygienist'}
              </Badge>
            </div>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="p-0 overflow-auto max-h-[700px]">
        <div className="flex">
          {/* Time column */}
          <div className="w-16 bg-gray-50 border-r sticky left-0 z-10">
            {timeSlots.map((timeSlot, index) => (
              <div 
                key={`time-${index}`} 
                className="h-16 border-b flex items-center justify-center text-xs font-medium text-gray-600"
              >
                {timeSlot.label}
              </div>
            ))}
          </div>
          
          {/* Provider columns */}
          {providers.map(provider => (
            <div key={provider.id} className="flex-1 min-w-[280px]">
              {timeSlots.map((timeSlot, index) => {
                const appointment = getAppointmentForTimeSlot(
                  timeSlot.hour, 
                  timeSlot.minute, 
                  provider.id
                );
                
                return (
                  <div 
                    key={`slot-${provider.id}-${index}`} 
                    className="p-1 h-16 border-b border-r relative"
                  >
                    {appointment ? renderAppointment(appointment) : renderEmptySlot(timeSlot.hour, timeSlot.minute, provider.id)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}