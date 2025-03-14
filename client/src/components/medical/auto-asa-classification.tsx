import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, AlertCircle, BarChart4, Pill, ShieldAlert } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';

// ASA Physical Status Classification System
export type ASAClassification = 1 | 2 | 3 | 4 | 5 | 6 | 'E' | 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';
export type EmergencyStatus = 'routine' | 'urgent' | 'emergency' | boolean;

interface ContraindicationItem {
  severity: 'low' | 'moderate' | 'high';
  condition: string;
  recommendation: string;
}

interface AutoASAClassificationProps {
  patientId: number;
  initialClass?: ASAClassification;
  initialEmergencyStatus?: EmergencyStatus;
  readOnly?: boolean;
}

export function AutoASAClassification({ 
  patientId, 
  initialClass = 'II', 
  initialEmergencyStatus = 'routine',
  readOnly = false
}: AutoASAClassificationProps) {
  const [asaClass, setASAClass] = useState<ASAClassification>(initialClass);
  const [emergencyStatus, setEmergencyStatus] = useState<EmergencyStatus>(initialEmergencyStatus);
  const [contraindications, setContraindications] = useState<ContraindicationItem[]>([]);
  const [aiProcessing, setAIProcessing] = useState(false);

  // Fetch patient medical history
  const { data: patientMedicalHistory, isLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}/medical-history`],
    enabled: !isNaN(patientId),
  });

  // Function to analyze medical history and determine ASA class
  const analyzePatientData = () => {
    setAIProcessing(true);
    
    // Simulate AI processing
    setTimeout(() => {
      // Analyze conditions, medications, and allergies to determine ASA class
      // In a real implementation, this would use the MEDICAL_AI_KEY to call an AI service
      
      let calculatedASA: ASAClassification = 1;
      let urgency: EmergencyStatus = 'routine';
      let detectedContraindications: ContraindicationItem[] = [];
      
      // Get medical history data
      const history = patientMedicalHistory || {};
      
      // Parse medical history to determine ASA class
      // This is a simplified example - in reality, this would be much more sophisticated
      if (history.systemicConditions && history.systemicConditions.length > 0) {
        const conditions = history.systemicConditions;
        
        // Check for severe conditions
        const severeLikelihoods = conditions.some(c => 
          c.toLowerCase().includes("diabetes") ||
          c.toLowerCase().includes("hypertension") ||
          c.toLowerCase().includes("heart disease"));
          
        if (severeLikelihoods) {
          calculatedASA = 3;
          
          // Add contraindications
          detectedContraindications.push({
            severity: 'moderate',
            condition: 'Diabetes/Hypertension',
            recommendation: 'Monitor blood pressure before procedures. Consider morning appointments.'
          });
        } else {
          calculatedASA = 2;
        }
        
        // Check for life-threatening conditions
        const lifeThreatening = conditions.some(c => 
          c.toLowerCase().includes("unstable angina") ||
          c.toLowerCase().includes("recent mi") ||
          c.toLowerCase().includes("severe valve"));
          
        if (lifeThreatening) {
          calculatedASA = 4;
          urgency = 'urgent';
          
          // Add contraindications
          detectedContraindications.push({
            severity: 'high',
            condition: 'Unstable cardiac condition',
            recommendation: 'Medical clearance required before any procedure.'
          });
        }
      }
      
      // Check medications for anticoagulants
      if (history.medications && history.medications.length > 0) {
        const onAnticoagulants = history.medications.some(m => 
          m.toLowerCase().includes("warfarin") ||
          m.toLowerCase().includes("coumadin") ||
          m.toLowerCase().includes("eliquis") ||
          m.toLowerCase().includes("xarelto"));
          
        if (onAnticoagulants) {
          // Add contraindications
          detectedContraindications.push({
            severity: 'moderate',
            condition: 'On anticoagulant therapy',
            recommendation: 'Avoid surgical procedures without consulting physician. May require INR test.'
          });
        }
      }
      
      // Check for allergies
      if (history.allergies && history.allergies.length > 0) {
        const hasLatexAllergy = history.allergies.some(a => 
          a.toLowerCase().includes("latex"));
          
        if (hasLatexAllergy) {
          // Add contraindications
          detectedContraindications.push({
            severity: 'moderate',
            condition: 'Latex allergy',
            recommendation: 'Use latex-free gloves and equipment only.'
          });
        }
        
        const hasAntibiotic = history.allergies.some(a => 
          a.toLowerCase().includes("penicillin") || 
          a.toLowerCase().includes("amoxicillin"));
          
        if (hasAntibiotic) {
          // Add contraindications
          detectedContraindications.push({
            severity: 'moderate',
            condition: 'Penicillin/Amoxicillin allergy',
            recommendation: 'Use alternative antibiotics such as clindamycin when antibiotic prophylaxis is indicated.'
          });
        }
      }
      
      // Update state with AI determinations
      setASAClass(calculatedASA);
      setEmergencyStatus(urgency);
      setContraindications(detectedContraindications);
      setAIProcessing(false);
    }, 1500);
  };

  // Determine ASA description and styling
  const getASADescription = (asaClass: ASAClassification): string => {
    // Convert string Roman numerals to numbers for consistency
    let numericClass = asaClass;
    if (asaClass === 'I') numericClass = 1;
    if (asaClass === 'II') numericClass = 2;
    if (asaClass === 'III') numericClass = 3;
    if (asaClass === 'IV') numericClass = 4;
    if (asaClass === 'V') numericClass = 5;
    if (asaClass === 'VI') numericClass = 6;
    
    switch (numericClass) {
      case 1:
        return "A normal healthy patient";
      case 2:
        return "A patient with mild systemic disease";
      case 3:
        return "A patient with severe systemic disease";
      case 4:
        return "A patient with severe systemic disease that is a constant threat to life";
      case 5:
        return "A moribund patient who is not expected to survive without the operation";
      case 6:
        return "A declared brain-dead patient whose organs are being removed for donor purposes";
      case 'E':
        return "Emergency operation";
      default:
        return "Not classified";
    }
  };

  const getASAColor = (asaClass: ASAClassification): string => {
    // Convert string Roman numerals to numbers for consistency
    let numericClass = asaClass;
    if (asaClass === 'I') numericClass = 1;
    if (asaClass === 'II') numericClass = 2;
    if (asaClass === 'III') numericClass = 3;
    if (asaClass === 'IV') numericClass = 4;
    if (asaClass === 'V') numericClass = 5;
    if (asaClass === 'VI') numericClass = 6;
    
    switch (numericClass) {
      case 1:
        return "bg-green-100 text-green-800";
      case 2:
        return "bg-blue-100 text-blue-800";
      case 3:
        return "bg-yellow-100 text-yellow-800";
      case 4:
        return "bg-orange-100 text-orange-800";
      case 5:
        return "bg-red-100 text-red-800";
      case 6:
        return "bg-purple-100 text-purple-800";
      case 'E':
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getEmergencyIcon = (status: EmergencyStatus) => {
    // Convert boolean to string if needed
    const stringStatus = typeof status === 'boolean' 
      ? (status ? 'emergency' : 'routine') 
      : status;
      
    switch (stringStatus) {
      case 'routine':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'urgent':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case 'emergency':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getEmergencyText = (status: EmergencyStatus): string => {
    // Convert boolean to string if needed
    const stringStatus = typeof status === 'boolean' 
      ? (status ? 'emergency' : 'routine') 
      : status;
      
    switch (stringStatus) {
      case 'routine':
        return "Routine Care";
      case 'urgent':
        return "Urgent Care Needed";
      case 'emergency':
        return "Emergency Care";
      default:
        return "Unspecified";
    }
  };

  const getEmergencyVariant = (status: EmergencyStatus) => {
    // Convert boolean to string if needed
    const stringStatus = typeof status === 'boolean' 
      ? (status ? 'emergency' : 'routine') 
      : status;
      
    switch (stringStatus) {
      case 'routine':
        return "outline";
      case 'urgent':
        return "secondary";
      case 'emergency':
        return "destructive";
      default:
        return "outline";
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'low':
        return "text-blue-600";
      case 'moderate':
        return "text-amber-600";
      case 'high':
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'moderate':
        return <ShieldAlert className="h-4 w-4 text-amber-500" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">AI-Assisted ASA Classification</CardTitle>
            <CardDescription>Automatically determined based on medical history</CardDescription>
          </div>
          {!readOnly && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={analyzePatientData}
              disabled={aiProcessing || isLoading}
              className="flex items-center gap-1"
            >
              <BarChart4 className="h-4 w-4" />
              {aiProcessing ? 'Analyzing...' : 'Analyze'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-2">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getASAColor(asaClass)}`}>
              ASA {asaClass}
            </div>
            <span className="text-sm font-medium">{getASADescription(asaClass)}</span>
          </div>

          <div className="flex items-center space-x-2">
            {getEmergencyIcon(emergencyStatus)}
            <Badge variant={getEmergencyVariant(emergencyStatus)}>
              {getEmergencyText(emergencyStatus)}
            </Badge>
          </div>

          {/* Medical Contraindications */}
          {contraindications.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                <Pill className="h-4 w-4" />
                Contraindications to Treatment
              </h4>
              <div className="space-y-3">
                {contraindications.map((item, i) => (
                  <div key={i} className="text-sm border-l-2 border-l-amber-400 pl-3 py-1">
                    <div className="flex items-center gap-1 font-medium mb-1">
                      {getSeverityIcon(item.severity)}
                      <span className={getSeverityColor(item.severity)}>{item.condition}</span>
                    </div>
                    <p className="text-muted-foreground">{item.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Emergency status messages */}
          <div className="text-sm text-muted-foreground">
            {emergencyStatus === 'emergency' && (
              <p className="text-red-600 font-medium">
                Patient requires immediate attention. Alert doctor immediately.
              </p>
            )}
            {emergencyStatus === 'urgent' && (
              <p className="text-amber-600">
                Schedule treatment within 24-48 hours.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}