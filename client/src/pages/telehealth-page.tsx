import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Appointment, Patient } from "@shared/schema";
import VideoCall from "@/components/video-call";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function TelehealthPage() {
  const { id } = useParams<{ id: string }>();

  const { data: appointment, isLoading: loadingAppointment } = useQuery<
    Appointment
  >({
    queryKey: ["/api/appointments", parseInt(id)],
  });

  const { data: patient, isLoading: loadingPatient } = useQuery<Patient>({
    queryKey: ["/api/patients", appointment?.patientId],
    enabled: !!appointment,
  });

  if (loadingAppointment || loadingPatient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!appointment || !patient) {
    return <div>Appointment not found</div>;
  }

  return (
    <div className="container py-6 min-h-screen">
      <div className="grid md:grid-cols-[1fr_300px] gap-6">
        <VideoCall appointmentId={appointment.id} />
        
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-4">Patient Information</h2>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-muted-foreground">Name</dt>
                  <dd>
                    {patient.firstName} {patient.lastName}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">
                    Appointment Type
                  </dt>
                  <dd>{appointment.type}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Time</dt>
                  <dd>
                    {new Date(appointment.startTime).toLocaleTimeString()}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
