import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  InfoIcon, 
  HeartPulse, 
  Pill, 
  Cigarette, 
  Wine, 
  Baby, 
  Activity,
  Plus,
  Save
} from 'lucide-react';
import { VitalsTracker } from '@/components/medical/vitals-tracker';
import { DiseaseInformation } from '@/components/medical/disease-information';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

interface PatientMedicalHistoryProps {
  patientId: number;
  patientName: string;
  readOnly?: boolean;
  onSave?: (data: any) => void;
}

// Sample condition data structure
interface DiseaseInfo {
  name: string;
  description: string;
  implications: string[];
  dentalConsiderations: string[];
  medications?: string[];
  category: 'cardiovascular' | 'endocrine' | 'respiratory' | 'gastrointestinal' | 'neurological' | 'musculoskeletal' | 'autoimmune' | 'infectious' | 'other';
  severity: 'mild' | 'moderate' | 'severe';
  dateAdded: Date;
  lastUpdated?: Date;
}

export function PatientMedicalHistory({
  patientId,
  patientName,
  readOnly = false,
  onSave
}: PatientMedicalHistoryProps) {
  const { toast } = useToast();
  
  // Medical information states
  const [medications, setMedications] = useState<string[]>(['Metformin', 'Lisinopril']);
  const [allergies, setAllergies] = useState<string[]>(['Penicillin']);
  const [smoking, setSmoking] = useState<boolean>(true);
  const [alcohol, setAlcohol] = useState<boolean>(false);
  const [pregnancyStatus, setPregnancyStatus] = useState<string>('Not pregnant');
  const [newMedication, setNewMedication] = useState<string>('');
  const [newAllergy, setNewAllergy] = useState<string>('');
  const [notes, setNotes] = useState<string>('Patient has been managing hypertension and diabetes for 5 years.');
  
  // Vitals state
  const [vitals, setVitals] = useState({
    bloodPressure: '130/85',
    pulse: 78,
    respiratoryRate: 16,
    temperature: 98.6,
    oxygenSaturation: 98,
    weight: 75,
    height: 175,
    bmi: 24.5,
    lastUpdated: new Date()
  });

  // Medical conditions state
  const [conditions, setConditions] = useState<DiseaseInfo[]>([
    {
      name: 'Hypertension',
      description: 'High blood pressure condition where the long-term force of blood against artery walls is high enough to potentially cause health problems.',
      implications: ['May affect choice of anesthetics', 'Monitor blood pressure during treatment', 'Stress reduction protocols advised'],
      dentalConsiderations: [
        'Monitor blood pressure before procedures',
        'Limit epinephrine in anesthetics',
        'Consider stress reduction protocols',
        'Be aware of antihypertensive medication interactions'
      ],
      medications: ['Lisinopril'],
      category: 'cardiovascular',
      severity: 'moderate',
      dateAdded: new Date(2022, 3, 15)
    },
    {
      name: 'Type 2 Diabetes',
      description: 'Metabolic disorder characterized by high blood glucose levels over a prolonged period due to inadequate insulin production or cell response to insulin.',
      implications: ['Increased risk of periodontal disease', 'Delayed wound healing', 'Morning appointments preferred'],
      dentalConsiderations: [
        'Increased risk of periodontal disease',
        'Delayed wound healing',
        'Higher infection risk',
        'Morning appointments preferred',
        'Ensure patient has eaten properly'
      ],
      medications: ['Metformin'],
      category: 'endocrine',
      severity: 'moderate',
      dateAdded: new Date(2022, 3, 15)
    }
  ]);

  // Fetch medical history from API (would be used in a real implementation)
  const { data: medicalHistory, isLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}/medical-history`],
    enabled: !isNaN(patientId) && patientId > 0,
  });
  
  // Handle adding a medical condition
  const handleAddCondition = (condition: string) => {
    // In a real implementation, this would open a modal to select from a list
    toast({
      title: "Adding Condition Feature",
      description: "This would open a selection dialog to add a medical condition in a real implementation.",
      variant: "default",
    });
  };
  
  // Handle removing a medical condition
  const handleRemoveCondition = (conditionName: string) => {
    setConditions(prev => prev.filter(c => c.name !== conditionName));
    
    toast({
      title: "Condition Removed",
      description: `${conditionName} has been removed from the patient's medical history.`,
      variant: "default",
    });
  };
  
  // Handle updating a medical condition
  const handleUpdateCondition = (conditionName: string, updates: Partial<DiseaseInfo>) => {
    setConditions(prev => prev.map(c => {
      if (c.name === conditionName) {
        return { ...c, ...updates, lastUpdated: new Date() };
      }
      return c;
    }));
  };
  
  // Handle updating vitals
  const handleUpdateVitals = (updatedVitals: any) => {
    setVitals(updatedVitals);
    
    toast({
      title: "Vitals Updated",
      description: "Patient vitals have been updated successfully.",
      variant: "default",
    });
  };
  
  // Handle adding a medication
  const handleAddMedication = () => {
    if (newMedication.trim() !== '' && !medications.includes(newMedication)) {
      setMedications([...medications, newMedication]);
      setNewMedication('');
    }
  };
  
  // Handle adding an allergy
  const handleAddAllergy = () => {
    if (newAllergy.trim() !== '' && !allergies.includes(newAllergy)) {
      setAllergies([...allergies, newAllergy]);
      setNewAllergy('');
    }
  };
  
  // Handle removing a medication
  const handleRemoveMedication = (med: string) => {
    setMedications(medications.filter(m => m !== med));
  };
  
  // Handle removing an allergy
  const handleRemoveAllergy = (allergy: string) => {
    setAllergies(allergies.filter(a => a !== allergy));
  };

  // Handle saving all medical history
  const handleSave = () => {
    if (onSave) {
      const medicalHistoryData = {
        patientId,
        medicalHistory: {
          systemicConditions: conditions.map(c => c.name),
          medications,
          allergies,
          smoking,
          alcohol,
          pregnancyStatus,
          notes,
          vitalSigns: vitals
        }
      };
      
      onSave(medicalHistoryData);
      
      toast({
        title: "Medical History Saved",
        description: "Patient's medical history has been updated successfully.",
        variant: "default",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Vitals Tracker - always display at the top as it feeds into other AI systems */}
      <VitalsTracker 
        patientId={patientId} 
        initialVitals={vitals}
        readOnly={readOnly}
        onSave={handleUpdateVitals}
      />
      
      <Tabs defaultValue="conditions" className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="conditions">Medical Conditions</TabsTrigger>
          <TabsTrigger value="medications">Medications & Allergies</TabsTrigger>
          <TabsTrigger value="lifestyle">Lifestyle & History</TabsTrigger>
          <TabsTrigger value="notes">Medical Notes</TabsTrigger>
        </TabsList>
        
        {/* Medical Conditions Tab */}
        <TabsContent value="conditions">
          <DiseaseInformation 
            patientId={patientId}
            conditions={conditions}
            readOnly={readOnly}
            onAdd={handleAddCondition}
            onUpdate={handleUpdateCondition}
            onRemove={handleRemoveCondition}
          />
        </TabsContent>
        
        {/* Medications & Allergies Tab */}
        <TabsContent value="medications">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Pill className="h-5 w-5 text-primary" />
                Medications & Allergies
              </CardTitle>
              <CardDescription>
                Current medications and known allergies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Medications Section */}
              <div className="space-y-3">
                <h3 className="text-md font-medium">Medications</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {medications.map((med, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                      <span>{med}</span>
                      {!readOnly && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRemoveMedication(med)}
                          className="h-8 w-8 p-0"
                        >
                          <span className="sr-only">Remove</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                
                {!readOnly && (
                  <div className="flex gap-2 mt-2">
                    <Input 
                      placeholder="Add medication..."
                      value={newMedication}
                      onChange={(e) => setNewMedication(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={handleAddMedication} disabled={newMedication.trim() === ''}>
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Allergies Section */}
              <div className="space-y-3 pt-4 border-t">
                <h3 className="text-md font-medium">Allergies</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {allergies.map((allergy, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                      <span>{allergy}</span>
                      {!readOnly && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRemoveAllergy(allergy)}
                          className="h-8 w-8 p-0"
                        >
                          <span className="sr-only">Remove</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                
                {!readOnly && (
                  <div className="flex gap-2 mt-2">
                    <Input 
                      placeholder="Add allergy..."
                      value={newAllergy}
                      onChange={(e) => setNewAllergy(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={handleAddAllergy} disabled={newAllergy.trim() === ''}>
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Lifestyle & History Tab */}
        <TabsContent value="lifestyle">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Lifestyle & Social History
              </CardTitle>
              <CardDescription>
                Patient's lifestyle factors and social history
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Smoking Section */}
                <Card className="border shadow-none">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Cigarette className="h-4 w-4" />
                      Smoking Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant={smoking ? "default" : "outline"} 
                        size="sm"
                        onClick={() => !readOnly && setSmoking(true)}
                        disabled={readOnly}
                      >
                        Yes
                      </Button>
                      <Button 
                        variant={!smoking ? "default" : "outline"} 
                        size="sm"
                        onClick={() => !readOnly && setSmoking(false)}
                        disabled={readOnly}
                      >
                        No
                      </Button>
                    </div>
                    {smoking && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Patient is a current smoker. This increases risk for periodontal disease and delayed healing.
                      </p>
                    )}
                  </CardContent>
                </Card>
                
                {/* Alcohol Section */}
                <Card className="border shadow-none">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Wine className="h-4 w-4" />
                      Alcohol Consumption
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant={alcohol ? "default" : "outline"} 
                        size="sm"
                        onClick={() => !readOnly && setAlcohol(true)}
                        disabled={readOnly}
                      >
                        Yes
                      </Button>
                      <Button 
                        variant={!alcohol ? "default" : "outline"} 
                        size="sm"
                        onClick={() => !readOnly && setAlcohol(false)}
                        disabled={readOnly}
                      >
                        No
                      </Button>
                    </div>
                    {alcohol && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Patient consumes alcohol. Consider medication interactions and increased bleeding risk.
                      </p>
                    )}
                  </CardContent>
                </Card>
                
                {/* Pregnancy Status */}
                <Card className="border shadow-none">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Baby className="h-4 w-4" />
                      Pregnancy Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button 
                        variant={pregnancyStatus === 'Not pregnant' ? "default" : "outline"} 
                        size="sm"
                        onClick={() => !readOnly && setPregnancyStatus('Not pregnant')}
                        disabled={readOnly}
                      >
                        Not Pregnant
                      </Button>
                      <Button 
                        variant={pregnancyStatus === 'Pregnant' ? "default" : "outline"} 
                        size="sm"
                        onClick={() => !readOnly && setPregnancyStatus('Pregnant')}
                        disabled={readOnly}
                      >
                        Pregnant
                      </Button>
                      <Button 
                        variant={pregnancyStatus === 'Planning pregnancy' ? "default" : "outline"} 
                        size="sm"
                        onClick={() => !readOnly && setPregnancyStatus('Planning pregnancy')}
                        disabled={readOnly}
                      >
                        Planning
                      </Button>
                    </div>
                    {pregnancyStatus === 'Pregnant' && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Patient is pregnant. Avoid certain medications and X-rays. Consider treatment timing and consult with OB/GYN for complex procedures.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Medical Notes Tab */}
        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileIcon className="h-5 w-5 text-primary" />
                Medical Notes
              </CardTitle>
              <CardDescription>
                Additional notes and observations about the patient's medical history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                placeholder="Enter additional notes about the patient's medical history..."
                value={notes}
                onChange={(e) => !readOnly && setNotes(e.target.value)}
                disabled={readOnly}
                className="min-h-[200px]"
              />
              
              <div className="text-xs text-muted-foreground mt-2">
                Last updated: {format(new Date(), "MMMM d, yyyy")}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {!readOnly && (
        <div className="flex justify-end">
          <Button onClick={handleSave} className="gap-1">
            <Save className="h-4 w-4" />
            Save Medical History
          </Button>
        </div>
      )}
    </div>
  );
}

// FileIcon component (for consistency with Lucide icons)
function FileIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}