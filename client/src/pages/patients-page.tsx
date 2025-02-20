import { useQuery } from "@tanstack/react-query";
import { Patient } from "@shared/schema";
import { Sidebar } from "@/components/layout/sidebar";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Eye, User2 } from "lucide-react";
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

export default function PatientsPage() {
  const { t } = useTranslation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const { data: patients, isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto py-6 max-w-7xl">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t("nav.patients")}</h1>
              <p className="text-muted-foreground mt-1">
                {patients?.length || 0} {t("patient.total")}
              </p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="gap-2">
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

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("patient.totalActive")}
                </CardTitle>
                <User2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{patients?.length || 0}</div>
              </CardContent>
            </Card>
            {/* Add more stat cards here */}
          </div>

          {/* Patient Table */}
          <div className="bg-card rounded-lg border shadow-sm">
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                  {patients?.map((patient) => (
                    <TableRow key={patient.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">{patient.name}</TableCell>
                      <TableCell>{patient.dateOfBirth}</TableCell>
                      <TableCell>{patient.contact}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {patient.medicalHistory}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedPatient(patient)}
                          className="w-full gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          {t("common.view")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!patients?.length && (
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