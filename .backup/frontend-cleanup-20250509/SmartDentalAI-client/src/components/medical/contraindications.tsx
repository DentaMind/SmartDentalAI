import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  AlertTriangle, 
  Pill, 
  AlertCircle, 
  Stethoscope, 
  Syringe, 
  Heart, 
  Activity,
  Ban,
  Clock 
} from "lucide-react";
import { ASAClassification } from './auto-asa-classification';

export enum ContraindicationSeverity {
  ABSOLUTE = 'absolute',
  RELATIVE = 'relative',
  CAUTION = 'caution',
  NONE = 'none'
}

export interface Contraindication {
  id: string;
  treatment: string;
  reason: string;
  severity: ContraindicationSeverity;
  alternatives?: string[];
  precautions?: string[];
  timeConstraint?: string;
}

interface ContraindicationsProps {
  patientId: number;
  patientName: string;
  asaClass?: ASAClassification;
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
    pregnancyStatus?: string;
  };
  readOnly?: boolean;
}

export function Contraindications({
  patientId,
  patientName,
  asaClass = 'I',
  medicalHistory = {},
  readOnly = false
}: ContraindicationsProps) {
  const [contraindications, setContraindications] = useState<Contraindication[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Analyze medical history for contraindications
  useEffect(() => {
    setIsLoading(true);
    
    // This would typically be an API call in a real-world scenario
    const identifiedContraindications = analyzeContraindications(medicalHistory, asaClass);
    
    setContraindications(identifiedContraindications);
    setIsLoading(false);
  }, [medicalHistory, asaClass]);
  
  // Helper function to analyze medical history for contraindications
  function analyzeContraindications(history: any, asaClass: ASAClassification): Contraindication[] {
    const results: Contraindication[] = [];
    
    // Check allergies first - these are typically absolute contraindications
    if (history.allergies && history.allergies.length > 0) {
      if (typeof history.allergies === 'string') {
        const allergiesArray = history.allergies.split(',').map((a: string) => a.trim());
        allergiesArray.forEach((allergy: string) => {
          if (allergy.toLowerCase().includes('penicillin')) {
            results.push({
              id: `allergy-penicillin-${Date.now()}`,
              treatment: 'Penicillin antibiotics',
              reason: 'Patient has documented penicillin allergy',
              severity: ContraindicationSeverity.ABSOLUTE,
              alternatives: ['Clindamycin', 'Azithromycin', 'Clarithromycin'],
              precautions: ['Verify cross-reactivity with other beta-lactams']
            });
          }
          
          if (allergy.toLowerCase().includes('latex')) {
            results.push({
              id: `allergy-latex-${Date.now()}`,
              treatment: 'Latex-containing materials',
              reason: 'Patient has documented latex allergy',
              severity: ContraindicationSeverity.ABSOLUTE,
              alternatives: ['Nitrile gloves', 'Vinyl gloves', 'Latex-free dental dams'],
              precautions: ['Ensure all staff aware of latex allergy', 'Schedule as first appointment of day']
            });
          }
          
          if (allergy.toLowerCase().includes('lidocaine') || allergy.toLowerCase().includes('novocaine')) {
            results.push({
              id: `allergy-anesthetic-${Date.now()}`,
              treatment: 'Lidocaine/articaine anesthetics',
              reason: 'Patient has documented local anesthetic allergy',
              severity: ContraindicationSeverity.ABSOLUTE,
              alternatives: ['Diphenhydramine infiltration', 'General anesthesia'],
              precautions: ['Consult with allergist', 'Have emergency kit ready']
            });
          }
        });
      } else if (Array.isArray(history.allergies)) {
        history.allergies.forEach((allergy: string) => {
          // Same checks as above but for array format
          if (allergy.toLowerCase().includes('penicillin')) {
            results.push({
              id: `allergy-penicillin-${Date.now()}`,
              treatment: 'Penicillin antibiotics',
              reason: 'Patient has documented penicillin allergy',
              severity: ContraindicationSeverity.ABSOLUTE,
              alternatives: ['Clindamycin', 'Azithromycin', 'Clarithromycin'],
              precautions: ['Verify cross-reactivity with other beta-lactams']
            });
          }
          
          if (allergy.toLowerCase().includes('latex')) {
            results.push({
              id: `allergy-latex-${Date.now()}`,
              treatment: 'Latex-containing materials',
              reason: 'Patient has documented latex allergy',
              severity: ContraindicationSeverity.ABSOLUTE,
              alternatives: ['Nitrile gloves', 'Vinyl gloves', 'Latex-free dental dams'],
              precautions: ['Ensure all staff aware of latex allergy', 'Schedule as first appointment of day']
            });
          }
          
          if (allergy.toLowerCase().includes('lidocaine') || allergy.toLowerCase().includes('novocaine')) {
            results.push({
              id: `allergy-anesthetic-${Date.now()}`,
              treatment: 'Lidocaine/articaine anesthetics',
              reason: 'Patient has documented local anesthetic allergy',
              severity: ContraindicationSeverity.ABSOLUTE,
              alternatives: ['Diphenhydramine infiltration', 'General anesthesia'],
              precautions: ['Consult with allergist', 'Have emergency kit ready']
            });
          }
        });
      }
    }
    
    // Check medications for contraindications
    if (history.medications && history.medications.length > 0) {
      if (typeof history.medications === 'string') {
        const medicationsArray = history.medications.split(',').map((m: string) => m.trim());
        
        // Check for blood thinners
        if (medicationsArray.some((med: string) => 
          med.toLowerCase().includes('warfarin') || 
          med.toLowerCase().includes('coumadin') ||
          med.toLowerCase().includes('plavix') ||
          med.toLowerCase().includes('aspirin') ||
          med.toLowerCase().includes('eliquis') ||
          med.toLowerCase().includes('xarelto')
        )) {
          results.push({
            id: `medication-anticoagulant-${Date.now()}`,
            treatment: 'Invasive dental procedures',
            reason: 'Patient is taking anticoagulant medication',
            severity: ContraindicationSeverity.RELATIVE,
            alternatives: ['Minimally invasive techniques', 'Staged approach'],
            precautions: [
              'Consult with prescribing physician',
              'Check recent INR values',
              'Have local hemostatic agents available'
            ]
          });
        }
        
        // Check for bisphosphonates
        if (medicationsArray.some((med: string) => 
          med.toLowerCase().includes('fosamax') || 
          med.toLowerCase().includes('boniva') ||
          med.toLowerCase().includes('alendronate') ||
          med.toLowerCase().includes('zometa') ||
          med.toLowerCase().includes('reclast')
        )) {
          results.push({
            id: `medication-bisphosphonate-${Date.now()}`,
            treatment: 'Invasive oral surgery procedures',
            reason: 'Patient is taking bisphosphonate medication',
            severity: ContraindicationSeverity.RELATIVE,
            alternatives: ['Root canal instead of extraction when possible', 'Conservative management'],
            precautions: [
              'Consult with prescribing physician',
              'Assess duration and route of administration',
              'Risk assessment for MRONJ'
            ]
          });
        }
        
        // Check for immunosuppressants
        if (medicationsArray.some((med: string) => 
          med.toLowerCase().includes('prednisone') || 
          med.toLowerCase().includes('methotrexate') ||
          med.toLowerCase().includes('humira') ||
          med.toLowerCase().includes('cyclosporine') ||
          med.toLowerCase().includes('tacrolimus')
        )) {
          results.push({
            id: `medication-immunosuppressant-${Date.now()}`,
            treatment: 'Elective invasive procedures',
            reason: 'Patient is taking immunosuppressant medication',
            severity: ContraindicationSeverity.CAUTION,
            alternatives: ['Minimally invasive procedures', 'Prophylactic antibiotics'],
            precautions: [
              'Consider additional antibiotic prophylaxis',
              'Ensure strict aseptic technique',
              'Monitor for delayed healing'
            ]
          });
        }
      } else if (Array.isArray(history.medications)) {
        // Check for blood thinners
        if (history.medications.some((med: string) => 
          med.toLowerCase().includes('warfarin') || 
          med.toLowerCase().includes('coumadin') ||
          med.toLowerCase().includes('plavix') ||
          med.toLowerCase().includes('aspirin') ||
          med.toLowerCase().includes('eliquis') ||
          med.toLowerCase().includes('xarelto')
        )) {
          results.push({
            id: `medication-anticoagulant-${Date.now()}`,
            treatment: 'Invasive dental procedures',
            reason: 'Patient is taking anticoagulant medication',
            severity: ContraindicationSeverity.RELATIVE,
            alternatives: ['Minimally invasive techniques', 'Staged approach'],
            precautions: [
              'Consult with prescribing physician',
              'Check recent INR values',
              'Have local hemostatic agents available'
            ]
          });
        }
        
        // Check for bisphosphonates
        if (history.medications.some((med: string) => 
          med.toLowerCase().includes('fosamax') || 
          med.toLowerCase().includes('boniva') ||
          med.toLowerCase().includes('alendronate') ||
          med.toLowerCase().includes('zometa') ||
          med.toLowerCase().includes('reclast')
        )) {
          results.push({
            id: `medication-bisphosphonate-${Date.now()}`,
            treatment: 'Invasive oral surgery procedures',
            reason: 'Patient is taking bisphosphonate medication',
            severity: ContraindicationSeverity.RELATIVE,
            alternatives: ['Root canal instead of extraction when possible', 'Conservative management'],
            precautions: [
              'Consult with prescribing physician',
              'Assess duration and route of administration',
              'Risk assessment for MRONJ'
            ]
          });
        }
        
        // Check for immunosuppressants
        if (history.medications.some((med: string) => 
          med.toLowerCase().includes('prednisone') || 
          med.toLowerCase().includes('methotrexate') ||
          med.toLowerCase().includes('humira') ||
          med.toLowerCase().includes('cyclosporine') ||
          med.toLowerCase().includes('tacrolimus')
        )) {
          results.push({
            id: `medication-immunosuppressant-${Date.now()}`,
            treatment: 'Elective invasive procedures',
            reason: 'Patient is taking immunosuppressant medication',
            severity: ContraindicationSeverity.CAUTION,
            alternatives: ['Minimally invasive procedures', 'Prophylactic antibiotics'],
            precautions: [
              'Consider additional antibiotic prophylaxis',
              'Ensure strict aseptic technique',
              'Monitor for delayed healing'
            ]
          });
        }
      }
    }
    
    // Check systemic conditions
    if (history.systemicConditions) {
      let conditions: string[] = [];
      
      if (typeof history.systemicConditions === 'string') {
        conditions = history.systemicConditions.split(',').map((c: string) => c.trim());
      } else if (Array.isArray(history.systemicConditions)) {
        conditions = history.systemicConditions;
      }
      
      // Cardiovascular conditions
      if (conditions.some(condition => 
        condition.toLowerCase().includes('recent heart attack') ||
        condition.toLowerCase().includes('myocardial infarction') ||
        condition.toLowerCase().includes('unstable angina')
      )) {
        results.push({
          id: `cardiac-recent-mi-${Date.now()}`,
          treatment: 'Elective dental procedures',
          reason: 'Recent myocardial infarction or unstable cardiac condition',
          severity: ContraindicationSeverity.ABSOLUTE,
          alternatives: ['Emergency treatment only', 'Minimally invasive palliative care'],
          precautions: ['Cardiologist clearance required', 'Consider hospital-based dental care'],
          timeConstraint: 'Delay elective treatment minimum 6 months post-MI'
        });
      }
      
      // Pregnancy considerations
      if (history.pregnancyStatus && history.pregnancyStatus !== 'not_pregnant') {
        results.push({
          id: `pregnancy-${Date.now()}`,
          treatment: 'Elective radiographs and certain medications',
          reason: 'Patient is pregnant',
          severity: ContraindicationSeverity.RELATIVE,
          alternatives: ['Essential radiographs with lead apron', 'Category B medications'],
          precautions: [
            'Avoid tetracyclines and fluoroquinolones',
            'Minimize radiation exposure',
            'Consult with obstetrician for treatment planning'
          ]
        });
      }
      
      // Uncontrolled diabetes
      if (conditions.some(condition => 
        condition.toLowerCase().includes('uncontrolled diabetes')
      )) {
        results.push({
          id: `diabetes-uncontrolled-${Date.now()}`,
          treatment: 'Elective surgical procedures',
          reason: 'Uncontrolled diabetes',
          severity: ContraindicationSeverity.RELATIVE,
          alternatives: ['Address acute pain/infection', 'Defer elective treatment until controlled'],
          precautions: [
            'Morning appointments', 
            'Ensure patient has eaten', 
            'Have glucose monitoring available'
          ]
        });
      }
    }
    
    // Check ASA classification for general contraindications
    if (asaClass === 'IV' || asaClass === 'V') {
      results.push({
        id: `asa-class-${Date.now()}`,
        treatment: 'Elective outpatient dental procedures',
        reason: `Patient has ASA Classification ${asaClass}`,
        severity: ContraindicationSeverity.ABSOLUTE,
        alternatives: ['Hospital-based dental care', 'Emergency palliation only'],
        precautions: [
          'Medical consultation required',
          'Consider referral to hospital dentistry',
          'Emergency protocols must be in place'
        ]
      });
    } else if (asaClass === 'III') {
      results.push({
        id: `asa-class-${Date.now()}`,
        treatment: 'Complex surgical procedures',
        reason: `Patient has ASA Classification ${asaClass}`,
        severity: ContraindicationSeverity.RELATIVE,
        alternatives: ['Staged shorter appointments', 'Less invasive alternatives'],
        precautions: [
          'Medical consultation recommended',
          'Consider vital signs monitoring',
          'Modified anesthetic protocols may be needed'
        ]
      });
    }
    
    // Check vital signs for immediate contraindications
    if (history.vitalSigns) {
      const { bloodPressure, heartRate } = history.vitalSigns;
      
      if (bloodPressure) {
        const [systolic, diastolic] = bloodPressure.split('/').map(Number);
        
        // Hypertensive crisis
        if (systolic >= 180 || diastolic >= 110) {
          results.push({
            id: `bp-crisis-${Date.now()}`,
            treatment: 'All dental procedures',
            reason: 'Hypertensive crisis - BP ' + bloodPressure,
            severity: ContraindicationSeverity.ABSOLUTE,
            alternatives: ['Immediate medical referral', 'Reschedule after BP control'],
            precautions: [
              'Consider emergency medical services',
              'Monitor vital signs',
              'No dental treatment until stabilized'
            ]
          });
        } 
        // Severe hypertension
        else if (systolic >= 160 || diastolic >= 100) {
          results.push({
            id: `bp-severe-${Date.now()}`,
            treatment: 'Elective surgical procedures',
            reason: 'Severe hypertension - BP ' + bloodPressure,
            severity: ContraindicationSeverity.RELATIVE,
            alternatives: ['Urgent care only', 'Medical consultation'],
            precautions: [
              'Minimize epinephrine use',
              'Stress reduction protocols',
              'Consider medication review'
            ]
          });
        }
      }
      
      if (heartRate) {
        if (heartRate > 120 || heartRate < 50) {
          results.push({
            id: `hr-abnormal-${Date.now()}`,
            treatment: 'Elective dental procedures',
            reason: `Abnormal heart rate (${heartRate} bpm)`,
            severity: ContraindicationSeverity.RELATIVE,
            alternatives: ['Urgent care only', 'Medical consultation'],
            precautions: [
              'Continuous monitoring during treatment',
              'Avoid vasoconstrictors if tachycardia',
              'Have medical emergency kit ready'
            ]
          });
        }
      }
    }
    
    return results;
  }
  
  function getSeverityBadge(severity: ContraindicationSeverity) {
    switch (severity) {
      case ContraindicationSeverity.ABSOLUTE:
        return <Badge variant="destructive" className="whitespace-nowrap">Absolute</Badge>;
      case ContraindicationSeverity.RELATIVE:
        return <Badge variant="default" className="bg-amber-500 whitespace-nowrap">Relative</Badge>;
      case ContraindicationSeverity.CAUTION:
        return <Badge variant="outline" className="text-blue-600 border-blue-600 whitespace-nowrap">Caution</Badge>;
      default:
        return <Badge variant="outline" className="whitespace-nowrap">None</Badge>;
    }
  }
  
  function getSeverityIcon(severity: ContraindicationSeverity) {
    switch (severity) {
      case ContraindicationSeverity.ABSOLUTE:
        return <Ban className="h-5 w-5 text-red-500" />;
      case ContraindicationSeverity.RELATIVE:
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case ContraindicationSeverity.CAUTION:
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      default:
        return <Activity className="h-5 w-5 text-green-500" />;
    }
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" />
          Treatment Contraindications
        </CardTitle>
        <CardDescription>
          Automatic identification of treatment contraindications based on patient history
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : contraindications.length === 0 ? (
          <div className="text-center py-6">
            <Activity className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-green-700">No contraindications identified</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Patient appears to have no specific treatment contraindications based on their medical history
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-2">
              {contraindications.length} potential {contraindications.length === 1 ? 'contraindication' : 'contraindications'} identified
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/6">Severity</TableHead>
                    <TableHead className="w-1/4">Treatment</TableHead>
                    <TableHead className="w-1/3">Reason</TableHead>
                    <TableHead className="w-1/4">Recommendations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contraindications.map((contra) => (
                    <TableRow key={contra.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1 items-start">
                          {getSeverityBadge(contra.severity)}
                          {contra.timeConstraint && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <Clock className="h-3 w-3" />
                              <span>{contra.timeConstraint}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{contra.treatment}</TableCell>
                      <TableCell>{contra.reason}</TableCell>
                      <TableCell>
                        {contra.alternatives && contra.alternatives.length > 0 && (
                          <div className="mb-2">
                            <span className="text-xs font-medium text-muted-foreground">Alternatives:</span>
                            <ul className="text-xs mt-1 space-y-1">
                              {contra.alternatives.map((alt, i) => (
                                <li key={i} className="flex items-start gap-1.5">
                                  <Stethoscope className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                                  <span>{alt}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {contra.precautions && contra.precautions.length > 0 && (
                          <div>
                            <span className="text-xs font-medium text-muted-foreground">Precautions:</span>
                            <ul className="text-xs mt-1 space-y-1">
                              {contra.precautions.map((prec, i) => (
                                <li key={i} className="flex items-start gap-1.5">
                                  <Syringe className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                                  <span>{prec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}