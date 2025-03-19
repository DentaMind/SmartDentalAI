import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Patient } from "@shared/schema";
import { CalendarIcon, SendHorizontal } from "lucide-react";
import { format, parseISO, addHours, isSameDay, isAfter, addDays, isWeekend } from "date-fns";

// Schema for appointment request
const requestSchema = z.object({
  preferredDate: z.date({
    required_error: "Please select a preferred date"
  }),
  preferredTimeSlot: z.string({
    required_error: "Please select a preferred time"
  }),
  alternateDate: z.date().optional(),
  alternateTimeSlot: z.string().optional(),
  reasonForVisit: z.string()
    .min(5, "Please provide a reason for your visit")
    .max(500, "Reason should be less than 500 characters"),
  additionalNotes: z.string().max(1000, "Additional notes should be less than 1000 characters").optional(),
  urgency: z.enum(["normal", "urgent"]).default("normal"),
  preferredDoctor: z.string().optional(),
});

type AppointmentRequestValues = z.infer<typeof requestSchema>;

export function AppointmentRequestForm() {
  const { user } = useAuth();
  
  // Fetch patient profile for the logged-in patient user
  const { data: patientProfile, isLoading: patientLoading } = useQuery({
    queryKey: ['/api/patients/profile'],
    queryFn: () => apiRequest<Patient>('/api/patients/profile'),
    enabled: user?.role === 'patient',
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Fetch doctors for selection
  const { data: doctors } = useQuery({
    queryKey: ['/api/doctors'],
    queryFn: () => apiRequest<any[]>('/api/doctors'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Define form with validation
  const form = useForm<AppointmentRequestValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      preferredTimeSlot: '',
      reasonForVisit: '',
      additionalNotes: '',
      urgency: 'normal',
    },
  });
  
  // Generate business-hours-only time slot options
  const generateTimeSlots = () => {
    const slots = [];
    // Generate times from 8 AM to 5 PM with 30-minute intervals
    for (let hour = 8; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        // Skip 5:30 PM slot
        if (hour === 17 && minute === 30) continue;
        
        const time = new Date();
        time.setHours(hour, minute, 0, 0);
        
        const formattedTime = format(time, 'h:mm a');
        slots.push({
          value: formattedTime,
          label: formattedTime
        });
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();
  
  // Handle form submission
  const onSubmit = async (data: AppointmentRequestValues) => {
    try {
      if (!patientProfile) {
        toast({
          title: "Patient information missing",
          description: "Could not retrieve your patient information. Please contact the clinic.",
          variant: "destructive",
        });
        return;
      }
      
      // Format dates for better email readability
      const formattedPreferredDate = format(data.preferredDate, 'MMMM d, yyyy');
      const formattedAlternateDate = data.alternateDate 
        ? format(data.alternateDate, 'MMMM d, yyyy') 
        : 'Not specified';
      
      // Create a complete request object with patient information
      const requestData = {
        ...data,
        patientId: patientProfile.id,
        patientName: `${patientProfile.firstName || ''} ${patientProfile.lastName || ''}`.trim(),
        patientEmail: patientProfile.email,
        patientPhone: patientProfile.phoneNumber,
        formattedPreferredDate,
        formattedAlternateDate,
        submittedAt: new Date().toISOString(),
      };
      
      // Send request to the server
      await apiRequest('/api/appointments/request', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });
      
      toast({
        title: "Appointment request submitted",
        description: "Your request has been sent to the clinic. We'll contact you to confirm.",
      });
      
      // Reset form
      form.reset();
      
    } catch (error) {
      console.error("Failed to submit appointment request:", error);
      toast({
        title: "Request failed",
        description: "Could not submit your appointment request. Please try again later.",
        variant: "destructive",
      });
    }
  };
  
  // Function to disable weekends and past dates
  const disableDates = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Disable past dates and weekends
    return isWeekend(date) || !isAfter(date, today);
  };

  const preferredDate = form.watch("preferredDate");
  
  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Request an Appointment</h2>
        <p className="text-sm text-muted-foreground">
          Fill out this form to request an appointment. The clinic will contact you to confirm the details.
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Preferred Date */}
            <FormField
              control={form.control}
              name="preferredDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Preferred Date*</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                        >
                          {field.value ? (
                            format(field.value, "MMMM d, yyyy")
                          ) : (
                            <span>Select date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={disableDates}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          
            {/* Preferred Time Slot */}
            <FormField
              control={form.control}
              name="preferredTimeSlot"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Time*</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {timeSlots.map((slot) => (
                        <SelectItem key={slot.value} value={slot.value}>
                          {slot.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Alternate Date */}
            <FormField
              control={form.control}
              name="alternateDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Alternate Date (Optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                        >
                          {field.value ? (
                            format(field.value, "MMMM d, yyyy")
                          ) : (
                            <span>Select alternate date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => {
                          // Don't allow same date as preferred date
                          return disableDates(date) || (preferredDate && isSameDay(date, preferredDate));
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          
            {/* Alternate Time Slot */}
            <FormField
              control={form.control}
              name="alternateTimeSlot"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alternate Time (Optional)</FormLabel>
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select alternate time" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {timeSlots.map((slot) => (
                        <SelectItem key={slot.value} value={slot.value}>
                          {slot.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Reason for Visit */}
          <FormField
            control={form.control}
            name="reasonForVisit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reason for Visit*</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Please describe the reason for your visit" 
                    className="resize-none"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Additional Notes */}
          <FormField
            control={form.control}
            name="additionalNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Notes (Optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Any additional information you'd like to share" 
                    className="resize-none"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Urgency */}
            <FormField
              control={form.control}
              name="urgency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Request Urgency</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select urgency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Preferred Doctor */}
            <FormField
              control={form.control}
              name="preferredDoctor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Doctor (Optional)</FormLabel>
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Any available doctor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {doctors?.map((doctor: any) => (
                        <SelectItem key={doctor.id} value={doctor.id.toString()}>
                          Dr. {doctor.firstName} {doctor.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="flex justify-end mt-6">
            <Button 
              type="submit" 
              className="flex gap-2 items-center"
              disabled={form.formState.isSubmitting}
            >
              <SendHorizontal className="h-4 w-4" />
              {form.formState.isSubmitting ? 'Sending...' : 'Send Request'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}