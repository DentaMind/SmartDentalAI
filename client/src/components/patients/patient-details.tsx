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
import { Patient } from "@/types/patient-types";

interface PatientDetailsProps {
  patient: Patient;
  isOpen: boolean;
  onClose: () => void;
}

export function PatientDetails({ patient, isOpen, onClose }: PatientDetailsProps) {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  // Format allergies for display
  const allergiesDisplay = (() => {
    if (!patient.allergies) return 'No known allergies';
    
    if (typeof patient.allergies === 'string') {
      if (patient.allergies.includes('[') || patient.allergies.includes('"')) {
        try {
          // Replace brackets and quotes for cleaner display
          return patient.allergies.replace(/[\[\]"]/g, "");
        } catch (e) {
          return patient.allergies;
        }
      }
      return patient.allergies;
    }
    
    if (Array.isArray(patient.allergies)) {
      return patient.allergies.join(', ');
    }
    
    return String(patient.allergies);
  })();

  // Format medical history
  const medicalHistoryDisplay = (() => {
    if (!patient.medicalHistory) return 'No medical history recorded';
    
    if (typeof patient.medicalHistory === 'string') {
      if (patient.medicalHistory.startsWith('{') || patient.medicalHistory.startsWith('[')) {
        try {
          const parsed = JSON.parse(patient.medicalHistory);
          if (parsed.systemicConditions) {
            return `Systemic Conditions: ${parsed.systemicConditions.join(', ')}\n` + 
                   (parsed.medications ? `Medications: ${parsed.medications.join(', ')}\n` : '') +
                   (parsed.allergies ? `Allergies: ${parsed.allergies.join(', ')}\n` : '') +
                   (parsed.surgicalHistory ? `Surgical History: ${parsed.surgicalHistory.join(', ')}` : '');
          }
          return JSON.stringify(parsed, null, 2);
        } catch (e) {
          return patient.medicalHistory;
        }
      }
      return patient.medicalHistory;
    }
    
    return 'No medical history recorded';
  })();

  const navigateToProfile = () => {
    onClose();
    setLocation(`/patients/${patient.id}`);
  };

  // Format emergency contact
  const formatEmergencyContact = () => {
    if (!patient.emergencyContactName) return 'Not provided';
    
    let contact = patient.emergencyContactName;
    if (patient.emergencyContactPhone) {
      contact += ` (${patient.emergencyContactPhone})`;
    }
    if (patient.emergencyContactRelationship) {
      contact += ` - ${patient.emergencyContactRelationship}`;
    }
    
    return contact;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-background z-10 pb-4 mb-4 border-b">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl">
              {patient?.user?.firstName || 'First'} {patient?.user?.lastName || 'Last'}
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
                <p className="mt-1">{patient?.user?.dateOfBirth || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{t("patient.contact")}</p>
                <p className="mt-1">{patient?.user?.phoneNumber || patient?.user?.email || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Insurance Provider</p>
                <p className="mt-1">{patient?.user?.insuranceProvider || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Insurance Number</p>
                <p className="mt-1">{patient?.user?.insuranceNumber || 'Not provided'}</p>
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
                  {medicalHistoryDisplay}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {t("patient.allergies")}
                </p>
                <p className="mt-1 whitespace-pre-wrap">
                  {allergiesDisplay}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Emergency Contact
                </p>
                <p className="mt-1 whitespace-pre-wrap">
                  {formatEmergencyContact()}
                </p>
              </div>
              {patient.currentMedications && (
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Current Medications
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">
                    {patient.currentMedications}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("ai.symptoms")}</CardTitle>
              <CardDescription>{t("ai.enterSymptoms")}</CardDescription>
            </CardHeader>
            <CardContent>
              <SymptomPredictor patientHistory={medicalHistoryDisplay} />
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}