import { Patient } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
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
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import { SymptomPredictor } from "@/components/ai/symptom-predictor";

// Define a simplified user type compatible with what comes from the server
type UserInfo = {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string | null;
  dateOfBirth?: string | null;
  role: string;
  language?: string;
  insuranceProvider?: string | null;
  insuranceNumber?: string | null;
};

interface PatientDetailsProps {
  patient: Patient & { user: UserInfo };
  isOpen: boolean;
  onClose: () => void;
}

export function PatientDetails({ patient, isOpen, onClose }: PatientDetailsProps) {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  // Process the patient data to handle all potential formats
  const processedPatient = {
    ...patient,
    // Handle medical history data in various formats
    medicalHistory: (() => {
      if (!patient.medicalHistory) return 'No medical history recorded';
      
      // If it's a JSON string, parse and pretty print it
      if (typeof patient.medicalHistory === 'string') {
        if (patient.medicalHistory.startsWith('{') || patient.medicalHistory.startsWith('[')) {
          try {
            return JSON.stringify(JSON.parse(patient.medicalHistory), null, 2);
          } catch (e) {
            // If parsing fails, return as is
            return patient.medicalHistory;
          }
        }
        return patient.medicalHistory;
      }
      
      // If it's already an object, stringify it
      if (typeof patient.medicalHistory === 'object') {
        return JSON.stringify(patient.medicalHistory, null, 2);
      }
      
      return String(patient.medicalHistory);
    })(),
    
    // Handle allergies in various formats
    allergies: (() => {
      if (!patient.allergies) return 'No known allergies';
      
      // If it's a JSON string, parse and format it
      if (typeof patient.allergies === 'string') {
        if (patient.allergies.startsWith('[')) {
          try {
            const parsed = JSON.parse(patient.allergies);
            return Array.isArray(parsed) ? parsed.join(', ') : patient.allergies;
          } catch (e) {
            // If parsing fails, return as is
            return patient.allergies;
          }
        }
        return patient.allergies;
      }
      
      // If it's already an array, join with commas
      if (Array.isArray(patient.allergies)) {
        return (patient.allergies as string[]).join(', ');
      }
      
      return String(patient.allergies);
    })()
  };

  const navigateToProfile = () => {
    onClose();
    setLocation(`/patients/${patient.id}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-background z-10 pb-4 mb-4 border-b">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl">
              {`${patient.user.firstName} ${patient.user.lastName}`}
            </DialogTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={navigateToProfile}
              className="gap-2"
            >
              <span>Full Profile</span>
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="space-y-6 pb-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("patient.personalInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">{t("patient.dob")}</p>
                <p className="mt-1">{patient.user.dateOfBirth}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{t("patient.contact")}</p>
                <p className="mt-1">{patient.user.phoneNumber || patient.user.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Insurance Provider</p>
                <p className="mt-1">{patient.user.insuranceProvider || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Insurance Number</p>
                <p className="mt-1">{patient.user.insuranceNumber || 'Not provided'}</p>
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
                  {processedPatient.medicalHistory || t("common.none")}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {t("patient.allergies")}
                </p>
                <p className="mt-1 whitespace-pre-wrap">
                  {processedPatient.allergies || t("common.none")}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Emergency Contact
                </p>
                <p className="mt-1 whitespace-pre-wrap">
                  {patient.emergencyContactName || t("common.none")}
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
              <SymptomPredictor patientHistory={processedPatient.medicalHistory || undefined} />
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}