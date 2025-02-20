import { useQuery } from "@tanstack/react-query";
import { Appointment } from "@shared/schema";
import { Sidebar } from "@/components/layout/sidebar";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AppointmentsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const { data: appointments } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments/doctor", user?.id],
  });

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {t("nav.appointments")}
          </h1>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t("appointment.schedule")}
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("appointment.date")}</TableHead>
                <TableHead>{t("appointment.time")}</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments?.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>
                    {new Date(appointment.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(appointment.date).toLocaleTimeString()}
                  </TableCell>
                  <TableCell>Patient #{appointment.patientId}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{appointment.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {appointment.isOnline ? (
                      <Badge variant="secondary">
                        <Video className="h-4 w-4 mr-1" />
                        Online
                      </Badge>
                    ) : (
                      <Badge>In-Person</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
