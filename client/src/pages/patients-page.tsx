import { useQuery } from "@tanstack/react-query";
import { Patient, User } from "@shared/schema";
import { Sidebar } from "@/components/layout/sidebar";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Eye, UserRound, Calendar, AlertCircle, ExternalLink, ArrowUpRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddPatientForm } from "@/components/patients/add-patient-form";
import { PatientDetails } from "@/components/patients/patient-details";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingAnimation } from "@/components/ui/loading-animation";

// Extended type to include user information
type PatientWithUser = Patient & {
  user: User;
};

export default function PatientsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientWithUser | null>(null);
  const [_, navigate] = useLocation();

  const { data: patients, isLoading, isError } = useQuery<PatientWithUser[]>({
    queryKey: ["/api/patients"],
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Get today's appointments count (mock data for now)
  const todayAppointments = 5;
  const urgentCases = 2;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto py-6 max-w-7xl">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold">
              Welcome back, {user?.firstName || "Doctor"}
            </h1>
            <p className="text-muted-foreground mt-2">
              Here's your practice overview for today
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <Card className="bg-primary/5 border-primary/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Patients
                </CardTitle>
                <UserRound className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{patients?.length || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total patients in your care
                </p>
              </CardContent>
            </Card>

            <Card className="bg-blue-50/50 border-blue-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Today's Appointments
                </CardTitle>
                <Calendar className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayAppointments}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Scheduled for today
                </p>
              </CardContent>
            </Card>

            <Card className="bg-orange-50/50 border-orange-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Urgent Cases
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{urgentCases}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Require immediate attention
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Action Bar */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold">Patient Management</h2>
              <p className="text-muted-foreground text-sm">
                View and manage your patients
              </p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="gap-2 shadow-sm">
                  <Plus className="h-5 w-5" />
                  {t("patient.add")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("patient.add")}</DialogTitle>
                </DialogHeader>
                <AddPatientForm onSuccess={() => setIsAddDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>

          {/* Patient Table */}
          <div className="bg-card rounded-lg border shadow-sm">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-32 gap-4">
                <LoadingAnimation />
                <p className="text-gray-600">Loading patient data...</p>
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center h-32 gap-4">
                <AlertCircle className="h-8 w-8 text-red-500" />
                <p className="text-gray-600">Error loading patients data. Please try again.</p>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                  className="gap-2"
                >
                  <ArrowUpRight className="h-4 w-4" />
                  Refresh Page
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("patient.name")}</TableHead>
                    <TableHead>{t("patient.dob")}</TableHead>
                    <TableHead>{t("patient.contact")}</TableHead>
                    <TableHead>{t("patient.medicalHistory")}</TableHead>
                    <TableHead className="w-[100px]">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(patients) && patients.length > 0 ? (
                    patients.map((patient) => (
                      <TableRow key={patient.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">
                          {patient.user && `${patient.user.firstName || ''} ${patient.user.lastName || ''}`}
                        </TableCell>
                        <TableCell>{patient.user?.dateOfBirth || 'N/A'}</TableCell>
                        <TableCell>{patient.user?.phoneNumber || patient.user?.email || 'N/A'}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {patient.medicalHistory || 'No medical history recorded'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setSelectedPatient(patient)}
                              className="gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              {t("common.view")}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/patients/${patient.id}`)}
                              className="gap-2"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Profile
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        {t("patient.noPatients")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        {selectedPatient && (
          <PatientDetails
            patient={selectedPatient}
            isOpen={!!selectedPatient}
            onClose={() => setSelectedPatient(null)}
          />
        )}
      </main>
    </div>
  );
}