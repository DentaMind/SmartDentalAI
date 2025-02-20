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
import { Plus, Loader2 } from "lucide-react";
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

export default function PatientsPage() {
  const { t } = useTranslation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const { data: patients, isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {t("nav.patients")}
          </h1>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
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

        <div className="bg-white rounded-lg shadow">
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
                  <TableHead>{t("patient.allergies")}</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients?.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell>{patient.name}</TableCell>
                    <TableCell>{patient.dateOfBirth}</TableCell>
                    <TableCell>{patient.contact}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {patient.medicalHistory}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {patient.allergies}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedPatient(patient)}
                      >
                        {t("patient.viewDetails")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!patients?.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      {t("patient.noPatients")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
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