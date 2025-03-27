import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { CheckCircle, AlertCircle, HelpCircle, Edit, ThumbsUp, ThumbsDown, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/api';

interface Diagnosis {
  id: string;
  condition: string;
  confidence: number;
  explanation: string;
  suggestedTreatments?: string[];
  aiSource?: string;
  createdAt: string;
  status?: 'pending' | 'approved' | 'rejected' | 'modified';
}

interface DiagnosisFeedbackUIProps {
  diagnosis: Diagnosis;
  patientId: number;
  onFeedbackSubmitted?: (updatedDiagnosis: Diagnosis) => void;
}

const DiagnosisFeedbackUI: React.FC<DiagnosisFeedbackUIProps> = ({ 
  diagnosis, 
  patientId,
  onFeedbackSubmitted
}) => {
  const [feedbackStatus, setFeedbackStatus] = useState<'pending' | 'approved' | 'rejected' | 'modified'>(
    diagnosis.status || 'pending'
  );
  const [providerNote, setProviderNote] = useState('');
  const [accuracyRating, setAccuracyRating] = useState(diagnosis.confidence * 100);
  const [isEditing, setIsEditing] = useState(false);
  const [modifiedDiagnosis, setModifiedDiagnosis] = useState(diagnosis.condition);
  const [modifiedExplanation, setModifiedExplanation] = useState(diagnosis.explanation);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleFeedbackSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const payload = {
        diagnosisId: diagnosis.id,
        patientId,
        status: feedbackStatus,
        providerNote,
        accuracyRating: accuracyRating / 100,
        modifiedDiagnosis: feedbackStatus === 'modified' ? modifiedDiagnosis : undefined,
        modifiedExplanation: feedbackStatus === 'modified' ? modifiedExplanation : undefined
      };
      
      const response = await apiRequest('/api/diagnosis-feedback', {
        method: 'POST',
        data: payload
      });
      
      toast({
        title: "Feedback submitted",
        description: "Thank you for improving our AI system.",
        variant: "success"
      });
      
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted({
          ...diagnosis,
          status: feedbackStatus,
          condition: feedbackStatus === 'modified' ? modifiedDiagnosis : diagnosis.condition,
          explanation: feedbackStatus === 'modified' ? modifiedExplanation : diagnosis.explanation,
          confidence: accuracyRating / 100
        });
      }
    } catch (error) {
      console.error('Error submitting diagnosis feedback:', error);
      toast({
        title: "Error submitting feedback",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = () => {
    switch (feedbackStatus) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'modified':
        return <Edit className="h-5 w-5 text-amber-500" />;
      default:
        return <HelpCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.85) return "High";
    if (confidence >= 0.7) return "Moderate";
    return "Low";
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.85) return "text-green-600";
    if (confidence >= 0.7) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <Card className="mb-4 border-l-4" style={{ 
      borderLeftColor: feedbackStatus === 'approved' ? '#10b981' : 
                        feedbackStatus === 'rejected' ? '#ef4444' : 
                        feedbackStatus === 'modified' ? '#f59e0b' : '#94a3b8' 
    }}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {getStatusIcon()}
              {feedbackStatus === 'modified' ? modifiedDiagnosis : diagnosis.condition}
            </CardTitle>
            <CardDescription>
              {new Date(diagnosis.createdAt).toLocaleDateString()} · AI Confidence: 
              <span className={`ml-1 font-medium ${getConfidenceColor(diagnosis.confidence)}`}>
                {getConfidenceLabel(diagnosis.confidence)} ({Math.round(diagnosis.confidence * 100)}%)
              </span>
            </CardDescription>
          </div>
          <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            Source: {diagnosis.aiSource || 'General AI'}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isEditing && feedbackStatus === 'modified' ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="modified-diagnosis">Modified Diagnosis</Label>
              <Textarea 
                id="modified-diagnosis"
                value={modifiedDiagnosis} 
                onChange={(e) => setModifiedDiagnosis(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="modified-explanation">Modified Explanation</Label>
              <Textarea 
                id="modified-explanation"
                value={modifiedExplanation} 
                onChange={(e) => setModifiedExplanation(e.target.value)}
                className="mt-1 min-h-[100px]"
              />
            </div>
          </div>
        ) : (
          <div className="text-sm">
            <div className="bg-muted/50 p-3 rounded-md">
              {feedbackStatus === 'modified' ? modifiedExplanation : diagnosis.explanation}
            </div>
            
            {diagnosis.suggestedTreatments && diagnosis.suggestedTreatments.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Suggested Treatments:</h4>
                <ul className="list-disc list-inside">
                  {diagnosis.suggestedTreatments.map((treatment, idx) => (
                    <li key={idx} className="text-sm">{treatment}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 border-t pt-4">
          <h4 className="font-medium mb-2">Provider Feedback</h4>
          
          <RadioGroup 
            value={feedbackStatus} 
            onValueChange={(value) => {
              setFeedbackStatus(value as 'pending' | 'approved' | 'rejected' | 'modified');
              if (value === 'modified') setIsEditing(true);
            }}
            className="flex flex-col space-y-1 mb-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="approved" id="approved" />
              <Label htmlFor="approved" className="flex items-center">
                <ThumbsUp className="h-4 w-4 mr-2 text-green-500" />
                Correct diagnosis
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="modified" id="modified" />
              <Label htmlFor="modified" className="flex items-center">
                <Edit className="h-4 w-4 mr-2 text-amber-500" />
                Partially correct (needs modification)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="rejected" id="rejected" />
              <Label htmlFor="rejected" className="flex items-center">
                <ThumbsDown className="h-4 w-4 mr-2 text-destructive" />
                Incorrect diagnosis
              </Label>
            </div>
          </RadioGroup>

          <div className="space-y-4">
            {feedbackStatus === 'modified' && !isEditing && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1"
              >
                <Edit className="h-4 w-4" /> Edit Modified Diagnosis
              </Button>
            )}

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="accuracyRating">AI Accuracy Rating</Label>
                <span className="text-sm text-muted-foreground">{Math.round(accuracyRating)}%</span>
              </div>
              <Slider
                id="accuracyRating"
                value={[accuracyRating]}
                onValueChange={(values) => setAccuracyRating(values[0])}
                max={100}
                step={5}
              />
            </div>

            <div>
              <Label htmlFor="provider-note">Additional Notes (optional)</Label>
              <Textarea 
                id="provider-note"
                placeholder="Add any additional context or corrections..."
                value={providerNote}
                onChange={(e) => setProviderNote(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t pt-4 flex justify-between">
        <div className="text-xs text-muted-foreground">
          Your feedback helps improve our AI system for all patients
        </div>
        <div className="flex gap-2">
          {feedbackStatus !== 'pending' && (
            <Button variant="outline" size="sm" onClick={() => {
              setFeedbackStatus('pending');
              setIsEditing(false);
              setModifiedDiagnosis(diagnosis.condition);
              setModifiedExplanation(diagnosis.explanation);
              setProviderNote('');
              setAccuracyRating(diagnosis.confidence * 100);
            }}>
              <RefreshCw className="h-4 w-4 mr-1" /> Reset
            </Button>
          )}
          <Button 
            onClick={handleFeedbackSubmit} 
            disabled={isSubmitting || feedbackStatus === 'pending'}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default DiagnosisFeedbackUI;