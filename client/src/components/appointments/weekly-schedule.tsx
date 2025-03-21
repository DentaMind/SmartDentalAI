import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PatientNameButton } from "@/components/patients/patient-name-button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Activity, 
  Calendar,
  Clock,
  Timer,
  AlertTriangle,
  UserCheck,
  Shield,
  User,
  Phone,
  BellRing,
  UserPlus,
  RefreshCw,
  Info,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export type Doctor = {
  id: number;
  firstName: string;
  lastName: string;
  specialization: string;
};

export type Patient = {
  id: number;
  firstName: string;
  lastName: string;
};

export type Appointment = {
  id: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  date: string;
  duration: number;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
  checkedIn?: boolean;
  checkedInTime?: string;
  isOnline?: boolean;
  isNewPatient?: boolean;
  isFollowUp?: boolean;
  needsXray?: boolean;
  isEmergency?: boolean;
  insuranceVerified?: boolean;
  appointmentType?: string;
  reasonForVisit?: string;
  medicalAlerts?: string[];
};

interface WeeklyScheduleProps {
  doctors?: Doctor[];
  hygienists?: Doctor[];
  appointments?: Appointment[];
  onAddAppointment?: () => void;
  onViewAppointment?: (id: number) => void;
}

export function WeeklySchedule({ 
  doctors = [], 
  hygienists = [],
  appointments = [], 
  onAddAppointment, 
  onViewAppointment
}: WeeklyScheduleProps) {
  // All providers combined
  const providers = [...doctors, ...hygienists];
  
  // Get current week dates
  const getWeekDates = (date: Date) => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(date.setDate(diff));
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      weekDates.push(nextDay);
    }
    
    return weekDates;
  };
  
  // Format date for display
  const formatDate = (date: Date) => {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    return (
      <div className="text-center">
        <div className="text-xs text-gray-500">
          {date.toLocaleDateString('en-US', { weekday: 'short' })}
        </div>
        <div className={cn("font-semibold", isToday && "text-blue-600")}>
          {date.getDate()}
        </div>
      </div>
    );
  };
  
  // Format time for display
  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    return new Date(0, 0, 0, hour, minute).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };
  
  // Create time slots for the day (30 min intervals from 8am to 6pm)
  const timeSlots = Array.from({ length: 21 }, (_, i) => {
    const hour = Math.floor(i / 2) + 8;
    const minute = (i % 2) * 30;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  });
  
  // State for current week
  const [currentWeek, setCurrentWeek] = useState<Date[]>(getWeekDates(new Date()));
  
  // Separate dentists and hygienists
  const dentists = doctors || [];
  const hygienistsList = hygienists || [];

  // State for view type
  const [viewType, setViewType] = useState<'weekly' | 'daily'>('weekly');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Navigate between weeks
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = [...currentWeek];
    const days = direction === 'prev' ? -7 : 7;
    
    newWeek.forEach((date, i) => {
      const newDate = new Date(date);
      newDate.setDate(date.getDate() + days);
      newWeek[i] = newDate;
    });
    
    setCurrentWeek(newWeek);
  };
  
  return (
    <div className="flex flex-col">
      {/* Schedule Controls */}
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {viewType === 'weekly' ? (
              <>
                <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-medium">
                  {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentWeek[0])}
                </span>
                <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => {
                  const prevDay = new Date(selectedDate);
                  prevDay.setDate(prevDay.getDate() - 1);
                  setSelectedDate(prevDay);
                }}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-medium">
                  {new Intl.DateTimeFormat('en-US', { 
                    weekday: 'long',
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric' 
                  }).format(selectedDate)}
                </span>
                <Button variant="outline" size="sm" onClick={() => {
                  const nextDay = new Date(selectedDate);
                  nextDay.setDate(nextDay.getDate() + 1);
                  setSelectedDate(nextDay);
                }}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" 
              onClick={() => {
                setSelectedDate(new Date());
                setCurrentWeek(getWeekDates(new Date()));
              }}>
              Today
            </Button>

            <Button 
              variant={viewType === 'weekly' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setViewType('weekly')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Weekly View
            </Button>
            
            <Button 
              variant={viewType === 'daily' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setViewType('daily')}
            >
              <Clock className="h-4 w-4 mr-2" />
              Daily View
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  <Activity className="h-4 w-4 mr-2" />
                  AI Tools
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>AI Schedule Optimization</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <UserPlus className="h-4 w-4 mr-2" />
                  <span>Fill Empty Slots</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <span>Predict No-Shows</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  <span>Balance Provider Workload</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Shield className="h-4 w-4 mr-2" />
                  <span>Check Insurance/Finances</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <BellRing className="h-4 w-4 mr-2" />
                  <span>Notify Waitlisted Patients</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button size="sm" onClick={onAddAppointment}>
              <Plus className="h-4 w-4 mr-2" />
              Add Appointment
            </Button>
          </div>
        </div>
        
        {/* Smart Schedule Alerts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Card className="bg-blue-50 border-blue-200 p-2 flex items-center space-x-2">
            <Timer className="h-4 w-4 text-blue-500" />
            <div className="text-xs font-medium text-blue-700">
              5 gaps detected in the schedule. <Button variant="link" className="p-0 h-auto text-xs text-blue-700">Auto-fill</Button>
            </div>
          </Card>
          
          <Card className="bg-amber-50 border-amber-200 p-2 flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <div className="text-xs font-medium text-amber-700">
              3 patients likely to no-show. <Button variant="link" className="p-0 h-auto text-xs text-amber-700">View list</Button>
            </div>
          </Card>
          
          <Card className="bg-green-50 border-green-200 p-2 flex items-center space-x-2">
            <UserCheck className="h-4 w-4 text-green-500" />
            <div className="text-xs font-medium text-green-700">
              8 patients on waitlist for cancellations. <Button variant="link" className="p-0 h-auto text-xs text-green-700">Manage</Button>
            </div>
          </Card>
        </div>
      </div>
      
      {viewType === 'weekly' ? (
        /* Weekly Schedule View */
        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-[150px_repeat(7,1fr)] bg-gray-50">
            {/* Provider Column */}
            <div className="border-r border-gray-200 font-medium p-2 text-center">
              Provider / Time
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
          
          {/* Provider Rows */}
          <div className="bg-gray-50 border-b border-gray-200">
            <div className="font-semibold px-3 py-2 text-sm bg-blue-100 text-blue-800">Dentists</div>
          </div>
          
          {dentists.map((dentist) => (
            <div key={dentist.id} className="grid grid-cols-[150px_repeat(7,1fr)] border-b border-gray-200">
              {/* Dentist Label */}
              <div className="border-r border-gray-200 p-2 text-sm font-medium">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {dentist.firstName.charAt(0)}{dentist.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{dentist.firstName} {dentist.lastName}</span>
                </div>
              </div>
              
              {/* Day Columns */}
              {currentWeek.map((date, dateIndex) => (
                <div 
                  key={dateIndex} 
                  className={cn(
                    "border-r border-gray-200 p-1 min-h-[60px]",
                    new Date().toDateString() === date.toDateString() && "bg-blue-50/30"
                  )}
                >
                  {/* Show simplified appointment info */}
                  {appointments?.filter(apt => {
                    const aptDate = new Date(apt.date);
                    const aptDateStr = aptDate.toISOString().split('T')[0];
                    const dateStr = date.toISOString().split('T')[0];
                    return apt.doctorId === dentist.id && aptDateStr === dateStr;
                  }).map(appointment => (
                    <div 
                      key={appointment.id}
                      onClick={() => onViewAppointment?.(appointment.id)}
                      className={cn(
                        "rounded mb-1 p-1 text-xs cursor-pointer hover:ring-2 hover:ring-offset-1 ring-primary transition-all",
                        appointment.status === "confirmed" ? "bg-green-100" : 
                        appointment.status === "scheduled" ? "bg-blue-100" : 
                        appointment.status === "cancelled" ? "bg-red-100" : 
                        appointment.isEmergency ? "bg-amber-100" : "bg-gray-100"
                      )}
                    >
                      <div className="font-medium truncate">
                        {new Date(appointment.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                      <div className="truncate">
                        {appointment.patientName || `Patient #${appointment.patientId}`}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
          
          {/* Hygienists Heading */}
          <div className="bg-gray-50 border-b border-gray-200">
            <div className="font-semibold px-3 py-2 text-sm bg-green-100 text-green-800">Hygienists</div>
          </div>
          
          {hygienistsList.map((hygienist) => (
            <div key={hygienist.id} className="grid grid-cols-[150px_repeat(7,1fr)] border-b border-gray-200">
              {/* Hygienist Label */}
              <div className="border-r border-gray-200 p-2 text-sm font-medium">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs bg-green-100 text-green-800">
                      {hygienist.firstName.charAt(0)}{hygienist.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{hygienist.firstName} {hygienist.lastName}</span>
                </div>
              </div>
              
              {/* Day Columns */}
              {currentWeek.map((date, dateIndex) => (
                <div 
                  key={dateIndex} 
                  className={cn(
                    "border-r border-gray-200 p-1 min-h-[60px]",
                    new Date().toDateString() === date.toDateString() && "bg-blue-50/30"
                  )}
                >
                  {/* Show simplified appointment info */}
                  {appointments?.filter(apt => {
                    const aptDate = new Date(apt.date);
                    const aptDateStr = aptDate.toISOString().split('T')[0];
                    const dateStr = date.toISOString().split('T')[0];
                    return apt.doctorId === hygienist.id && aptDateStr === dateStr;
                  }).map(appointment => (
                    <div 
                      key={appointment.id}
                      onClick={() => onViewAppointment?.(appointment.id)}
                      className={cn(
                        "rounded mb-1 p-1 text-xs cursor-pointer hover:ring-2 hover:ring-offset-1 ring-primary transition-all",
                        appointment.status === "confirmed" ? "bg-green-100" : 
                        appointment.status === "scheduled" ? "bg-blue-100" : 
                        appointment.status === "cancelled" ? "bg-red-100" : 
                        appointment.isEmergency ? "bg-amber-100" : "bg-gray-100"
                      )}
                    >
                      <div className="font-medium truncate">
                        {new Date(appointment.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                      <div className="truncate">
                        {appointment.patientName || `Patient #${appointment.patientId}`}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        /* Daily Schedule View */
        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-[150px_1fr_1fr] bg-gray-50">
            {/* Time Column */}
            <div className="border-r border-gray-200 font-medium p-2 text-center">
              Time
            </div>
            
            {/* Provider Headers */}
            <div className="border-r border-gray-200 p-2 text-center font-medium bg-blue-100 text-blue-800">
              Dentists
            </div>
            <div className="border-r border-gray-200 p-2 text-center font-medium bg-green-100 text-green-800">
              Hygienists
            </div>
          </div>
          
          {/* Time Slots */}
          <div className="overflow-auto max-h-[600px]">
            {timeSlots.map((timeSlot, timeIndex) => (
              <div 
                key={timeSlot} 
                className={cn(
                  "grid grid-cols-[150px_1fr_1fr] border-b border-gray-200",
                  timeIndex % 4 === 0 && "bg-gray-50" // Highlight full hours
                )}
              >
                {/* Time Label */}
                <div className={cn(
                  "border-r border-gray-200 p-2 text-xs font-medium flex items-center justify-center",
                  timeIndex % 4 === 0 ? "text-gray-700" : "text-gray-400"
                )}>
                  {formatTime(timeSlot)}
                </div>
                
                {/* Dentist Slot */}
                <div className="border-r border-gray-200 p-1 min-h-[80px]">
                  <div className="flex flex-col gap-1">
                    {dentists.map(dentist => {
                      const appointment = appointments?.find(apt => {
                        const aptDate = new Date(apt.date);
                        const aptDateStr = aptDate.toISOString().split('T')[0];
                        const dateStr = selectedDate.toISOString().split('T')[0];
                        const aptTime = aptDate.toTimeString().substring(0, 5);
                        return apt.doctorId === dentist.id && 
                              aptDateStr === dateStr && 
                              aptTime === timeSlot;
                      });
                      
                      return appointment ? (
                        <div 
                          key={dentist.id}
                          onClick={() => onViewAppointment?.(appointment.id)}
                          className={cn(
                            "rounded p-1 text-xs cursor-pointer hover:ring-2 hover:ring-offset-1 ring-primary transition-all",
                            appointment.status === "confirmed" ? "bg-green-100" : 
                            appointment.status === "scheduled" ? "bg-blue-100" : 
                            appointment.status === "cancelled" ? "bg-red-100" : 
                            appointment.isEmergency ? "bg-amber-100" : "bg-gray-100"
                          )}
                        >
                          <div className="flex items-center gap-1">
                            <Avatar className="h-4 w-4">
                              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                {dentist.firstName.charAt(0)}{dentist.lastName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium truncate">{dentist.firstName} {dentist.lastName}</span>
                          </div>
                          <div className="font-medium truncate pl-5">
                            {appointment.patientName || `Patient #${appointment.patientId}`}
                          </div>
                          <div className="flex flex-wrap items-center gap-1 pl-5">
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-[10px] h-3 px-1 py-0",
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
                                className="text-[10px] h-3 px-1 py-0 bg-indigo-50 text-indigo-800"
                              >
                                <Phone className="h-2 w-2 mr-1" />
                                online
                              </Badge>
                            )}
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
                
                {/* Hygienist Slot */}
                <div className="p-1 min-h-[80px]">
                  <div className="flex flex-col gap-1">
                    {hygienistsList.map(hygienist => {
                      const appointment = appointments?.find(apt => {
                        const aptDate = new Date(apt.date);
                        const aptDateStr = aptDate.toISOString().split('T')[0];
                        const dateStr = selectedDate.toISOString().split('T')[0];
                        const aptTime = aptDate.toTimeString().substring(0, 5);
                        return apt.doctorId === hygienist.id && 
                              aptDateStr === dateStr && 
                              aptTime === timeSlot;
                      });
                      
                      return appointment ? (
                        <div 
                          key={hygienist.id}
                          onClick={() => onViewAppointment?.(appointment.id)}
                          className={cn(
                            "rounded p-1 text-xs cursor-pointer hover:ring-2 hover:ring-offset-1 ring-primary transition-all",
                            appointment.status === "confirmed" ? "bg-green-100" : 
                            appointment.status === "scheduled" ? "bg-blue-100" : 
                            appointment.status === "cancelled" ? "bg-red-100" : 
                            appointment.isEmergency ? "bg-amber-100" : "bg-gray-100"
                          )}
                        >
                          <div className="flex items-center gap-1">
                            <Avatar className="h-4 w-4">
                              <AvatarFallback className="text-[10px] bg-green-100 text-green-800">
                                {hygienist.firstName.charAt(0)}{hygienist.lastName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium truncate">{hygienist.firstName} {hygienist.lastName}</span>
                          </div>
                          <div className="font-medium truncate pl-5">
                            {appointment.patientName || `Patient #${appointment.patientId}`}
                          </div>
                          <div className="flex flex-wrap items-center gap-1 pl-5">
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-[10px] h-3 px-1 py-0",
                                appointment.status === "confirmed" ? "bg-green-50 text-green-800" :
                                appointment.status === "scheduled" ? "bg-blue-50 text-blue-800" :
                                appointment.status === "cancelled" ? "bg-red-50 text-red-800" :
                                "bg-gray-50 text-gray-800"
                              )}
                            >
                              {appointment.status}
                            </Badge>
                            {appointment.isNewPatient && (
                              <Badge 
                                variant="secondary"
                                className="text-[10px] h-3 px-1 py-0 bg-purple-50 text-purple-800"
                              >
                                <User className="h-2 w-2 mr-1" />
                                new
                              </Badge>
                            )}
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Provider Legend */}
      <div className="mt-4 flex flex-wrap gap-2">
        {providers.map(provider => (
          <Card key={provider.id} className="p-2 flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {provider.firstName.charAt(0)}{provider.lastName.charAt(0)}
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