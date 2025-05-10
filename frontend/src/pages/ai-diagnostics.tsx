import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Brain, Upload, Clock, Lightbulb } from 'lucide-react';
import { useAIDiagnosis } from '../hooks/useAIDiagnosis';
import { AIDiagnosticsMonitor } from '../utils/aiDiagnosticsMonitor';
import { useNavigate } from 'react-router-dom';

const AIDiagnosticsPage: React.FC = () => {
  const { aiDiagnosis, diagnosisLoading, runNewDiagnosis } = useAIDiagnosis();
  const diagnosticsMonitor = AIDiagnosticsMonitor.getInstance();
  const navigate = useNavigate();
  
  const handleAnalyzeDemo = async () => {
    try {
      // Track the operation using AIDiagnosticsMonitor
      const result = await diagnosticsMonitor.trackOperation(
        'dental-xray-analyzer', // model name
        '1.0.0', // model version
        'xray-analysis', // diagnostic type
        'demo-patient-123', // patient ID
        async () => {
          // Run the diagnosis
          return await runNewDiagnosis('demo-patient-123');
        }
      );
      
      console.log('Diagnosis completed with monitoring:', result);
    } catch (error) {
      console.error('Error during diagnosis:', error);
    }
  };
  
  const handleGenerateTreatmentSuggestions = () => {
    if (aiDiagnosis && aiDiagnosis.id) {
      // Navigate to treatment suggestions page with diagnosis ID
      navigate(`/patients/demo-patient-123/diagnoses/${aiDiagnosis.id}/ai-treatment-suggestions`);
    }
  };
  
  // Initialize token when component mounts
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      diagnosticsMonitor.setToken(token);
    }
  }, []);
  
  return (
    <div className="container py-6 max-w-7xl">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Diagnostics</h1>
          <p className="text-muted-foreground mt-2">
            Analyze dental imaging with AI-powered diagnostics
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="mr-2 h-5 w-5" />
                Analyze Demo X-Ray
              </CardTitle>
              <CardDescription>
                Run AI analysis on a demo patient X-ray
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleAnalyzeDemo}
                disabled={diagnosisLoading}
                className="w-full"
              >
                {diagnosisLoading ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Analyze Demo X-Ray
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="mr-2 h-5 w-5" />
                Upload New X-Ray
              </CardTitle>
              <CardDescription>
                Upload a new X-ray for AI analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline"
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload X-Ray
              </Button>
            </CardContent>
          </Card>
          
          {aiDiagnosis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="mr-2 h-5 w-5" />
                  Treatment Suggestions
                </CardTitle>
                <CardDescription>
                  Generate AI treatment suggestions based on findings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleGenerateTreatmentSuggestions}
                  className="w-full"
                  variant="secondary"
                >
                  <Lightbulb className="mr-2 h-4 w-4" />
                  Generate Treatment Suggestions
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
        
        {aiDiagnosis && (
          <Card>
            <CardHeader>
              <CardTitle>AI Diagnosis Results</CardTitle>
              <CardDescription>
                Analysis completed at {new Date().toLocaleTimeString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">Findings</h3>
                  <ul className="list-disc pl-6 mt-2">
                    {aiDiagnosis.findings?.map((finding, index) => (
                      <li key={index}>{finding}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Recommendations</h3>
                  <ul className="list-disc pl-6 mt-2">
                    {aiDiagnosis.recommendations?.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Confidence Score</h3>
                  <div className="mt-2">
                    {(aiDiagnosis.confidence * 100).toFixed(1)}%
                  </div>
                  
                  {/* Clinical feedback buttons */}
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Provide Clinical Feedback:</h4>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-green-500 text-green-600 hover:bg-green-50"
                        onClick={() => {
                          diagnosticsMonitor.recordClinicalFeedback(
                            'dental-xray-analyzer',
                            '1.0.0',
                            aiDiagnosis.id || 'unknown',
                            true,
                            Date.now() - (aiDiagnosis.timestamp || Date.now()),
                            'demo-patient-123'
                          );
                        }}
                      >
                        I Agree
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-red-500 text-red-600 hover:bg-red-50"
                        onClick={() => {
                          diagnosticsMonitor.recordClinicalFeedback(
                            'dental-xray-analyzer',
                            '1.0.0',
                            aiDiagnosis.id || 'unknown',
                            false,
                            Date.now() - (aiDiagnosis.timestamp || Date.now()),
                            'demo-patient-123'
                          );
                        }}
                      >
                        I Disagree
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AIDiagnosticsPage; 