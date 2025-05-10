import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDate } from "@/lib/utils";
import {
  CalendarIcon,
  Clock,
  Loader2,
  Search,
  User,
  UserCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Types
interface Provider {
  id: number;
  firstName: string;
  lastName: string;
  role: string;
  specialization?: string;
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

interface TimeSlot {
  time: string;
  available: boolean;
}

// Form schema
const appointmentSchema = z.object({
  patientId: z.number().positive("Please select a patient"),
  providerId: z.number().positive("Please select a provider"),
  date: z.date({ required_error: "Please select a date" }),
  timeSlot: z.string().min(1, "Please select a time slot"),
  duration: z.number().positive("Please select a duration"),
  appointmentType: z.string().min(1, "Please select an appointment type"),
  notes: z.string().optional(),
  isOnline: z.boolean().default(false),
  insuranceVerification: z.boolean().default(true)
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
  patientId?: number;
  providerId?: number;
  initialDate?: Date;
  initialTime?: string;
  onSuccess?: (data: any) => void;
  onCancel?: () => void;
}

export function AppointmentForm({
  patientId,
  providerId,
  initialDate,
  initialTime,
  onSuccess,
  onCancel
}: AppointmentFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate || new Date());
  
  // Form setup
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patientId: patientId || 0,
      providerId: providerId || (user?.role === "doctor" ? user.id : 0),
      date: initialDate || new Date(),
      timeSlot: initialTime || "09:00",
      duration: 30,
      appointmentType: "cleaning",
      notes: "",
      isOnline: false,
      insuranceVerification: true
    }
  });
  
  // Fetch providers
  const { data: providers, isLoading: isLoadingProviders } = useQuery<Provider[]>({
    queryKey: ["/api/providers"],
    queryFn: async () => {
      try {
        return await apiRequest<Provider[]>("/api/providers");
      } catch (error) {
        console.error("Failed to fetch providers:", error);
        throw error;
      }
    }
  });
  
  // Fetch patients (with search)
  const { data: patients, isLoading: isLoadingPatients } = useQuery<Patient[]>({
    queryKey: ["/api/patients", searchQuery],
    queryFn: async () => {
      try {
        const endpoint = searchQuery 
          ? `/api/patients?search=${encodeURIComponent(searchQuery)}` 
          : "/api/patients";
        return await apiRequest<Patient[]>(endpoint);
      } catch (error) {
        console.error("Failed to fetch patients:", error);
        throw error;
      }
    },
    enabled: patientSearchOpen || !!patientId
  });
  
  // Fetch single patient
  const { data: selectedPatient } = useQuery<Patient>({
    queryKey: ["/api/patients", patientId],
    queryFn: async () => {
      try {
        return await apiRequest<Patient>(`/api/patients/${patientId}`);
      } catch (error) {
        console.error("Failed to fetch patient:", error);
        throw error;
      }
    },
    enabled: !!patientId
  });

  // Fetch time slots
  const { data: timeSlots = [], isLoading: isLoadingTimeSlots } = useQuery<TimeSlot[]>({
    queryKey: [
      "/api/available-slots", 
      form.watch("providerId"), 
      selectedDate.toISOString().split('T')[0]
    ],
    queryFn: async () => {
      try {
        const providerId = form.watch("providerId");
        const dateStr = selectedDate.toISOString().split('T')[0];
        return await apiRequest<TimeSlot[]>(
          `/api/available-slots?date=${dateStr}&providerId=${providerId}`
        );
      } catch (error) {
        console.error("Failed to fetch time slots:", error);
        // Generate time slots from 7am to 7pm in 15-minute increments
        return generateTimeSlots();
      }
    },
    enabled: !!form.watch("providerId")
  });
  
  // Appointment creation mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (data: AppointmentFormValues) => {
      return apiRequest({
        method: "POST",
        url: "/api/appointments",
        body: {
          patientId: data.patientId,
          doctorId: data.providerId,
          date: combineDateTime(data.date, data.timeSlot),
          status: "scheduled",
          notes: data.notes || null,
          isOnline: data.isOnline,
          insuranceVerified: data.insuranceVerification
        }
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Appointment scheduled",
        description: `Appointment has been successfully scheduled`,
        variant: "default",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: ["/api/appointments"] 
      });
      
      if (onSuccess) {
        onSuccess(data);
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
  
  // Utility function to generate time slots
  function generateTimeSlots(): TimeSlot[] {
    const slots: TimeSlot[] = [];
    // 7am to 7pm in 15-minute increments
    for (let hour = 7; hour < 19; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({
          time: timeString,
          available: Math.random() > 0.3 // Random availability for demo
        });
      }
    }
    return slots;
  }
  
  // Helper function to combine date and time
  function combineDateTime(date: Date, timeString: string): string {
    const [hours, minutes] = timeString.split(':').map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate.toISOString();
  }
  
  // Format time for display
  function formatTime(time: string): string {
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour, 10);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const hour12 = hourNum % 12 || 12;
    return `${hour12}:${minute} ${ampm}`;
  }
  
  // Effect to set patient when patientId changes
  useEffect(() => {
    if (selectedPatient && patientId) {
      form.setValue("patientId", patientId);
    }
  }, [selectedPatient, patientId, form]);
  
  // Effect to update date in form when selectedDate changes
  useEffect(() => {
    form.setValue("date", selectedDate);
  }, [selectedDate, form]);
  
  // Handle form submission
  function onSubmit(data: AppointmentFormValues) {
    createAppointmentMutation.mutate(data);
  }
  
  // Get appointment type options
  const getAppointmentTypeOptions = () => [
    { value: "cleaning", label: "Regular Cleaning" },
    { value: "initial", label: "Initial Consultation" },
    { value: "follow-up", label: "Follow-up Visit" },
    { value: "procedure", label: "Dental Procedure" },
    { value: "emergency", label: "Emergency" },
  ];
  
  // Get duration options
  const getDurationOptions = () => [
    { value: 15, label: "15 minutes" },
    { value: 30, label: "30 minutes" },
    { value: 45, label: "45 minutes" },
    { value: 60, label: "1 hour" },
    { value: 90, label: "1 hour 30 minutes" },
    { value: 120, label: "2 hours" },
  ];
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Patient Selection */}
        <FormField
          control={form.control}
          name="patientId"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>Patient</FormLabel>
              <FormControl>
                <div className="relative">
                  {patientId ? (
                    // Show selected patient if patientId is provided
                    <div className="flex items-center p-2 border rounded-md">
                      <UserCircle className="h-5 w-5 mr-2 text-muted-foreground" />
                      <span>
                        {selectedPatient ? 
                          `${selectedPatient.firstName} ${selectedPatient.lastName}` : 
                          `Patient #${patientId}`}
                      </span>
                    </div>
                  ) : (
                    // Patient search and selection
                    <Dialog open={patientSearchOpen} onOpenChange={setPatientSearchOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          type="button"
                          className="w-full justify-start text-left font-normal"
                        >
                          <UserCircle className="h-4 w-4 mr-2" />
                          {field.value > 0 && patients ? 
                            patients.find(p => p.id === field.value)?.firstName + ' ' + 
                            patients.find(p => p.id === field.value)?.lastName : 
                            "Select patient"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Select Patient</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="flex items-center gap-2">
                            <Search className="h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search patients..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="flex-1"
                            />
                          </div>
                          
                          <div className="max-h-[300px] overflow-y-auto space-y-2">
                            {isLoadingPatients ? (
                              <div className="flex justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                              </div>
                            ) : patients && patients.length > 0 ? (
                              patients.map((patient) => (
                                <div
                                  key={patient.id}
                                  className={cn(
                                    "flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-muted",
                                    patient.id === field.value && "bg-muted"
                                  )}
                                  onClick={() => {
                                    field.onChange(patient.id);
                                    setPatientSearchOpen(false);
                                  }}
                                >
                                  <div className="flex items-center">
                                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <div>
                                      <p className="font-medium">{patient.firstName} {patient.lastName}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {patient.dateOfBirth && `DOB: ${new Date(patient.dateOfBirth).toLocaleDateString()}`}
                                        {patient.phoneNumber && ` • ${patient.phoneNumber}`}
                                      </p>
                                    </div>
                                  </div>
                                  {patient.id === field.value && (
                                    <Badge variant="secondary">Selected</Badge>
                                  )}
                                </div>
                              ))
                            ) : (
                              <p className="text-center text-muted-foreground py-4">
                                No patients found
                              </p>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Provider Selection */}
        <FormField
          control={form.control}
          name="providerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Provider</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                defaultValue={field.value.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isLoadingProviders ? (
                    <div className="flex justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : providers && providers.length > 0 ? (
                    providers.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id.toString()}>
                        Dr. {provider.firstName} {provider.lastName} 
                        {provider.specialization && ` (${provider.specialization})`}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="0" disabled>
                      No providers available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Date Selection */}
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        formatDate(field.value)
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={(date) => {
                      if (date) {
                        field.onChange(date);
                        setSelectedDate(date);
                      }
                    }}
                    disabled={{ before: new Date() }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Time Slot Selection */}
        <FormField
          control={form.control}
          name="timeSlot"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Time</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time slot" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="max-h-[300px]">
                  {isLoadingTimeSlots ? (
                    <div className="flex justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : timeSlots.length > 0 ? (
                    timeSlots.map((slot) => (
                      <SelectItem
                        key={slot.time}
                        value={slot.time}
                        disabled={!slot.available}
                      >
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-2 text-muted-foreground" />
                          {formatTime(slot.time)}
                          {!slot.available && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Unavailable
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-center text-muted-foreground">
                      No time slots available
                    </div>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Duration Selection */}
        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration</FormLabel>
              <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value.toString()}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {getDurationOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Appointment Type */}
        <FormField
          control={form.control}
          name="appointmentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Appointment Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select appointment type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {getAppointmentTypeOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any notes or special instructions"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Options */}
        <div className="space-y-2">
          <FormField
            control={form.control}
            name="isOnline"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Online Appointment</FormLabel>
                  <FormDescription>
                    This appointment will be conducted via video call
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="insuranceVerification"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Verify Insurance</FormLabel>
                  <FormDescription>
                    Automatically verify insurance coverage for this appointment
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>
        
        {/* Form Actions */}
        <div className="flex justify-end space-x-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={createAppointmentMutation.isPending}
          >
            {createAppointmentMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Schedule Appointment
          </Button>
        </div>
      </form>
    </Form>
  );
}