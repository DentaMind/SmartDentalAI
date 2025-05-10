import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { HeartPulse, AlertTriangle, Info, History, Scale } from "lucide-react";
import { format } from 'date-fns';

export type ASAClassification = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'E';

interface AutoASAClassificationProps {
  patientId: number;
  patientName: string;
  medicalHistory: {
    systemicConditions?: string[];
    medications?: string[];
    allergies?: string[];
    vitalSigns?: {
      bloodPressure?: string;
      heartRate?: number;
      respiratoryRate?: number;
    };
    smokingHistory?: boolean;
  };
  readOnly?: boolean;
  initialClass?: ASAClassification;
  initialEmergencyStatus?: string;
  onClassificationChange?: (classification: ASAClassification) => void;
}

export function AutoASAClassification({
  patientId,
  patientName,
  medicalHistory = {},
  readOnly = false,
  initialClass = 'I',
  initialEmergencyStatus,
  onClassificationChange
}: AutoASAClassificationProps) {
  const [asaClass, setAsaClass] = useState<ASAClassification>(initialClass);
  const [asaReason, setAsaReason] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // ASA Classification criteria based on medical history
  useEffect(() => {
    // If readOnly and initialClass are provided, use initialClass
    if (readOnly && initialClass) {
      let reasons: string[] = ["Classification manually entered by provider"];
      setAsaClass(initialClass);
      setAsaReason(reasons);
      
      if (initialEmergencyStatus) {
        setAsaClass(prev => 'E' as ASAClassification);
        reasons.push("Emergency status: " + initialEmergencyStatus);
      }
      return;
    }

    let classification: ASAClassification = 'I';
    const reasons: string[] = [];
    
    // Check systematic conditions
    if (medicalHistory.systemicConditions && medicalHistory.systemicConditions.length > 0) {
      const severeConditions = medicalHistory.systemicConditions.filter((c: string) => 
        isHighRiskCondition(c)
      );
      
      const moderateConditions = medicalHistory.systemicConditions.filter((c: string) => 
        isModerateRiskCondition(c) && !severeConditions.includes(c)
      );
      
      if (severeConditions.length > 0) {
        classification = 'III';
        reasons.push(`Severe systemic condition${severeConditions.length > 1 ? 's' : ''}: ${severeConditions.join(', ')}`);
      } else if (moderateConditions.length > 0) {
        classification = 'II';
        reasons.push(`Mild systemic condition${moderateConditions.length > 1 ? 's' : ''}: ${moderateConditions.join(', ')}`);
      }
    }
    
    // Check medications for indication of severe conditions
    if (medicalHistory.medications && medicalHistory.medications.length > 0) {
      const highRiskMeds = medicalHistory.medications.filter((m: string) => 
        isHighRiskMedication(m)
      );
      
      if (highRiskMeds.length > 0 && !['III', 'IV'].includes(classification)) {
        classification = 'III';
        reasons.push(`High-risk medication${highRiskMeds.length > 1 ? 's' : ''}: ${highRiskMeds.join(', ')}`);
      }
    }
    
    // Check allergies
    if (medicalHistory.allergies && medicalHistory.allergies.length > 0) {
      const severeAllergies = medicalHistory.allergies.filter((a: string) => 
        isSevereAllergy(a)
      );
      
      if (severeAllergies.length > 0 && !['III', 'IV'].includes(classification)) {
        classification = 'II';
        reasons.push(`History of severe allerg${severeAllergies.length > 1 ? 'ies' : 'y'}: ${severeAllergies.join(', ')}`);
      }
    }
    
    // Check vital signs
    if (medicalHistory.vitalSigns) {
      const { bloodPressure, heartRate } = medicalHistory.vitalSigns;
      
      if (bloodPressure) {
        const [systolic, diastolic] = bloodPressure.split('/').map(Number);
        if ((systolic >= 160 || diastolic >= 100) && !['III', 'IV'].includes(classification)) {
          classification = 'III';
          reasons.push(`Uncontrolled hypertension: ${bloodPressure} mmHg`);
        } else if ((systolic >= 140 || diastolic >= 90) && !['II', 'III', 'IV'].includes(classification)) {
          classification = 'II';
          reasons.push(`Hypertension: ${bloodPressure} mmHg`);
        }
      }
      
      if (heartRate && (heartRate > 110 || heartRate < 50) && !['III', 'IV'].includes(classification)) {
        classification = 'II';
        reasons.push(`Abnormal heart rate: ${heartRate} bpm`);
      }
    }
    
    // Smoking
    if (medicalHistory.smokingHistory && classification === 'I') {
      classification = 'II';
      reasons.push('Current smoker');
    }
    
    // If no issues found, default to ASA I with explanation
    if (reasons.length === 0) {
      reasons.push('Healthy patient with no systemic disease');
    }
    
    setAsaClass(classification);
    setAsaReason(reasons);
    setLastUpdated(new Date());
    
    if (onClassificationChange) {
      onClassificationChange(classification);
    }
  }, [medicalHistory, onClassificationChange, readOnly, initialClass, initialEmergencyStatus]);
  
  // Helper functions to classify risk levels
  function isHighRiskCondition(condition: string): boolean {
    const highRiskConditions = [
      'Unstable Angina',
      'Recent Myocardial Infarction',
      'Congestive Heart Failure',
      'Severe Valvular Disease',
      'Uncontrolled Hypertension',
      'COPD',
      'Severe Asthma',
      'Sleep Apnea',
      'End-Stage Renal Disease',
      'Uncontrolled Diabetes',
      'Liver Failure',
      'Stroke',
      'Seizure Disorder',
      'Severe Anemia',
      'Malignant Hyperthermia',
      'Active Cancer'
    ];
    
    return highRiskConditions.some(c => 
      condition.toLowerCase().includes(c.toLowerCase())
    );
  }
  
  function isModerateRiskCondition(condition: string): boolean {
    const moderateRiskConditions = [
      'Hypertension',
      'Diabetes Mellitus',
      'Coronary Artery Disease',
      'Asthma',
      'Obesity',
      'Thyroid Disease',
      'Kidney Disease',
      'Arthritis',
      'GERD',
      'Anxiety',
      'Depression',
      'Osteoporosis'
    ];
    
    return moderateRiskConditions.some(c => 
      condition.toLowerCase().includes(c.toLowerCase())
    );
  }
  
  function isHighRiskMedication(medication: string): boolean {
    const highRiskMedications = [
      'Warfarin',
      'Coumadin',
      'Heparin',
      'Plavix',
      'Clopidogrel',
      'Dabigatran',
      'Apixaban',
      'Rivaroxaban',
      'Insulin',
      'Digoxin',
      'Amiodarone',
      'Lithium',
      'Methotrexate',
      'Carbamazepine',
      'Phenytoin',
      'Chemotherapy',
      'Immunosuppressant'
    ];
    
    return highRiskMedications.some(m => 
      medication.toLowerCase().includes(m.toLowerCase())
    );
  }
  
  function isSevereAllergy(allergy: string): boolean {
    const severeAllergies = [
      'Penicillin',
      'Sulfa',
      'Latex',
      'Lidocaine',
      'Epinephrine',
      'Codeine',
      'Aspirin',
      'NSAID',
      'Contrast',
      'Anaphylaxis'
    ];
    
    return severeAllergies.some(a => 
      allergy.toLowerCase().includes(a.toLowerCase())
    );
  }
  
  // Get color based on ASA classification
  const getAsaColor = () => {
    switch (asaClass) {
      case 'I': return 'bg-green-50 text-green-700 border-green-200';
      case 'II': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'III': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'IV': return 'bg-red-50 text-red-700 border-red-200';
      case 'V': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'VI': return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'E': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };
  
  // Get description of ASA class
  const getAsaDescription = () => {
    switch (asaClass) {
      case 'I': 
        return 'A normal healthy patient';
      case 'II': 
        return 'A patient with mild systemic disease';
      case 'III': 
        return 'A patient with severe systemic disease';
      case 'IV': 
        return 'A patient with severe systemic disease that is a constant threat to life';
      case 'V': 
        return 'A moribund patient who is not expected to survive without the operation';
      case 'VI': 
        return 'A declared brain-dead patient whose organs are being removed for donor purposes';
      case 'E': 
        return 'Emergency surgery required';
      default: 
        return 'Classification not available';
    }
  };
  
  // Get examples for each ASA class
  const getAsaExamples = () => {
    switch (asaClass) {
      case 'I':
        return [
          'Healthy, non-smoking, no or minimal alcohol use',
          'Normal BMI (18.5-24.9)',
          'No systemic disease'
        ];
      case 'II':
        return [
          'Mild diseases only without substantive functional limitations',
          'Current smoker, social alcohol drinker, pregnancy, obesity (30<BMI<40)',
          'Well-controlled hypertension or diabetes',
          'Mild lung disease'
        ];
      case 'III':
        return [
          'Substantive functional limitations',
          'One or more moderate to severe diseases',
          'Poorly controlled hypertension or diabetes',
          'COPD, morbid obesity (BMI ≥40), active hepatitis',
          'Implanted pacemaker, >3 months after MI or stroke'
        ];
      case 'IV':
        return [
          'Recent (<3 months) MI or stroke, ongoing cardiac ischemia',
          'Severe valve dysfunction, sepsis, DIC, ARDS',
          'Poorly controlled COPD, heart failure, hepatorenal failure'
        ];
      case 'V':
        return [
          'Not expected to survive >24 hours without surgery',
          'Massive trauma, intracranial bleed with mass effect',
          'Ruptured aneurysm, massive pulmonary embolism'
        ];
      case 'VI':
        return [
          'Brain-dead organ donor'
        ];
      case 'E':
        return [
          'Added to any classification (I-VI) when an emergency procedure is performed',
          'Acute life-threatening condition requiring immediate surgical intervention'
        ];
      default:
        return [];
    }
  };
  
  // Medical anesthesia implications for dentistry
  const getAnesthesiaImplications = () => {
    switch (asaClass) {
      case 'I':
        return [
          'No specific considerations',
          'All anesthetic techniques may be used',
          'Minimal monitoring required'
        ];
      case 'II':
        return [
          'Local anesthesia with or without epinephrine generally safe',
          'Some clinical medication modifications may be required',
          'Stress reduction protocols recommended',
          'Standard monitoring adequate'
        ];
      case 'III':
        return [
          'May need to limit epinephrine dosage',
          'Consult with physician before elective procedures',
          'Consider shorter appointments',
          'Enhanced monitoring recommended',
          'Nitrous oxide with caution'
        ];
      case 'IV':
        return [
          'Elective dental care contraindicated',
          'Consult with physician required before any procedure',
          'Consider emergency dental treatment only',
          'Hospital-based care preferred',
          'Careful epinephrine consideration'
        ];
      case 'V':
        return [
          'Emergency dental care only',
          'Hospital-based treatment only',
          'Advanced anesthesia support required'
        ];
      case 'VI':
        return [
          'Not applicable for dental treatment'
        ];
      case 'E':
        return [
          'Immediate emergency care required',
          'Prioritize airway management',
          'Minimal interventions to address emergency'
        ];
      default:
        return [];
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <HeartPulse className="h-5 w-5 text-primary" />
          ASA Classification
        </CardTitle>
        <CardDescription>
          Automated patient risk assessment based on medical history
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex flex-col items-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant="outline" 
                    className={`text-lg px-4 py-2 font-bold ${getAsaColor()}`}
                  >
                    ASA {asaClass}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{getAsaDescription()}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <span className="text-xs text-muted-foreground mt-1">
              {format(lastUpdated, "MMM d, yyyy")}
            </span>
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="text-sm font-medium">{getAsaDescription()}</div>
            
            <div className="space-y-1">
              {asaReason.map((reason, index) => (
                <div key={index} className="text-sm flex gap-1 items-start text-muted-foreground">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </div>
          
          <HoverCard>
            <HoverCardTrigger asChild>
              <button className="rounded-full h-8 w-8 border flex items-center justify-center">
                <Info className="h-4 w-4" />
                <span className="sr-only">ASA Class Information</span>
              </button>
            </HoverCardTrigger>
            <HoverCardContent className="w-96">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="font-semibold flex items-center gap-1">
                    <Scale className="h-4 w-4" />
                    ASA {asaClass} Classification
                  </h4>
                  <p className="text-sm">{getAsaDescription()}</p>
                </div>
                
                <div>
                  <h5 className="text-sm font-medium mb-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Classification Reasons:
                  </h5>
                  <ul className="text-xs list-disc list-inside space-y-1">
                    {asaReason.map((reason, index) => (
                      <li key={index}>{reason}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h5 className="text-sm font-medium mb-1 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Examples:
                  </h5>
                  <ul className="text-xs list-disc list-inside space-y-1">
                    {getAsaExamples().map((example, index) => (
                      <li key={index}>{example}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="border-t pt-2">
                  <h5 className="text-sm font-medium mb-1">
                    Anesthesia Implications:
                  </h5>
                  <ul className="text-xs list-disc list-inside space-y-1">
                    {getAnesthesiaImplications().map((implication, index) => (
                      <li key={index}>{implication}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="text-xs text-muted-foreground flex items-center gap-1 pt-1">
                  <History className="h-3 w-3" />
                  Last updated: {format(lastUpdated, "MMMM d, yyyy")}
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
      </CardContent>
    </Card>
  );
}