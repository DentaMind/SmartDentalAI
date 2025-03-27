import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { apiRequest } from '@/lib/api';
import { useToast } from "@/hooks/use-toast";
import { Check, X, AlertTriangle, Edit, BrainCircuit, FileText, RefreshCw, Stethoscope } from "lucide-react";
import { useSession } from '../../lib/useSession';

interface Diagnosis {
  id: number;
  patientId: number;
  condition: string;
  confidence: number;
  explanation: string;
  suggestedTreatments: string[];
  aiSource: string | null;
  status: "pending" | "approved" | "rejected" | "modified";
  providerNote: string | null;
  accuracyRating: number | null;
  modifiedDiagnosis: string | null;
  modifiedExplanation: string | null;
  createdAt: string;
  updatedAt: string | null;
  approvedAt: string | null;
  approvedBy: number | null;
}

interface Props {
  patientId: string | number;
}

export default function DiagnosisFeedbackUI({ patientId }: Props) {
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDiagnosisId, setActiveDiagnosisId] = useState<number | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState<"approved" | "rejected" | "modified">("approved");
  const [providerNote, setProviderNote] = useState("");
  const [accuracyRating, setAccuracyRating] = useState<number>(5);
  const [modifiedDiagnosis, setModifiedDiagnosis] = useState("");
  const [modifiedExplanation, setModifiedExplanation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useSession();

  useEffect(() => {
    fetchDiagnoses();
  }, [patientId]);

  const fetchDiagnoses = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/patients/${patientId}/diagnoses`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data && data.success && Array.isArray(data.diagnoses)) {
        setDiagnoses(data.diagnoses);
        
        // Set the first pending diagnosis as active if there is one
        const pendingDiagnosis = data.diagnoses.find((d: Diagnosis) => d.status === 'pending');
        if (pendingDiagnosis) {
          setActiveDiagnosisId(pendingDiagnosis.id);
        } else if (data.diagnoses.length > 0) {
          setActiveDiagnosisId(data.diagnoses[0].id);
        }
      } else {
        setDiagnoses([]);
      }
    } catch (error) {
      console.error('Error fetching diagnoses:', error);
      toast({
        title: "Failed to load diagnoses",
        description: "There was an error loading the patient diagnoses. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!activeDiagnosisId) return;
    
    setIsSubmitting(true);
    try {
      const feedbackData = {
        status: feedbackStatus,
        providerNote: providerNote || null,
        accuracyRating: accuracyRating || null,
        modifiedDiagnosis: feedbackStatus === 'modified' ? modifiedDiagnosis : null,
        modifiedExplanation: feedbackStatus === 'modified' ? modifiedExplanation : null
      };
      
      const response = await fetch(`/api/diagnoses/${activeDiagnosisId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(feedbackData)
      });
      
      const data = await response.json();
      
      if (data && data.success) {
        toast({
          title: "Feedback submitted",
          description: `The diagnosis has been ${feedbackStatus}.`,
          variant: "default"
        });
        
        // Update diagnoses list
        setDiagnoses(prev => 
          prev.map(d => d.id === activeDiagnosisId ? data.diagnosis : d)
        );
        
        // Reset form
        resetForm();
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Failed to submit feedback",
        description: "There was an error submitting your feedback. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFeedbackStatus("approved");
    setProviderNote("");
    setAccuracyRating(5);
    setModifiedDiagnosis("");
    setModifiedExplanation("");
  };

  const handleDiagnosisSelect = (diagnosisId: number) => {
    setActiveDiagnosisId(diagnosisId);
    resetForm();
    
    // If the diagnosis is approved/rejected/modified, pre-fill the form with existing data
    const diagnosis = diagnoses.find(d => d.id === diagnosisId);
    if (diagnosis && diagnosis.status !== 'pending') {
      setFeedbackStatus(diagnosis.status as "approved" | "rejected" | "modified");
      setProviderNote(diagnosis.providerNote || "");
      setAccuracyRating(diagnosis.accuracyRating || 5);
      if (diagnosis.status === 'modified') {
        setModifiedDiagnosis(diagnosis.modifiedDiagnosis || "");
        setModifiedExplanation(diagnosis.modifiedExplanation || "");
      }
    }
  };

  const activeDiagnosis = diagnoses.find(d => d.id === activeDiagnosisId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (diagnoses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5" />
            No Diagnoses Found
          </CardTitle>
          <CardDescription>
            No diagnoses have been generated for this patient yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            To generate an AI-powered diagnosis, please use the Generate button above.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Diagnosis List */}
      <div className="flex flex-wrap gap-2">
        {diagnoses.map((diagnosis) => (
          <Button
            key={diagnosis.id}
            variant={diagnosis.id === activeDiagnosisId ? "default" : "outline"}
            size="sm"
            onClick={() => handleDiagnosisSelect(diagnosis.id)}
            className="flex items-center"
          >
            {diagnosis.status === 'pending' && <AlertTriangle className="mr-1 h-3 w-3" />}
            {diagnosis.status === 'approved' && <Check className="mr-1 h-3 w-3 text-green-500" />}
            {diagnosis.status === 'rejected' && <X className="mr-1 h-3 w-3 text-red-500" />}
            {diagnosis.status === 'modified' && <Edit className="mr-1 h-3 w-3 text-amber-500" />}
            {diagnosis.condition.length > 20 
              ? `${diagnosis.condition.substring(0, 20)}...` 
              : diagnosis.condition
            }
          </Button>
        ))}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchDiagnoses}
        >
          <RefreshCw className="h-3 w-3 mr-1" /> Refresh
        </Button>
      </div>

      {/* Active Diagnosis */}
      {activeDiagnosis && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <BrainCircuit className="mr-2 h-5 w-5" />
                {activeDiagnosis.condition}
              </CardTitle>
              
              <div className="flex items-center space-x-2">
                <Badge variant={
                  activeDiagnosis.status === 'approved' 
                    ? 'default' 
                    : activeDiagnosis.status === 'rejected'
                    ? 'destructive'
                    : activeDiagnosis.status === 'modified'
                    ? 'outline'
                    : 'secondary'
                }>
                  {activeDiagnosis.status.charAt(0).toUpperCase() + activeDiagnosis.status.slice(1)}
                </Badge>
                
                <Badge variant="outline" className="flex items-center">
                  <Stethoscope className="h-3 w-3 mr-1" />
                  {activeDiagnosis.aiSource || 'AI'}
                </Badge>
                
                <Badge variant="secondary">
                  {(activeDiagnosis.confidence * 100).toFixed(0)}% Confidence
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {/* Diagnosis content */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">Explanation</h3>
                  <p className="text-muted-foreground text-sm">
                    {activeDiagnosis.explanation}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-1">Suggested Treatments</h3>
                  <ul className="list-disc pl-4 text-sm text-muted-foreground">
                    {activeDiagnosis.suggestedTreatments.map((treatment, index) => (
                      <li key={index}>{treatment}</li>
                    ))}
                  </ul>
                </div>
                
                {activeDiagnosis.status === 'modified' && (
                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-medium mb-1">Provider Modified Diagnosis</h3>
                    <p className="text-sm mb-3">{activeDiagnosis.modifiedDiagnosis}</p>
                    
                    <h3 className="font-medium mb-1">Provider Modified Explanation</h3>
                    <p className="text-sm">{activeDiagnosis.modifiedExplanation}</p>
                  </div>
                )}
                
                {activeDiagnosis.providerNote && (
                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-medium mb-1">Provider Note</h3>
                    <p className="text-sm">{activeDiagnosis.providerNote}</p>
                  </div>
                )}
              </div>
              
              {/* Provider feedback form */}
              {activeDiagnosis.status === 'pending' && user?.role === 'doctor' && (
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-medium mb-3">Provider Feedback</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label>Status</Label>
                      <RadioGroup 
                        value={feedbackStatus} 
                        onValueChange={(value: "approved" | "rejected" | "modified") => setFeedbackStatus(value)}
                        className="flex gap-4 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="approved" id="approved" />
                          <Label htmlFor="approved" className="flex items-center">
                            <Check className="h-4 w-4 mr-1 text-green-500" /> Approve
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="rejected" id="rejected" />
                          <Label htmlFor="rejected" className="flex items-center">
                            <X className="h-4 w-4 mr-1 text-red-500" /> Reject
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="modified" id="modified" />
                          <Label htmlFor="modified" className="flex items-center">
                            <Edit className="h-4 w-4 mr-1 text-amber-500" /> Modify
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    <div>
                      <Label htmlFor="providerNote">Provider Note</Label>
                      <Textarea 
                        id="providerNote"
                        value={providerNote}
                        onChange={(e) => setProviderNote(e.target.value)}
                        placeholder="Add your clinical note about this diagnosis..."
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label>Accuracy Rating (1-5)</Label>
                      <div className="flex items-center space-x-2 mt-2">
                        <Slider
                          value={[accuracyRating]}
                          min={1}
                          max={5}
                          step={1}
                          onValueChange={(value) => setAccuracyRating(value[0])}
                          className="flex-1"
                        />
                        <span className="font-medium w-8 text-center">{accuracyRating}</span>
                      </div>
                    </div>
                    
                    {feedbackStatus === 'modified' && (
                      <div className="space-y-4 pt-2 border-t">
                        <div>
                          <Label htmlFor="modifiedDiagnosis">Modified Diagnosis</Label>
                          <Textarea 
                            id="modifiedDiagnosis"
                            value={modifiedDiagnosis}
                            onChange={(e) => setModifiedDiagnosis(e.target.value)}
                            placeholder="Enter your modified diagnosis..."
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="modifiedExplanation">Modified Explanation</Label>
                          <Textarea 
                            id="modifiedExplanation"
                            value={modifiedExplanation}
                            onChange={(e) => setModifiedExplanation(e.target.value)}
                            placeholder="Enter your modified explanation..."
                            className="mt-1"
                          />
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      onClick={handleSubmitFeedback}
                      disabled={isSubmitting || (!providerNote && feedbackStatus === 'rejected') || (feedbackStatus === 'modified' && (!modifiedDiagnosis || !modifiedExplanation))}
                      className="mt-2"
                    >
                      Submit Feedback
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="border-t pt-4 text-xs text-muted-foreground">
            <div>
              Created: {new Date(activeDiagnosis.createdAt).toLocaleString()}
              {activeDiagnosis.approvedAt && ` | Approved: ${new Date(activeDiagnosis.approvedAt).toLocaleString()}`}
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}