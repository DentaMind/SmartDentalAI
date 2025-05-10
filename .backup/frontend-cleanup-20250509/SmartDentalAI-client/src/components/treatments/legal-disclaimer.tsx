import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BadgeAlert, 
  ShieldAlert, 
  FileText, 
  Scale,
  Gavel
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface LegalDisclaimerProps {
  providerName: string;
  patientName: string;
  showCheckbox?: boolean;
  isChecked?: boolean;
  onCheckChange?: (checked: boolean) => void;
  variant?: 'default' | 'compact' | 'signature';
  signatureDate?: Date;
  generateDate?: Date;
}

export function LegalDisclaimer({
  providerName,
  patientName,
  showCheckbox = false,
  isChecked = false,
  onCheckChange,
  variant = 'default',
  signatureDate,
  generateDate = new Date()
}: LegalDisclaimerProps) {
  // If the variant is signature, we display the signed version with date
  if (variant === 'signature' && signatureDate) {
    return (
      <div className="space-y-4 text-sm">
        <div className="border border-muted p-4 rounded-md bg-muted/50">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <Gavel className="h-4 w-4" />
            Treatment Plan &amp; AI Diagnosis Disclaimer
          </div>
          <div className="text-muted-foreground mt-2 text-xs space-y-2">
            <p>
              I, {patientName}, acknowledge that the treatment plan provided by {providerName} is based on professional 
              judgment, which may be assisted by AI diagnostic tools. I understand that AI-generated insights are used as 
              a supplementary tool and that all final diagnostic and treatment decisions are made by my human healthcare provider.
            </p>
            <p>
              I understand that medical and dental treatments involve risks, and outcomes cannot be guaranteed.
              I have had the opportunity to ask questions about my diagnosis, treatment options, and associated risks.
            </p>
            <p className="font-medium">
              Signed electronically by {patientName} on {signatureDate.toLocaleDateString()} at {signatureDate.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // For the compact version used in treatment notes
  if (variant === 'compact') {
    return (
      <div className="text-xs text-muted-foreground mt-4 border-t pt-4">
        <div className="flex items-center gap-1.5 mb-1.5">
          <ShieldAlert className="h-3.5 w-3.5" />
          <span className="font-medium">Legal Disclaimer</span>
        </div>
        <p>
          While AI technology has been used to assist in analyzing diagnostic information, all final diagnostic 
          decisions and treatment recommendations have been made by {providerName}. This treatment plan reflects 
          the professional judgment of the healthcare provider, who assumes full responsibility for all diagnostic 
          conclusions and treatment recommendations herein.
        </p>
        <p className="mt-1.5">
          Generated on {generateDate.toLocaleDateString()} by {providerName}
        </p>
      </div>
    );
  }
  
  // Default full version
  return (
    <Card className="border-amber-200 bg-amber-50 text-amber-900">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BadgeAlert className="h-5 w-5" />
          Legal Protection Disclaimer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-amber-300 bg-amber-100">
          <div className="flex flex-col space-y-2">
            <div className="flex items-start">
              <ShieldAlert className="h-4 w-4 mr-2 mt-0.5" />
              <AlertDescription className="text-sm">
                <span className="font-medium">Provider Protection Statement:</span> While AI technology has been used to assist 
                in analyzing diagnostic information, all final diagnostic decisions and treatment recommendations have 
                been made by {providerName}. The healthcare provider assumes full responsibility for all diagnostic 
                conclusions and treatment recommendations herein.
              </AlertDescription>
            </div>
          </div>
        </Alert>
        
        <div className="text-sm space-y-4">
          <div className="flex items-start">
            <Scale className="h-4 w-4 mr-2 mt-0.5" />
            <div>
              <p className="font-medium">Liability Limitation</p>
              <p className="text-amber-800/90">
                This treatment plan represents the professional judgment of {providerName} based on current 
                information available. While AI analysis tools have been utilized to assist in data interpretation, 
                the healthcare provider has independently verified all diagnostic conclusions and treatment recommendations. 
                {providerName} shall not be held liable for limitations inherent in the AI's analysis capabilities.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <FileText className="h-4 w-4 mr-2 mt-0.5" />
            <div>
              <p className="font-medium">Patient Acknowledgment</p>
              <p className="text-amber-800/90">
                By consenting to this treatment plan, the patient ({patientName}) acknowledges that:
              </p>
              <ul className="list-disc pl-5 mt-1 text-amber-800/90 space-y-1">
                <li>All treatment involves some degree of risk</li>
                <li>Alternative treatment options have been discussed</li>
                <li>The treatment plan may be modified based on findings during treatment</li>
                <li>Success of treatment cannot be guaranteed</li>
                <li>The patient has had the opportunity to ask questions regarding diagnosis and treatment</li>
              </ul>
            </div>
          </div>
        </div>
        
        {showCheckbox && (
          <div className="flex items-center space-x-2 mt-2">
            <Checkbox 
              id="legal-disclaimer" 
              checked={isChecked} 
              onCheckedChange={(checked) => onCheckChange && onCheckChange(checked as boolean)}
            />
            <Label htmlFor="legal-disclaimer" className="text-sm">
              I acknowledge this disclaimer and confirm all clinical decisions are based on my professional judgment
            </Label>
          </div>
        )}
        
        <div className="text-right text-xs text-amber-800/70">
          Generated on {generateDate.toLocaleDateString()} at {generateDate.toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
}