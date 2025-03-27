import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface DiagnosisOption {
  label: string;
  confidence: number;
}

interface DiagnosisData {
  explanation: string;
  options: DiagnosisOption[];
  needsMoreInfo: boolean;
  followUpQuestion: string | null;
}

interface DiagnosisFeedbackUIProps {
  diagnosisData: DiagnosisData;
  onSubmitFeedback: (feedback: DiagnosisFeedback) => void;
}

interface DiagnosisFeedback {
  selectedDiagnosis: string | null;
  correctDiagnosis: string | null;
  additionalInformation: string;
  isAccurate: boolean;
}

/**
 * DiagnosisFeedbackUI - Component for providers to view AI diagnosis suggestions
 * and provide feedback to improve the AI system
 */
const DiagnosisFeedbackUI: React.FC<DiagnosisFeedbackUIProps> = ({ 
  diagnosisData, 
  onSubmitFeedback 
}) => {
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<string | null>(null);
  const [isAccurate, setIsAccurate] = useState<boolean | null>(null);
  const [correctDiagnosis, setCorrectDiagnosis] = useState<string>('');
  const [additionalInfo, setAdditionalInfo] = useState<string>('');
  const [showFeedbackForm, setShowFeedbackForm] = useState<boolean>(false);
  
  const handleSubmitFeedback = () => {
    onSubmitFeedback({
      selectedDiagnosis: selectedDiagnosis,
      correctDiagnosis: isAccurate === false ? correctDiagnosis : null,
      additionalInformation: additionalInfo,
      isAccurate: isAccurate === true
    });
    
    // Reset form
    setShowFeedbackForm(false);
  };
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return "bg-green-100 text-green-800 border-green-200";
    if (confidence >= 50) return "bg-amber-100 text-amber-800 border-amber-200";
    return "bg-red-100 text-red-800 border-red-200";
  };
  
  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 85) return <CheckCircle className="h-3.5 w-3.5" />;
    if (confidence >= 50) return <Info className="h-3.5 w-3.5" />;
    return <AlertTriangle className="h-3.5 w-3.5" />;
  };
  
  return (
    <div className="space-y-4">
      {diagnosisData.needsMoreInfo ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-800">Insufficient Information</h3>
                <p className="text-sm text-amber-700 mt-1">
                  The AI needs more clinical information to provide an accurate diagnosis.
                </p>
                {diagnosisData.followUpQuestion && (
                  <div className="mt-3 p-3 bg-white rounded-md border border-amber-200">
                    <p className="text-sm font-medium text-amber-800">Follow-up question:</p>
                    <p className="text-sm">{diagnosisData.followUpQuestion}</p>
                    <Textarea
                      className="mt-2"
                      placeholder="Provide the requested information..."
                      value={additionalInfo}
                      onChange={(e) => setAdditionalInfo(e.target.value)}
                    />
                    <Button size="sm" className="mt-2" onClick={() => onSubmitFeedback({
                      selectedDiagnosis: null,
                      correctDiagnosis: null,
                      additionalInformation: additionalInfo,
                      isAccurate: false
                    })}>
                      Submit Additional Information
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            <div className="mb-3">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                AI Diagnostic Suggestions
              </h3>
              <div className="space-y-2">
                {diagnosisData.options.map((option, index) => (
                  <div 
                    key={index}
                    className={cn(
                      "flex items-center justify-between p-2.5 border rounded-md cursor-pointer transition-colors",
                      selectedDiagnosis === option.label 
                        ? "border-primary bg-primary/5" 
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => setSelectedDiagnosis(option.label)}
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className={cn(
                          "w-4 h-4 rounded-full flex items-center justify-center",
                          selectedDiagnosis === option.label 
                            ? "bg-primary" 
                            : "border border-gray-300"
                        )}
                      >
                        {selectedDiagnosis === option.label && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                      <span className={cn(
                        "text-sm",
                        selectedDiagnosis === option.label ? "font-medium" : ""
                      )}>
                        {option.label}
                      </span>
                    </div>
                    <Badge 
                      variant="outline"
                      className={cn(
                        "ml-auto flex items-center gap-1.5",
                        getConfidenceColor(option.confidence)
                      )}
                    >
                      {getConfidenceIcon(option.confidence)}
                      <span>{option.confidence}% Confidence</span>
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Diagnostic Explanation
              </h3>
              <div className="p-3 bg-muted rounded-md text-sm">
                {diagnosisData.explanation}
              </div>
            </div>
            
            <div className="pt-2 flex justify-between items-center">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowFeedbackForm(!showFeedbackForm)}
              >
                {showFeedbackForm ? "Hide Feedback Form" : "Provide Feedback"}
              </Button>
              
              {selectedDiagnosis && (
                <Button size="sm" className="ml-auto">
                  Confirm Diagnosis
                </Button>
              )}
            </div>
            
            {showFeedbackForm && (
              <div className="pt-3 space-y-4 border-t mt-3">
                <h3 className="text-sm font-medium">Provider Feedback</h3>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-2">Is the primary AI diagnosis accurate?</p>
                    <RadioGroup
                      value={isAccurate === null ? undefined : isAccurate ? "yes" : "no"}
                      onValueChange={(value) => setIsAccurate(value === "yes")}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="accurate-yes" />
                        <Label htmlFor="accurate-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="accurate-no" />
                        <Label htmlFor="accurate-no">No</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  {isAccurate === false && (
                    <div>
                      <Label htmlFor="correct-diagnosis" className="text-sm">
                        What is the correct diagnosis?
                      </Label>
                      <Textarea
                        id="correct-diagnosis"
                        placeholder="Enter the correct diagnosis..."
                        value={correctDiagnosis}
                        onChange={(e) => setCorrectDiagnosis(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="additional-info" className="text-sm">
                      Additional Information or Comments
                    </Label>
                    <Textarea
                      id="additional-info"
                      placeholder="Provide any additional information that could help improve the AI diagnosis..."
                      value={additionalInfo}
                      onChange={(e) => setAdditionalInfo(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <Button onClick={handleSubmitFeedback}>
                    Submit Feedback
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DiagnosisFeedbackUI;