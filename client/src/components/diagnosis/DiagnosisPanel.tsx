import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/api';
import { BrainCircuit, AlertTriangle, Check, X, Edit } from "lucide-react";
import { DiagnosisSuggestion, DiagnosisAuditLog } from '@/types/ai-diagnosis';

interface DiagnosisPanelProps {
  patientId: number;
  onDiagnosisSelected?: (diagnosis: string) => void;
}

export default function DiagnosisPanel({ patientId, onDiagnosisSelected }: DiagnosisPanelProps) {
  const [suggestions, setSuggestions] = useState<DiagnosisSuggestion[]>([]);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDiagnosisSuggestions();
  }, [patientId]);

  const fetchDiagnosisSuggestions = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest(`/api/diagnosis/${patientId}/suggestions`, 'GET');
      setSuggestions(response.suggestions);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch diagnosis suggestions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiagnosisSelect = (diagnosis: string) => {
    setSelectedDiagnosis(diagnosis);
    if (onDiagnosisSelected) {
      onDiagnosisSelected(diagnosis);
    }
  };

  const handleSubmit = async () => {
    if (!selectedDiagnosis) {
      toast({
        title: "Error",
        description: "Please select a diagnosis",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await apiRequest(`/api/diagnosis/${patientId}/select`, 'POST', {
        diagnosis: selectedDiagnosis,
        feedback,
        override: suggestions.find(s => s.diagnosis === selectedDiagnosis) === undefined
      });

      toast({
        title: "Success",
        description: "Diagnosis has been recorded",
      });

      // Reset form
      setSelectedDiagnosis(null);
      setFeedback("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit diagnosis",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFeedbackSubmit = async (suggestionId: number, correct: boolean) => {
    try {
      await apiRequest(`/api/diagnosis/${patientId}/feedback`, 'POST', {
        suggestionId,
        correct,
        feedback: "Provider feedback on AI suggestion"
      });

      toast({
        title: "Success",
        description: "Feedback has been submitted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit feedback",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BrainCircuit className="mr-2 h-5 w-5" />
            Loading AI Suggestions...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 w-3/4 bg-muted animate-pulse" />
            <div className="h-4 w-1/2 bg-muted animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5" />
            No Suggestions Available
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No AI diagnosis suggestions are available for this patient yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BrainCircuit className="mr-2 h-5 w-5" />
          AI Diagnosis Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant={suggestion.confidence > 0.7 ? "default" : "secondary"}>
                      {Math.round(suggestion.confidence * 100)}% Confidence
                    </Badge>
                    <span className="font-medium">{suggestion.diagnosis}</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDiagnosisSelect(suggestion.diagnosis)}
                      className={selectedDiagnosis === suggestion.diagnosis ? "bg-primary text-primary-foreground" : ""}
                    >
                      Select
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFeedbackSubmit(index, true)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFeedbackSubmit(index, false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {suggestion.evidence?.map((evidence, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <span className="font-medium">{evidence.source}:</span>
                      <span>{evidence.details}</span>
                    </div>
                  ))}
                </div>
                {index < suggestions.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="w-full">
          <textarea
            className="w-full p-2 border rounded-md"
            placeholder="Add additional notes or feedback..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
          />
        </div>
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedDiagnosis(null);
              setFeedback("");
            }}
          >
            Clear
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedDiagnosis || isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Diagnosis"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
} 