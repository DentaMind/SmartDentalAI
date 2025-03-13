import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TooltipProvider } from '@radix-ui/react-tooltip';

export type ASAClassification = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'E';

interface ASAClassificationProps {
  asaClass: ASAClassification;
  emergencyStatus?: boolean;
}

export function ASAClassificationCard({ asaClass, emergencyStatus = false }: ASAClassificationProps) {
  // Colors for different ASA classes
  const getBadgeColor = (asaClass: ASAClassification) => {
    switch (asaClass) {
      case 'I': return 'bg-green-100 text-green-800 border-green-300';
      case 'II': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'III': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'IV': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'V': return 'bg-red-100 text-red-800 border-red-300';
      case 'VI': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'E': return 'bg-red-200 text-red-800 border-red-400';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getDescription = (asaClass: ASAClassification) => {
    switch (asaClass) {
      case 'I': return 'Normal healthy patient';
      case 'II': return 'Patient with mild systemic disease';
      case 'III': return 'Patient with severe systemic disease';
      case 'IV': return 'Patient with severe systemic disease that is a constant threat to life';
      case 'V': return 'Moribund patient who is not expected to survive without the operation';
      case 'VI': return 'Declared brain-dead patient whose organs are being removed for donor purposes';
      case 'E': return 'Emergency surgery required (added to any classification)';
      default: return 'Not specified';
    }
  };
  
  const getRecommendations = (asaClass: ASAClassification) => {
    switch (asaClass) {
      case 'I': 
        return 'No special precautions required. Routine dental procedures can be performed.';
      case 'II': 
        return 'Minimal precautions may be needed. Consider stress reduction protocols.';
      case 'III':
        return 'Significant precautions required. Medical consultation recommended. Consider shorter appointments.';
      case 'IV': 
        return 'Extreme caution advised. Medical consultation mandatory. Treatment in hospital setting may be necessary.';
      case 'V':
        return 'Treatment likely only in hospital setting under close medical supervision.';
      case 'VI':
        return 'Not applicable for dental treatment.';
      case 'E':
        return 'Emergency treatment only to address acute condition. Postpone elective procedures.';
      default:
        return 'Consult with physician before treatment.';
    }
  };

  const getExamples = (asaClass: ASAClassification) => {
    switch (asaClass) {
      case 'I':
        return 'Healthy, non-smoking, minimal alcohol use';
      case 'II':
        return 'Controlled hypertension, mild diabetes, pregnancy, mild asthma, well-controlled epilepsy, smoking';
      case 'III':
        return 'Poorly controlled diabetes or hypertension, COPD, morbid obesity, active hepatitis, implanted pacemaker';
      case 'IV':
        return 'Unstable angina, recent MI, severe valve dysfunction, sepsis, advanced pulmonary/renal/hepatic dysfunction';
      case 'V':
        return 'Ruptured aneurysm, massive trauma, intracranial bleed, multiorgan failure';
      case 'VI':
        return 'Not applicable for dental patients';
      case 'E':
        return 'Added to any classification when emergency operation is required';
      default:
        return '';
    }
  };

  const displayClass = emergencyStatus ? `${asaClass}-E` : asaClass;
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base">ASA Physical Status Classification</CardTitle>
          <Badge className={`${getBadgeColor(asaClass)} py-1 px-2 text-sm font-bold`}>
            Class {displayClass}
          </Badge>
        </div>
        <CardDescription className="text-sm">{getDescription(asaClass)}</CardDescription>
      </CardHeader>
      
      <CardContent className="p-4 pt-0 space-y-2">
        <Alert className="py-2">
          <div className="flex items-start">
            <AlertCircle className="h-4 w-4 mt-0.5 mr-2 text-red-500" />
            <AlertDescription className="text-xs">
              <span className="font-medium">Clinical Implications:</span> {getRecommendations(asaClass)}
            </AlertDescription>
          </div>
        </Alert>
        
        <div className="text-xs text-muted-foreground">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="flex items-center underline decoration-dotted cursor-help">
                <InfoIcon className="h-3 w-3 mr-1" /> 
                Examples of conditions
              </TooltipTrigger>
              <TooltipContent className="p-2 max-w-xs bg-white shadow-lg rounded border">
                <p className="text-xs">{getExamples(asaClass)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}