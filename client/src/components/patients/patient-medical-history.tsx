import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

interface PatientMedicalHistoryProps {
  patientId: number;
  patientName: string;
  readOnly?: boolean;
  onSave?: (data: any) => void;
}

export function PatientMedicalHistory({
  patientId,
  patientName,
  readOnly = false,
  onSave
}: PatientMedicalHistoryProps) {
  const handleSave = () => {
    if (onSave) {
      onSave({
        patientId,
        medicalHistory: {
          // Include sample medical history data here
          systemicConditions: ['Hypertension', 'Type 2 Diabetes'],
          medications: ['Metformin', 'Lisinopril'],
          allergies: ['Penicillin'],
          smokingHistory: true,
          pregnancyStatus: 'Not pregnant'
        }
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Medical History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Medical History Form</AlertTitle>
          <AlertDescription>
            This is a placeholder for the patient medical history form. In a real implementation, this would include 
            a comprehensive medical questionnaire.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Medical Conditions</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-2">
                <Switch id="condition-hypertension" defaultChecked={true} />
                <Label htmlFor="condition-hypertension">Hypertension</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="condition-diabetes" defaultChecked={true} />
                <Label htmlFor="condition-diabetes">Type 2 Diabetes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="condition-heart" defaultChecked={false} />
                <Label htmlFor="condition-heart">Heart Disease</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="condition-asthma" defaultChecked={false} />
                <Label htmlFor="condition-asthma">Asthma</Label>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Lifestyle</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-2">
                <Switch id="smoking" defaultChecked={true} />
                <Label htmlFor="smoking">Smoking</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="alcohol" defaultChecked={false} />
                <Label htmlFor="alcohol">Alcohol Consumption</Label>
              </div>
            </div>
          </div>

          {!readOnly && (
            <Button onClick={handleSave} className="mt-4">
              Save Medical History
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}