import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TreatmentPlan, Patient } from "@shared/schema";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, FileDown, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TreatmentPlanForm } from "@/components/treatment/treatment-plan-form";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export default function TreatmentPlansPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [selectedPatient, setSelectedPatient] = useState<string>("");

  const { data: patients, isLoading: loadingPatients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const { data: treatmentPlans, isLoading: loadingPlans } = useQuery<TreatmentPlan[]>({
    queryKey: ["/api/treatment-plans/patient", selectedPatient],
    enabled: !!selectedPatient,
  });

  const statusColors = {
    proposed: "default",
    accepted: "success",
    inProgress: "warning",
    completed: "success",
    cancelled: "destructive",
  } as const;

  const generatePDF = async (plan: TreatmentPlan) => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Header
    page.drawText('Treatment Plan', {
      x: 50,
      y: height - 50,
      size: 24,
      font,
      color: rgb(0, 0, 0),
    });

    // Content
    page.drawText(`Diagnosis: ${plan.diagnosis}`, {
      x: 50,
      y: height - 100,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });

    // Procedures
    let y = height - 150;
    page.drawText('Procedures:', {
      x: 50,
      y,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });

    const procedures = plan.procedures as string[];
    procedures.forEach((procedure, index) => {
      y -= 20;
      page.drawText(`${index + 1}. ${procedure}`, {
        x: 70,
        y,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });
    });

    // Cost
    page.drawText(`Total Cost: $${plan.cost}`, {
      x: 50,
      y: y - 40,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `treatment-plan-${plan.id}.pdf`;
    link.click();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {t("nav.treatmentPlans")}
          </h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t("treatment.create")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("treatment.create")}</DialogTitle>
              </DialogHeader>
              <TreatmentPlanForm
                patientId={Number(selectedPatient)}
                doctorId={user?.id as number}
              />
            </DialogContent>
          </Dialog>
        </div>

        <Card className="mb-6 p-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium">Filter by Patient:</span>
            <Select value={selectedPatient} onValueChange={setSelectedPatient}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a patient" />
              </SelectTrigger>
              <SelectContent>
                {patients?.map((patient) => (
                  <SelectItem key={patient.id} value={String(patient.id)}>
                    {patient.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {(loadingPatients || loadingPlans) ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Diagnosis</TableHead>
                  <TableHead>Procedures</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {treatmentPlans?.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      {plan.createdAt ? new Date(plan.createdAt).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      {patients?.find(p => p.id === plan.patientId)?.name}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {plan.diagnosis}
                    </TableCell>
                    <TableCell>
                      {(plan.procedures as string[]).length} procedures
                    </TableCell>
                    <TableCell>${plan.cost}</TableCell>
                    <TableCell>
                      <Badge variant={statusColors[plan.status as keyof typeof statusColors] ?? 'default'}>
                        {plan.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => generatePDF(plan)}
                      >
                        <FileDown className="h-4 w-4 mr-2" />
                        Export PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </div>
  );
}