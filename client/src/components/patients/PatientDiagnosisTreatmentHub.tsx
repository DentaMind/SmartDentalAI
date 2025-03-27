import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import DiagnosisFeedbackUI from '@/components/diagnosis/DiagnosisFeedbackUI';
import { TreatmentPlanIntelligence } from '@/components/treatment/TreatmentPlanIntelligence';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { runDiagnosisEngine, submitDoctorFeedback } from '@/lib/diagnostic-ai-feedback';

interface PatientDiagnosisTreatmentHubProps {
  patientId: string;
  providerName: string;
  onDiagnosisCompleted?: (diagnosis: any) => void;
}

export function PatientDiagnosisTreatmentHub({
  patientId,
  providerName,
  onDiagnosisCompleted
}: PatientDiagnosisTreatmentHubProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('diagnosis');
  const [diagnosisData, setDiagnosisData] = useState<any>(null);
  const [diagnosisFeedbackSubmitted, setDiagnosisFeedbackSubmitted] = useState(false);

  // Run diagnosis when component mounts
  useEffect(() => {
    if (patientId) {
      runDiagnosis();
    }
  }, [patientId]);

  const runDiagnosis = async () => {
    setLoading(true);
    setError(null);
    setDiagnosisFeedbackSubmitted(false);

    try {
      // In a real app, this would be an API call to the diagnosis engine
      const result = await runDiagnosisEngine(patientId);
      
      setDiagnosisData(result);
      
      if (onDiagnosisCompleted) {
        onDiagnosisCompleted(result);
      }
    } catch (err) {
      console.error('Error running diagnosis:', err);
      setError('Failed to generate diagnosis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDiagnosisFeedback = async (feedback: { confirmedDiagnosis: string; feedback: string }) => {
    setLoading(true);
    
    try {
      await submitDoctorFeedback(
        patientId,
        feedback.confirmedDiagnosis,
        true, // wasCorrect - this could be dynamic based on user input
        feedback.feedback
      );
      
      setDiagnosisFeedbackSubmitted(true);
      
      // Automatically switch to treatment plan tab after feedback is submitted
      setActiveTab('treatment');
    } catch (err) {
      console.error('Error submitting diagnosis feedback:', err);
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Prepare diagnosis options for the feedback UI
  const prepareDiagnosisOptions = () => {
    if (!diagnosisData) return [];
    
    const options = [
      {
        label: diagnosisData.primaryDiagnosis,
        confidence: 95 // Primary diagnosis gets high confidence
      }
    ];
    
    // Add differential diagnoses if available
    if (diagnosisData.differentials && diagnosisData.differentials.length > 0) {
      diagnosisData.differentials.forEach((diff: any) => {
        options.push({
          label: diff.diagnosis,
          confidence: diff.confidence
        });
      });
    }
    
    return options;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>AI Diagnosis & Treatment Hub</CardTitle>
          <CardDescription>
            Review AI-generated diagnoses and treatment plans, and provide feedback to improve future recommendations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="diagnosis">Diagnosis</TabsTrigger>
              <TabsTrigger value="treatment">Treatment Plan</TabsTrigger>
            </TabsList>
            
            <TabsContent value="diagnosis">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Spinner size="lg" />
                  <span className="ml-2">Analyzing patient data...</span>
                </div>
              ) : error ? (
                <div className="p-4 bg-red-50 text-red-800 rounded-md flex items-start gap-2 mb-4">
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Error generating diagnosis</p>
                    <p className="text-sm">{error}</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="mt-2"
                      onClick={runDiagnosis}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Try Again
                    </Button>
                  </div>
                </div>
              ) : diagnosisFeedbackSubmitted ? (
                <div className="p-4 bg-green-50 text-green-800 rounded-md flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Feedback submitted successfully</p>
                    <p className="text-sm">Thank you for your feedback. This helps improve our AI systems.</p>
                    <Button 
                      onClick={() => setActiveTab('treatment')}
                      variant="outline"
                      size="sm"
                      className="mt-2"
                    >
                      View Treatment Plan
                    </Button>
                  </div>
                </div>
              ) : diagnosisData ? (
                <DiagnosisFeedbackUI 
                  diagnosisData={{
                    explanation: diagnosisData.explanation,
                    options: prepareDiagnosisOptions(),
                    needsMoreInfo: diagnosisData.requiresMoreInfo,
                    followUpQuestion: diagnosisData.requiresMoreInfo && diagnosisData.questions && diagnosisData.questions.length > 0 
                      ? diagnosisData.questions[0] 
                      : null
                  }}
                  onSubmitFeedback={handleDiagnosisFeedback}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No diagnosis data available.</p>
                  <Button onClick={runDiagnosis}>
                    Generate Diagnosis
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="treatment">
              <TreatmentPlanIntelligence
                patientId={patientId}
                providerName={providerName}
                diagnosisData={diagnosisData}
                onRefreshDiagnosisRequest={runDiagnosis}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default PatientDiagnosisTreatmentHub;