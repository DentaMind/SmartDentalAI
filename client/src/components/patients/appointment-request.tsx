import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppointmentRequest } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CalendarIcon, CalendarCheck, Clock, HelpCircle } from "lucide-react";
import { format } from "date-fns";

interface AppointmentRequestProps {
  onSuccess?: () => void;
}

const appointmentRequestSchema = z.object({
  preferredDates: z.array(z.date()).min(1, "Please select at least one preferred date"),
  preferredTime: z.enum(["morning", "afternoon", "evening"]),
  appointmentType: z.enum(["examination", "cleaning", "emergency", "followup", "consultation"]),
  symptoms: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insuranceNumber: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof appointmentRequestSchema>;

export function AppointmentRequestForm({ onSuccess }: AppointmentRequestProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showInsuranceHelp, setShowInsuranceHelp] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(appointmentRequestSchema),
    defaultValues: {
      preferredDates: [],
      preferredTime: "morning",
      appointmentType: "examination",
      symptoms: "",
      insuranceProvider: "",
      insuranceNumber: "",
      notes: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: (data: AppointmentRequest) => 
      apiRequest('/api/appointments/request', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({
        title: "Appointment Requested",
        description: "Your appointment request has been submitted. We'll contact you shortly to confirm.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to submit request: ${error.message}`,
      });
    }
  });

  const onSubmit = (data: FormValues) => {
    if (!user?.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to request an appointment",
      });
      return;
    }

    const requestData: AppointmentRequest = {
      patientId: user.id,
      preferredDates: data.preferredDates.map(date => date.toISOString()),
      preferredTime: data.preferredTime,
      appointmentType: data.appointmentType,
      symptoms: data.symptoms,
      insuranceProvider: data.insuranceProvider,
      insuranceNumber: data.insuranceNumber,
      notes: data.notes,
    };

    submitMutation.mutate(requestData);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <CalendarCheck className="mr-2 h-5 w-5" />
          Request an Appointment
        </CardTitle>
        <CardDescription>
          Submit your preferred dates and we'll contact you to confirm
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="preferredDates"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Preferred Dates</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={`w-full justify-start text-left font-normal ${!field.value.length && "text-muted-foreground"}`}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value.length > 0 ? (
                            field.value.map(date => format(date, "PPP")).join(", ")
                          ) : (
                            <span>Pick a preferred date</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="multiple"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Select one or more preferred dates for your appointment
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="preferredTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Time</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your preferred time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="morning">Morning (8 AM - 12 PM)</SelectItem>
                        <SelectItem value="afternoon">Afternoon (12 PM - 4 PM)</SelectItem>
                        <SelectItem value="evening">Evening (4 PM - 6 PM)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        <SelectItem value="examination">Regular Examination</SelectItem>
                        <SelectItem value="cleaning">Teeth Cleaning</SelectItem>
                        <SelectItem value="emergency">Emergency Visit</SelectItem>
                        <SelectItem value="followup">Follow-up Appointment</SelectItem>
                        <SelectItem value="consultation">Consultation</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="symptoms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Symptoms or Reason for Visit</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please describe any symptoms or the reason for your visit"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <div className="flex items-start">
                <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-2" />
                <div>
                  <h4 className="font-medium text-blue-700">Insurance Verification</h4>
                  <p className="text-sm text-blue-600 mt-1">
                    Providing your insurance details helps us verify coverage for your requested appointment.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="insuranceProvider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Insurance Provider</FormLabel>
                    <FormControl>
                      <input
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="insuranceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Insurance Number/ID</FormLabel>
                    <FormControl>
                      <input
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional information you would like us to know"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full" 
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? "Submitting..." : "Request Appointment"}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="bg-slate-50 border-t px-6 py-3">
        <div className="text-xs text-gray-500">
          Note: This is a request only. Our staff will contact you to confirm availability and verify your insurance coverage.
        </div>
      </CardFooter>
    </Card>
  );
}