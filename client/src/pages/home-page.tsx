import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, UserPlus, Calendar, Video, Activity } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Patient, Appointment } from "@shared/schema";
import LanguageToggle from "@/components/language-toggle";
import AppointmentScheduler from "@/components/appointment-scheduler";
import PatientForm from "@/components/patient-form";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export default function HomePage() {
  const { user } = useAuth();
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);

  const { data: patients, isLoading: loadingPatients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const { data: appointments, isLoading: loadingAppointments } = useQuery<
    Appointment[]
  >({
    queryKey: ["/api/appointments"],
  });

  const todayAppointments = appointments?.filter((apt) => {
    const today = new Date();
    const aptDate = new Date(apt.startTime);
    return (
      aptDate.getDate() === today.getDate() &&
      aptDate.getMonth() === today.getMonth() &&
      aptDate.getFullYear() === today.getFullYear()
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <h1 className="text-2xl font-bold">DentalAI Pro</h1>
          <div className="ml-auto flex items-center space-x-4">
            <LanguageToggle />
            <span>Dr. {user?.username}</span>
          </div>
        </div>
      </div>

      <main className="container py-6 space-y-8">
        <div className="grid gap-4 md:grid-cols-3">
          <Dialog open={showNewPatient} onOpenChange={setShowNewPatient}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <UserPlus className="mr-2 h-4 w-4" />
                New Patient
              </Button>
            </DialogTrigger>
            <DialogContent>
              <PatientForm onSuccess={() => setShowNewPatient(false)} />
            </DialogContent>
          </Dialog>

          <Dialog open={showScheduler} onOpenChange={setShowScheduler}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Appointment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <AppointmentScheduler onSuccess={() => setShowScheduler(false)} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Today's Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAppointments ? (
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              ) : todayAppointments?.length === 0 ? (
                <p className="text-muted-foreground text-center">
                  No appointments today
                </p>
              ) : (
                <div className="space-y-4">
                  {todayAppointments?.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          {new Date(apt.startTime).toLocaleTimeString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {apt.type}
                        </p>
                      </div>
                      {apt.isTelemedicine ? (
                        <Link href={`/telehealth/${apt.id}`}>
                          <Button size="sm" variant="outline">
                            <Video className="h-4 w-4 mr-2" />
                            Join Call
                          </Button>
                        </Link>
                      ) : (
                        <Link href={`/patients/${apt.patientId}`}>
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Patients</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPatients ? (
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              ) : (
                <div className="space-y-4">
                  {patients?.slice(0, 5).map((patient) => (
                    <Link
                      key={patient.id}
                      href={`/patients/${patient.id}`}
                      className="block"
                    >
                      <div className="flex items-center p-4 border rounded-lg hover:bg-muted transition-colors">
                        <div>
                          <p className="font-medium">
                            {patient.firstName} {patient.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(patient.dateOfBirth).toLocaleDateString()}
                          </p>
                        </div>
                        <Activity className="ml-auto h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
