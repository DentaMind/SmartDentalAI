import { Patient } from "@shared/schema";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SymptomPredictor } from "@/components/ai/symptom-predictor";

interface PatientDetailsProps {
  patient: Patient;
  isOpen: boolean;
  onClose: () => void;
}

export function PatientDetails({ patient, isOpen, onClose }: PatientDetailsProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{patient.name}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("patient.personalInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">{t("patient.dob")}</p>
                <p className="mt-1">{patient.dateOfBirth}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{t("patient.contact")}</p>
                <p className="mt-1">{patient.contact}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("patient.medicalInfo")}</CardTitle>
              <CardDescription>{t("patient.medicalInfoDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {t("patient.medicalHistory")}
                </p>
                <p className="mt-1 whitespace-pre-wrap">
                  {patient.medicalHistory || t("common.none")}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {t("patient.allergies")}
                </p>
                <p className="mt-1 whitespace-pre-wrap">
                  {patient.allergies || t("common.none")}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("ai.symptoms")}</CardTitle>
              <CardDescription>{t("ai.enterSymptoms")}</CardDescription>
            </CardHeader>
            <CardContent>
              <SymptomPredictor patientHistory={patient.medicalHistory || undefined} />
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}