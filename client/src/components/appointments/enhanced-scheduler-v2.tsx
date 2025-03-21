import React, { useState } from "react";
import { format, parseISO, addDays, subDays } from "date-fns";
import { 
  Calendar, Clock, Plus, User, FileText, 
  CreditCard, Info, Phone, ChevronLeft, 
  ChevronRight, Calendar as CalendarIcon, 
  Search, MoreHorizontal
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";

// Mock data for providers and appointment slots
// In a real implementation, this would come from API calls

const providers = [
  {
    id: 1,
    firstName: "Dr.",
    lastName: "Abdin",
    specialization: "General Dentist",
    role: "doctor",
    photoUrl: "/assets/dentamind-logo.png"
  },
  {
    id: 2,
    firstName: "Mary",
    lastName: "RDH",
    specialization: "Hygienist",
    role: "hygienist",
    photoUrl: "/assets/dentamind-logo.png" 
  }
];

const patients = [
  {
    id: 1,
    firstName: "Sarah",
    lastName: "Johnson",
    dateOfBirth: "1985-05-12",
    phoneNumber: "555-123-4567",
    email: "sarah.johnson@example.com",
    insuranceProvider: "Delta Dental",
    insuranceNumber: "DD12345678",
    allergies: "Penicillin",
    photoUrl: "/assets/dentamind-logo.png"
  },
  {
    id: 2,
    firstName: "Michael",
    lastName: "Williams",
    dateOfBirth: "1975-08-23",
    phoneNumber: "555-987-6543",
    email: "michael.williams@example.com",
    insuranceProvider: "Cigna Dental",
    insuranceNumber: "CD87654321",
    allergies: "Latex, Codeine",
    photoUrl: "/assets/dentamind-logo.png"
  }
];

// Sample appointments for Dr. Abdin and Mary RDH
const drAbdinAppointments = [
  {
    id: 1,
    patientId: 1,
    doctorId: 1,
    date: new Date(new Date().setHours(8, 0, 0, 0)),
    duration: 60,
    procedureType: "Comprehensive Exam",
    notes: "Comprehensive exam - new patient",
    status: "confirmed",
    operatory: "Room 1",
    patientName: "Sarah Johnson"
  },
  {
    id: 2,
    patientId: 2,
    doctorId: 1,
    date: new Date(new Date().setHours(9, 0, 0, 0)),
    duration: 90,
    procedureType: "Crown Prep",
    notes: "Crown prep for tooth #19",
    status: "confirmed",
    operatory: "Room 2",
    patientName: "Michael Williams"
  },
  {
    id: 3,
    patientId: 1,
    doctorId: 1,
    date: new Date(new Date().setHours(10, 30, 0, 0)),
    duration: 90,
    procedureType: "Root Canal",
    notes: "Root canal treatment on tooth #14",
    status: "confirmed",
    operatory: "Room 1",
    patientName: "Sarah Johnson"
  },
  {
    id: 4,
    patientId: 2,
    doctorId: 1,
    date: new Date(new Date().setHours(12, 0, 0, 0)),
    duration: 30,
    procedureType: "Composite",
    notes: "Composite filling on tooth #30",
    status: "confirmed",
    operatory: "Room 2",
    patientName: "Michael Williams"
  },
  {
    id: 5,
    patientId: 1,
    doctorId: 1,
    date: new Date(new Date().setHours(12, 30, 0, 0)),
    duration: 30,
    procedureType: "Recement Crown",
    notes: "Recement crown on tooth #3",
    status: "confirmed",
    operatory: "Room 1",
    patientName: "Sarah Johnson"
  },
  {
    id: 6,
    patientId: 2,
    doctorId: 1,
    date: new Date(new Date().setHours(12, 30, 0, 0)),
    duration: 30,
    procedureType: "Recement Crown",
    notes: "Recement crown on tooth #14",
    status: "confirmed",
    operatory: "Room 2",
    patientName: "Michael Williams"
  }
  // 1-2pm: Break (no appointments)
];

// Generate Mary RDH's appointments
const maryRdhAppointments = [];
for (let hour = 7; hour < 17; hour++) {
  // Skip lunch hour
  if (hour === 12) continue;
  
  maryRdhAppointments.push({
    id: 100 + hour,
    patientId: hour % 2 === 0 ? 1 : 2,
    doctorId: 2,
    date: new Date(new Date().setHours(hour, 0, 0, 0)),
    duration: 60,
    procedureType: hour % 3 === 0 ? "Prophylaxis" : "Perio Maintenance",
    notes: hour % 3 === 0 ? "Regular cleaning" : "Periodontal maintenance",
    status: "confirmed",
    operatory: "Hygiene Room 1",
    patientName: hour % 2 === 0 ? "Sarah Johnson" : "Michael Williams"
  });
}

// Combine all appointments
const allAppointments = [...drAbdinAppointments, ...maryRdhAppointments];

// Appointment type colors
const appointmentTypeColors = {
  "Comprehensive Exam": "bg-indigo-200 hover:bg-indigo-300 text-indigo-800",
  "Crown Prep": "bg-amber-200 hover:bg-amber-300 text-amber-800",
  "Root Canal": "bg-purple-200 hover:bg-purple-300 text-purple-800",
  "Composite": "bg-yellow-200 hover:bg-yellow-300 text-yellow-800",
  "Recement Crown": "bg-rose-200 hover:bg-rose-300 text-rose-800",
  "Prophylaxis": "bg-green-200 hover:bg-green-300 text-green-800",
  "Perio Maintenance": "bg-emerald-200 hover:bg-emerald-300 text-emerald-800"
};

// Helper function to generate time slots
const generateTimeSlots = (startHour = 7, endHour = 19, interval = 15) => {
  const slots = [];
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += interval) {
      slots.push({
        hour,
        minute,
        label: format(
          new Date(new Date().setHours(hour, minute, 0, 0)), 
          "h:mm a"
        ),
      });
    }
  }
  return slots;
};

export function EnhancedSchedulerV2() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);

  // Generate time slots for the schedule
  const timeSlots = generateTimeSlots();

  // Navigate to the previous or next day
  const navigateDate = (direction) => {
    setCurrentDate(direction === "prev" 
      ? subDays(currentDate, 1) 
      : addDays(currentDate, 1)
    );
  };

  // Find patient for an appointment
  const getPatientForAppointment = (patientId) => {
    return patients.find(patient => patient.id === patientId);
  };

  // Get appointments for a specific time slot and provider
  const getAppointmentsForSlot = (hour, minute, providerId) => {
    return allAppointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return (
        appointment.doctorId === providerId &&
        appointmentDate.getHours() === hour &&
        appointmentDate.getMinutes() === minute
      );
    });
  };

  // Handle appointment selection
  const handleAppointmentClick = (appointment) => {
    setSelectedAppointment(appointment);
    setShowAppointmentDetails(true);
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">
            <span className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Schedule
            </span>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </Button>
            <div className="flex items-center border rounded-md">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0" 
                onClick={() => navigateDate("prev")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="px-3 py-1 font-medium">
                {format(currentDate, "MMMM d, yyyy")}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0" 
                onClick={() => navigateDate("next")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search patients..."
                className="w-[200px] pl-8"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 overflow-auto">
        <div className="relative overflow-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-white z-10">
              <tr>
                <th className="border-b border-r min-w-[80px] bg-white sticky left-0 z-20">
                  <div className="px-2 py-3 text-left font-medium">Time</div>
                </th>
                {providers.map(provider => (
                  <th 
                    key={provider.id} 
                    className="border-b border-r p-0 min-w-[200px]"
                  >
                    <div className="py-2 text-center">
                      <div className="flex flex-col items-center">
                        <Avatar className="h-10 w-10 mb-1">
                          <AvatarImage src={provider.photoUrl} alt={`${provider.firstName} ${provider.lastName}`} />
                          <AvatarFallback>
                            {provider.firstName[0]}{provider.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="font-semibold">
                          {provider.firstName} {provider.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {provider.specialization}
                        </div>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(slot => (
                <tr key={`${slot.hour}-${slot.minute}`} className="border-b">
                  <td className="border-r px-2 py-1 text-xs font-medium sticky left-0 bg-white z-10">
                    {slot.label}
                  </td>
                  
                  {providers.map(provider => {
                    const appointments = getAppointmentsForSlot(
                      slot.hour, 
                      slot.minute, 
                      provider.id
                    );
                    
                    return (
                      <td 
                        key={`${provider.id}-${slot.hour}-${slot.minute}`} 
                        className="border-r px-0 py-0 h-10 min-h-[40px] relative"
                      >
                        {appointments.length > 0 ? (
                          appointments.map(appointment => {
                            const patient = getPatientForAppointment(appointment.patientId);
                            const bgColorClass = appointmentTypeColors[appointment.procedureType] || "bg-gray-200";
                            
                            return (
                              <HoverCard key={appointment.id} openDelay={200}>
                                <HoverCardTrigger asChild>
                                  <div 
                                    className={`px-2 py-1.5 m-0.5 rounded-sm ${bgColorClass} cursor-pointer text-xs`}
                                    onClick={() => handleAppointmentClick(appointment)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium truncate">{appointment.patientName}</span>
                                      <Badge variant="outline" className="text-[10px] h-4">
                                        {appointment.operatory}
                                      </Badge>
                                    </div>
                                    <div className="truncate text-[10px]">{appointment.procedureType}</div>
                                  </div>
                                </HoverCardTrigger>
                                <HoverCardContent className="w-72 p-0">
                                  <div className="flex items-center space-x-2 border-b p-3">
                                    <Avatar>
                                      <AvatarImage src={patient?.photoUrl} />
                                      <AvatarFallback>
                                        {patient?.firstName?.[0]}{patient?.lastName?.[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <h4 className="text-sm font-semibold">{appointment.patientName}</h4>
                                      <p className="text-xs text-muted-foreground">
                                        DOB: {patient?.dateOfBirth ? format(new Date(patient.dateOfBirth), "MM/dd/yyyy") : "N/A"}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 p-3">
                                    <div className="flex items-center">
                                      <Clock className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                                      <span className="text-xs">
                                        {format(new Date(appointment.date), "h:mm a")} 
                                        ({appointment.duration} min)
                                      </span>
                                    </div>
                                    <div className="flex items-center">
                                      <Phone className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                                      <span className="text-xs">{patient?.phoneNumber || "N/A"}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <CreditCard className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                                      <span className="text-xs">{patient?.insuranceProvider || "No Insurance"}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <Info className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                                      <span className="text-xs">
                                        {patient?.allergies ? 
                                          `Allergies: ${patient.allergies}` : 
                                          "No known allergies"}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="border-t p-3">
                                    <Link 
                                      href={`/patients/${patient?.id}`} 
                                      className="flex items-center justify-center text-xs font-medium text-primary"
                                    >
                                      <User className="h-3.5 w-3.5 mr-1" />
                                      View Patient Chart
                                    </Link>
                                  </div>
                                </HoverCardContent>
                              </HoverCard>
                            );
                          })
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="w-full h-full flex items-center justify-center">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-full rounded-none opacity-0 hover:opacity-100"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Add appointment</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Appointment Details Dialog */}
        <Dialog open={showAppointmentDetails} onOpenChange={setShowAppointmentDetails}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Appointment Details</DialogTitle>
            </DialogHeader>
            {selectedAppointment && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={getPatientForAppointment(selectedAppointment.patientId)?.photoUrl} />
                    <AvatarFallback>
                      {selectedAppointment.patientName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedAppointment.patientName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedAppointment.date), "MMMM d, yyyy")} at {format(new Date(selectedAppointment.date), "h:mm a")}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Procedure</h4>
                    <p>{selectedAppointment.procedureType}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Duration</h4>
                    <p>{selectedAppointment.duration} minutes</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                    <Badge variant={selectedAppointment.status === "confirmed" ? "outline" : "secondary"}>
                      {selectedAppointment.status}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Operatory</h4>
                    <p>{selectedAppointment.operatory}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Notes</h4>
                  <p className="text-sm">{selectedAppointment.notes}</p>
                </div>
                
                <div className="pt-4 border-t flex justify-between">
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    View Chart
                  </Button>
                  <div className="space-x-2">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                    <Button variant="default" size="sm">
                      Check In
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}