import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updatePatient } from "@/lib/api";

// Define the form schema
const appointmentPreferencesSchema = z.object({
  frequency: z.string().optional(),
  method: z.string().optional(),
  time: z.string().optional(),
  day: z.string().optional(),
  timeOfDay: z.string().optional(),
  duration: z.string().optional(),
  location: z.string().optional(),
  type: z.string().optional(),
  reminder: z.string().optional(),
  confirmation: z.string().optional(),
  cancellation: z.string().optional(),
  rescheduling: z.string().optional(),
  followUp: z.string().optional(),
});

type AppointmentPreferencesFormData = z.infer<typeof appointmentPreferencesSchema>;

interface EditAppointmentPreferencesProps {
  patientId: number;
  initialData?: AppointmentPreferencesFormData;
  onClose?: () => void;
}

export function EditAppointmentPreferences({
  patientId,
  initialData,
  onClose,
}: EditAppointmentPreferencesProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AppointmentPreferencesFormData>({
    resolver: zodResolver(appointmentPreferencesSchema),
    defaultValues: initialData || {},
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: AppointmentPreferencesFormData) => {
      return updatePatient(patientId, {
        appointmentRecallPreferences: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}`] });
      toast({
        title: "Success",
        description: "Appointment preferences updated successfully",
      });
      onClose?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update appointment preferences",
        variant: "destructive",
      });
      console.error("Error updating preferences:", error);
    },
  });

  const onSubmit = (data: AppointmentPreferencesFormData) => {
    updatePreferencesMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Appointment Preferences</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Recall Preferences */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Recall Preferences</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Recall Frequency</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="3months">Every 3 Months</SelectItem>
                          <SelectItem value="6months">Every 6 Months</SelectItem>
                          <SelectItem value="9months">Every 9 Months</SelectItem>
                          <SelectItem value="12months">Every 12 Months</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Communication Method</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone Call</SelectItem>
                          <SelectItem value="text">Text Message</SelectItem>
                          <SelectItem value="mail">Mail</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Time</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="morning">Morning</SelectItem>
                          <SelectItem value="afternoon">Afternoon</SelectItem>
                          <SelectItem value="evening">Evening</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="day"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Day</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="weekday">Weekday</SelectItem>
                          <SelectItem value="weekend">Weekend</SelectItem>
                          <SelectItem value="any">Any Day</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timeOfDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Time of Day</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select time of day" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="9am">9:00 AM</SelectItem>
                          <SelectItem value="10am">10:00 AM</SelectItem>
                          <SelectItem value="11am">11:00 AM</SelectItem>
                          <SelectItem value="1pm">1:00 PM</SelectItem>
                          <SelectItem value="2pm">2:00 PM</SelectItem>
                          <SelectItem value="3pm">3:00 PM</SelectItem>
                          <SelectItem value="4pm">4:00 PM</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Duration</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="30min">30 Minutes</SelectItem>
                          <SelectItem value="45min">45 Minutes</SelectItem>
                          <SelectItem value="60min">1 Hour</SelectItem>
                          <SelectItem value="90min">1.5 Hours</SelectItem>
                          <SelectItem value="120min">2 Hours</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Location</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="main">Main Office</SelectItem>
                          <SelectItem value="branch1">Branch Office 1</SelectItem>
                          <SelectItem value="branch2">Branch Office 2</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Appointment Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cleaning">Cleaning</SelectItem>
                          <SelectItem value="checkup">Checkup</SelectItem>
                          <SelectItem value="treatment">Treatment</SelectItem>
                          <SelectItem value="emergency">Emergency</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Notification Preferences</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="reminder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reminder Preferences</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select reminder preference" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1day">1 Day Before</SelectItem>
                          <SelectItem value="2days">2 Days Before</SelectItem>
                          <SelectItem value="1week">1 Week Before</SelectItem>
                          <SelectItem value="2weeks">2 Weeks Before</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmation Preferences</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select confirmation preference" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="email">Email Confirmation</SelectItem>
                          <SelectItem value="text">Text Confirmation</SelectItem>
                          <SelectItem value="phone">Phone Call</SelectItem>
                          <SelectItem value="none">No Confirmation</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cancellation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cancellation Policy</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select cancellation policy" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="24hours">24 Hours Notice</SelectItem>
                          <SelectItem value="48hours">48 Hours Notice</SelectItem>
                          <SelectItem value="72hours">72 Hours Notice</SelectItem>
                          <SelectItem value="1week">1 Week Notice</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rescheduling"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rescheduling Preferences</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select rescheduling preference" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="online">Online Rescheduling</SelectItem>
                          <SelectItem value="phone">Phone Call</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="text">Text Message</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="followUp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Follow-up Preferences</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select follow-up preference" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="email">Email Follow-up</SelectItem>
                          <SelectItem value="phone">Phone Call</SelectItem>
                          <SelectItem value="text">Text Message</SelectItem>
                          <SelectItem value="none">No Follow-up</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              {onClose && (
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={updatePreferencesMutation.isPending}>
                {updatePreferencesMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 