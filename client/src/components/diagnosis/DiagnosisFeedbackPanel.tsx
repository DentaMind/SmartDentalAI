import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Brain, Check, MessageSquare, Mic, MicOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface DiagnosisFeedbackPanelProps {
  patientId: string;
  onDiagnosisComplete?: () => void;
}

export default function DiagnosisFeedbackPanel({ patientId, onDiagnosisComplete }: DiagnosisFeedbackPanelProps) {
  const [diagnosis, setDiagnosis] = useState<string>("");
  const [explanation, setExplanation] = useState<string>("");
  const [confidence, setConfidence] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [providerFeedback, setProviderFeedback] = useState<string>("");
  const [providerDiagnosis, setProviderDiagnosis] = useState<string>("");
  const [isOverriding, setIsOverriding] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [voiceRecognitionActive, setVoiceRecognitionActive] = useState<boolean>(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // For voice recognition
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    // Initialize Web Speech API if available
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const newRecognition = new SpeechRecognition();
      newRecognition.continuous = true;
      newRecognition.interimResults = true;
      
      newRecognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = providerFeedback;
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        setProviderFeedback(finalTranscript);
      };
      
      newRecognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setVoiceRecognitionActive(false);
      };
      
      setRecognition(newRecognition);
    }
  }, []);

  useEffect(() => {
    const fetchDiagnosis = async () => {
      try {
        setLoading(true);
        setLoadingError(null);
        
        const response = await axios.get(`/api/diagnosis/${patientId}`);
        const data = response.data;
        
        if (data && data.diagnosis) {
          setDiagnosis(data.diagnosis);
          setExplanation(data.explanation || "");
          setConfidence(data.confidence || 0);
          // Initialize provider diagnosis with AI's suggestion
          setProviderDiagnosis(data.diagnosis);
        } else {
          setLoadingError("No diagnosis data available. The AI needs more patient information to generate a diagnosis.");
        }
      } catch (error) {
        console.error("Error fetching diagnosis:", error);
        setLoadingError("Failed to fetch AI diagnosis. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchDiagnosis();
    }
  }, [patientId]);

  const toggleVoiceRecognition = () => {
    if (!recognition) {
      toast({
        variant: "destructive",
        title: "Speech Recognition Not Available",
        description: "Your browser doesn't support speech recognition. Please try using a different browser."
      });
      return;
    }
    
    if (voiceRecognitionActive) {
      recognition.stop();
      setVoiceRecognitionActive(false);
    } else {
      recognition.start();
      setVoiceRecognitionActive(true);
    }
  };

  const submitDiagnosisFeedback = async () => {
    try {
      setSubmitting(true);
      
      const payload = {
        patientId: parseInt(patientId),
        condition: isOverriding ? providerDiagnosis : diagnosis,
        explanation: explanation,
        feedback: providerFeedback,
        status: "approved",
        confidence: confidence,
        isModified: isOverriding,
        modifiedExplanation: isOverriding ? providerFeedback : null
      };
      
      const response = await axios.post('/api/diagnosis/approve', payload);
      
      if (response.data.success) {
        toast({
          title: "Diagnosis Saved",
          description: "The diagnosis has been saved with your feedback.",
          variant: "default"
        });
        
        // Invalidate relevant queries to refresh data
        queryClient.invalidateQueries({
          queryKey: [`/api/diagnosis/history/${patientId}`]
        });
        
        // Notify parent component if needed
        if (onDiagnosisComplete) {
          onDiagnosisComplete();
        }
      } else {
        throw new Error(response.data.error || "Unknown error");
      }
    } catch (error) {
      console.error("Error submitting diagnosis feedback:", error);
      toast({
        variant: "destructive",
        title: "Submission Error",
        description: "Failed to save diagnosis feedback. Please try again."
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-green-600";
    if (confidence >= 75) return "text-emerald-600";
    if (confidence >= 60) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">AI Diagnosis Feedback</h2>
          <p className="text-muted-foreground">Review and provide feedback on the AI-generated diagnosis</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="flex items-center justify-center mb-4">
            <LoadingSpinner className="h-8 w-8 text-primary mr-3" />
            <span className="text-lg font-medium">Loading diagnosis...</span>
          </div>
          <p className="text-muted-foreground">Analyzing patient data and diagnostic criteria</p>
        </div>
      ) : loadingError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{loadingError}</AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  AI-Generated Diagnosis
                </CardTitle>
                <Badge 
                  className={getConfidenceColor(confidence)}
                  variant="outline"
                >
                  {confidence}% Confidence
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{diagnosis}</h3>
                  <p className="mt-2 text-muted-foreground whitespace-pre-line">{explanation}</p>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Switch 
                      id="override-diagnosis" 
                      checked={isOverriding}
                      onCheckedChange={setIsOverriding}
                    />
                    <Label htmlFor="override-diagnosis">Override AI diagnosis</Label>
                  </div>
                  
                  {isOverriding && (
                    <div className="mt-2">
                      <Textarea
                        placeholder="Enter your diagnosis..."
                        value={providerDiagnosis}
                        onChange={(e) => setProviderDiagnosis(e.target.value)}
                        className="min-h-[80px]"
                      />
                    </div>
                  )}
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="provider-feedback">Provider Feedback</Label>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={toggleVoiceRecognition}
                      className={voiceRecognitionActive ? "bg-red-50" : ""}
                    >
                      {voiceRecognitionActive ? (
                        <><MicOff className="h-4 w-4 mr-2 text-red-500" /> Stop Dictation</>
                      ) : (
                        <><Mic className="h-4 w-4 mr-2" /> Start Dictation</>
                      )}
                    </Button>
                  </div>
                  
                  <Textarea
                    id="provider-feedback"
                    placeholder="Add your feedback, corrections, or additional notes..."
                    value={providerFeedback}
                    onChange={(e) => setProviderFeedback(e.target.value)}
                    className="min-h-[120px]"
                  />
                  
                  {voiceRecognitionActive && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Speaking... Click "Stop Dictation" when finished.
                    </p>
                  )}
                </div>
                
                <div className="flex justify-end space-x-2 pt-2">
                  <Button
                    variant="default"
                    onClick={submitDiagnosisFeedback}
                    disabled={submitting}
                    className="gap-2"
                  >
                    {submitting ? (
                      <><LoadingSpinner className="h-4 w-4 mr-2" /> Saving...</>
                    ) : (
                      <><Check className="h-4 w-4 mr-2" /> Approve & Save</>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}