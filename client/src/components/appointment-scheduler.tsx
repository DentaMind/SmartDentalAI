import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Patient } from "@shared/schema";

type AppointmentSchedulerProps = {
  patientId?: number;
  onSuccess: () => void;
};

const timeSlots = Array.from({ length: 8 }, (_, i) => {
  const hour = i + 9; // 9 AM to 4 PM
  return `${hour.toString().padStart(2, "0")}:00`;
});

export default function AppointmentScheduler({
  patientId,
  onSuccess,
}: AppointmentSchedulerProps) {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();
  const [selectedType, setSelectedType] = useState<string>();
  const [selectedPatientId, setSelectedPatientId] = useState<number | undefined>(
    patientId
  );

  const { data: patients, isLoading: loadingPatients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
    enabled: !patientId,
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDate || !selectedTime || !selectedType || !selectedPatientId) {
        throw new Error("Please fill all required fields");
      }

      const [hours] = selectedTime.split(":");
      const startTime = new Date(selectedDate);
      startTime.setHours(parseInt(hours), 0, 0, 0);

      const endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + 1);

      const res = await apiRequest("POST", "/api/appointments", {
        patientId: selectedPatientId,
        doctorId: 1, // TODO: Get from auth context
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        type: selectedType,
        status: "scheduled",
        isTelemedicine: selectedType === "telehealth",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Appointment scheduled",
        description: "The appointment has been scheduled successfully",
      });
      onSuccess();
    },
  });

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {!patientId && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Patient</label>
            <Select
              value={selectedPatientId?.toString()}
              onValueChange={(value) => setSelectedPatientId(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select patient" />
              </SelectTrigger>
              <SelectContent>
                {loadingPatients ? (
                  <div className="p-2">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  </div>
                ) : (
                  patients?.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id.toString()}>
                      {patient.firstName} {patient.lastName}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Appointment Type</label>
          <Select
            value={selectedType}
            onValueChange={(value) => setSelectedType(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="checkup">Regular Checkup</SelectItem>
              <SelectItem value="cleaning">Cleaning</SelectItem>
              <SelectItem value="filling">Filling</SelectItem>
              <SelectItem value="root-canal">Root Canal</SelectItem>
              <SelectItem value="telehealth">Telehealth Consultation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Date</label>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="border rounded-lg p-2"
            disabled={(date) => date < new Date() || date.getDay() === 0}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Time</label>
          <Select
            value={selectedTime}
            onValueChange={(value) => setSelectedTime(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select time" />
            </SelectTrigger>
            <SelectContent>
              {timeSlots.map((time) => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        onClick={() => createAppointmentMutation.mutate()}
        disabled={
          !selectedDate ||
          !selectedTime ||
          !selectedType ||
          !selectedPatientId ||
          createAppointmentMutation.isPending
        }
        className="w-full"
      >
        {createAppointmentMutation.isPending && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        Schedule Appointment
      </Button>
    </div>
  );
}
