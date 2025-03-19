import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { 
  Loader2, 
  AlertTriangle, 
  Clock, 
  Shield, 
  Stethoscope, 
  MessagesSquare, 
  ArrowRight,
  SendHorizonal 
} from "lucide-react";
import {
  predictDentalCondition,
  type SymptomPrediction,
  type PredictionContext
} from "@/lib/ai-predictor";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { apiRequest } from "@/lib/queryClient";

interface Props {
  patientHistory?: string;
  vitalSigns?: PredictionContext["vitalSigns"];
  relevantTests?: PredictionContext["relevantTests"];
  dentalRecords?: PredictionContext["dentalRecords"];
  onDiagnosisGenerated?: (diagnosis: string) => void;
}

export function InteractiveDiagnosis({ patientHistory, vitalSigns, relevantTests, dentalRecords }: Props) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [symptoms, setSymptoms] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{
    role: "user" | "assistant";
    content: string;
  }>>([]);
  const [userResponse, setUserResponse] = useState("");
  const [diagnosisResult, setDiagnosisResult] = useState<SymptomPrediction | null>(null);

  // Initial diagnosis mutation
  const diagnosisMutation = useMutation({
    mutationFn: async (symptoms: string) => {
      setIsAnalyzing(true);
      try {
        const result = await predictDentalCondition({
          symptoms,
          patientHistory,
          vitalSigns,
          relevantTests,
          dentalRecords
        });
        return result;
      } catch (error) {
        console.error("Prediction error:", error);
        throw error;
      } finally {
        setIsAnalyzing(false);
      }
    },
    onSuccess: (data) => {
      setDiagnosisResult(data);
      
      // Add initial conversation history
      setConversationHistory([
        { role: "user", content: symptoms },
        { role: "assistant", content: "I've analyzed your symptoms. Let me ask some follow-up questions to provide a more accurate diagnosis." }
      ]);
      
      // Set the first follow-up question if available
      if (data.followUpQuestions && data.followUpQuestions.length > 0) {
        setCurrentQuestion(data.followUpQuestions[0]);
      }
    },
    onError: (error: Error) => {
      toast({
        title: t("ai.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle follow-up question response
  const followupMutation = useMutation({
    mutationFn: async (response: { 
      question: string; 
      answer: string; 
      previousDiagnosis: SymptomPrediction;
      conversationHistory: typeof conversationHistory;
    }) => {
      setIsAnalyzing(true);
      try {
        return await apiRequest({
          method: "POST",
          url: "/api/ai/refine-diagnosis",
          body: {
            initialSymptoms: symptoms,
            patientResponse: response.answer,
            question: response.question,
            previousDiagnosis: response.previousDiagnosis,
            conversationHistory: response.conversationHistory,
            patientContext: {
              patientHistory,
              vitalSigns,
              relevantTests,
              dentalRecords
            }
          }
        });
      } catch (error) {
        console.error("Refining diagnosis error:", error);
        throw error;
      } finally {
        setIsAnalyzing(false);
      }
    },
    onSuccess: (data) => {
      // Update diagnosis result with refined information
      setDiagnosisResult(data.refinedDiagnosis);
      
      // Add the Q&A to conversation history
      setConversationHistory(prev => [
        ...prev,
        { role: "assistant", content: currentQuestion || "" },
        { role: "user", content: userResponse }
      ]);
      
      // Clear current user response
      setUserResponse("");
      
      // Set the next question if available
      if (data.nextQuestion) {
        setCurrentQuestion(data.nextQuestion);
      } else {
        // No more questions needed
        setCurrentQuestion(null);
        setConversationHistory(prev => [
          ...prev,
          { role: "assistant", content: "Based on your responses, I've finalized my diagnosis. Please see the detailed assessment below." }
        ]);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to process your response. " + error.message,
        variant: "destructive",
      });
    }
  });

  // Handle user response submission
  const handleResponseSubmit = () => {
    if (!userResponse || !currentQuestion || !diagnosisResult) return;
    
    followupMutation.mutate({
      question: currentQuestion,
      answer: userResponse,
      previousDiagnosis: diagnosisResult,
      conversationHistory
    });
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case "emergency":
        return "text-red-500 font-bold";
      case "high":
        return "text-orange-500 font-bold";
      case "medium":
        return "text-yellow-500";
      default:
        return "text-green-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Initial symptom entry card */}
      {!diagnosisResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              Interactive Dental Diagnosis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                Describe your symptoms in detail, including:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Type and location of pain (sharp, dull, lingering)</li>
                  <li>Duration and triggers of symptoms</li>
                  <li>Any visible changes or swelling</li>
                  <li>Recent dental work or injuries</li>
                  <li>Affected tooth numbers if known</li>
                </ul>
              </p>
            </div>
            <Textarea
              placeholder="Example: Sharp pain on upper right molar (#3) when biting, started 2 days ago. Cold sensitivity lasting 30 seconds. No visible swelling."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              className="min-h-[100px] mb-4"
            />
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
              <div className="flex gap-2 items-center">
                <MessagesSquare className="h-4 w-4" />
                <span>Interactive diagnosis with follow-up questions</span>
              </div>
              <div className="flex gap-2 items-center">
                <Shield className="h-4 w-4 text-primary" />
                <span>AI-Powered Dental Analysis</span>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={() => diagnosisMutation.mutate(symptoms)}
              disabled={isAnalyzing || !symptoms.trim()}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Symptoms...
                </>
              ) : (
                "Start Interactive Diagnosis"
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Conversation interface */}
      {diagnosisResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessagesSquare className="h-5 w-5 text-primary" />
              AI Diagnostic Conversation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 max-h-[400px] overflow-y-auto rounded-lg border p-4 bg-gray-50">
              {conversationHistory.map((message, idx) => (
                <div 
                  key={idx} 
                  className={`mb-3 ${
                    message.role === "assistant" 
                      ? "bg-blue-50 p-3 rounded-lg border border-blue-100" 
                      : "bg-gray-100 p-3 rounded-lg border border-gray-200 ml-4"
                  }`}
                >
                  <div className="text-xs text-gray-500 mb-1">
                    {message.role === "assistant" ? "AI Dentist" : "You"}
                  </div>
                  <div>{message.content}</div>
                </div>
              ))}
            </div>

            {currentQuestion && (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <div className="text-xs text-blue-500 mb-1">Follow-up Question:</div>
                  <div className="font-medium">{currentQuestion}</div>
                </div>
                
                <Textarea
                  placeholder="Type your response here..."
                  value={userResponse}
                  onChange={(e) => setUserResponse(e.target.value)}
                  className="min-h-[80px]"
                />
                
                <Button 
                  className="w-full"
                  onClick={handleResponseSubmit}
                  disabled={followupMutation.isPending || !userResponse.trim()}
                >
                  {followupMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <SendHorizonal className="mr-2 h-4 w-4" />
                      Submit Response
                    </>
                  )}
                </Button>
              </div>
            )}

            {!currentQuestion && diagnosisResult && (
              <div className="text-center py-2 bg-green-50 rounded-lg border border-green-100">
                <p className="text-green-700">Diagnosis complete! See detailed results below</p>
                <ArrowRight className="h-4 w-4 text-green-700 mx-auto mt-2" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Diagnostic Results */}
      {diagnosisResult && (
        <Card>
          <CardHeader>
            <CardTitle>Diagnostic Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {diagnosisResult.possibleConditions.some(c => 
              c.urgencyLevel === "high" || c.urgencyLevel === "emergency"
            ) && (
              <Alert variant="destructive">
                <AlertTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Urgent Care Needed
                </AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside mt-2">
                    {diagnosisResult.possibleConditions
                      .filter(c => c.urgencyLevel === "high" || c.urgencyLevel === "emergency")
                      .map((condition, idx) => (
                        <li key={idx}>{condition.condition}: {condition.recommendations[0]}</li>
                      ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            <div>
              <h3 className="font-semibold mb-2">Possible Conditions</h3>
              <div className="space-y-4">
                {diagnosisResult.possibleConditions.map((condition, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{condition.condition}</h4>
                      <Badge
                        variant={condition.urgencyLevel === "emergency" ? "destructive" : "secondary"}
                        className={getUrgencyColor(condition.urgencyLevel)}
                      >
                        {condition.urgencyLevel.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {condition.description}
                    </p>
                    <div className="mb-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{ width: `${Math.round(condition.confidence * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium mt-1 block">
                        Confidence: {Math.round(condition.confidence * 100)}%
                      </span>
                    </div>
                    {condition.specialistReferral && (
                      <div className="mb-2 p-2 bg-orange-50 rounded-md">
                        <p className="text-sm font-medium text-orange-700">
                          Specialist Referral Recommended: {condition.specialistReferral.type}
                        </p>
                        <p className="text-sm text-orange-600">
                          Reason: {condition.specialistReferral.reason}
                        </p>
                      </div>
                    )}
                    <div>
                      <h5 className="text-sm font-medium mb-1">
                        Recommendations:
                      </h5>
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {condition.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Specialized Analysis</h3>
              <Accordion type="single" collapsible className="border rounded-lg">
                {Object.entries(diagnosisResult.aiDomains).map(([domain, findings]) => (
                  findings?.findings?.length > 0 ? (
                    <AccordionItem key={domain} value={domain}>
                      <AccordionTrigger className="text-primary font-medium">
                        {domain.charAt(0).toUpperCase() + domain.slice(1)} Analysis
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 p-4">
                          <div>
                            <h4 className="font-medium mb-2">Clinical Findings:</h4>
                            <ul className="list-disc list-inside space-y-1">
                              {findings.findings.map((finding, idx) => (
                                <li key={idx} className="text-sm text-gray-600">{finding}</li>
                              ))}
                            </ul>
                          </div>
                          {findings.recommendations?.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-2">Treatment Recommendations:</h4>
                              <ul className="list-disc list-inside space-y-1">
                                {findings.recommendations.map((rec, idx) => (
                                  <li key={idx} className="text-sm text-gray-600">{rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ) : null
                ))}
              </Accordion>
            </div>

            <div>
              <h3 className="font-semibold mb-2">General Recommendations</h3>
              <p className="text-gray-600">{diagnosisResult.generalAdvice}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {diagnosisMutation.isError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Analysis Error</AlertTitle>
          <AlertDescription>
            {diagnosisMutation.error.message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}