import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { AdvancedTreatmentPlan } from './AdvancedTreatmentPlan';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface TreatmentPlanIntelligenceProps {
  patientId: string;
  providerName: string;
  diagnosisData?: any;
  onRefreshDiagnosisRequest?: () => void;
}

export function TreatmentPlanIntelligence({
  patientId,
  providerName,
  diagnosisData,
  onRefreshDiagnosisRequest
}: TreatmentPlanIntelligenceProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [treatmentPlan, setTreatmentPlan] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('treatment-plan');

  // Fetch treatment plan data when component mounts or diagnosisData changes
  useEffect(() => {
    if (diagnosisData) {
      fetchTreatmentPlan();
    }
  }, [diagnosisData, patientId]);

  const fetchTreatmentPlan = async () => {
    if (!diagnosisData) {
      setError('No diagnosis data available. Please generate a diagnosis first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // In a real app, this would be an API call to generate or fetch
      // a treatment plan based on the diagnosis
      // For demo purposes, we'll simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate treatment plan data
      const planData = {
        id: `plan-${Date.now()}`,
        patientId,
        steps: [
          {
            id: 1,
            description: 'Initial comprehensive exam with full-mouth radiographs',
            aiGenerated: true,
            confidence: 95,
            justification: 'Standard of care for new patient evaluation to establish baseline.',
            history: [
              {
                timestamp: new Date().toISOString(),
                description: 'Initial comprehensive exam with full-mouth radiographs',
                provider: 'AI'
              }
            ]
          },
          {
            id: 2,
            description: 'Scaling and root planing, upper right quadrant',
            aiGenerated: true,
            confidence: 85,
            justification: 'Periodontal probing depths indicate moderate periodontitis in UR quadrant.',
            history: [
              {
                timestamp: new Date().toISOString(),
                description: 'Scaling and root planing, upper right quadrant',
                provider: 'AI'
              }
            ]
          },
          {
            id: 3,
            description: 'Composite restoration for tooth #14 (DO)',
            aiGenerated: true,
            confidence: 78,
            justification: 'X-ray findings show carious lesion on distal and occlusal of #14.',
            history: [
              {
                timestamp: new Date().toISOString(),
                description: 'Composite restoration for tooth #14 (DO)',
                provider: 'AI'
              }
            ]
          }
        ],
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setTreatmentPlan(planData);
    } catch (err) {
      console.error('Error fetching treatment plan:', err);
      setError('Failed to generate treatment plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTreatmentPlan = async (updatedPlan: any) => {
    setLoading(true);
    
    try {
      // In a real app, this would be an API call to save the treatment plan
      // For demo purposes, we'll simulate a delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update the local state
      setTreatmentPlan(updatedPlan);
      
      // Show success message or notification here
      console.log('Treatment plan saved successfully:', updatedPlan);
    } catch (err) {
      console.error('Error saving treatment plan:', err);
      setError('Failed to save treatment plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshRequest = () => {
    if (onRefreshDiagnosisRequest) {
      onRefreshDiagnosisRequest();
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="treatment-plan">Treatment Plan</TabsTrigger>
          <TabsTrigger value="diagnosis-data">Diagnosis Data</TabsTrigger>
        </TabsList>
        
        <TabsContent value="treatment-plan" className="space-y-4 mt-4">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Spinner size="lg" />
              <span className="ml-2">Generating treatment plan...</span>
            </div>
          ) : error ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="h-5 w-5" />
                  <p>{error}</p>
                </div>
                <Button 
                  className="mt-4" 
                  variant="outline" 
                  onClick={handleRefreshRequest}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Diagnosis
                </Button>
              </CardContent>
            </Card>
          ) : treatmentPlan ? (
            <AdvancedTreatmentPlan
              initialPlan={treatmentPlan}
              patientId={patientId}
              providerName={providerName}
              onSave={handleSaveTreatmentPlan}
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No treatment plan available. Please generate a diagnosis first.
                </p>
                <div className="flex justify-center mt-4">
                  <Button 
                    variant="outline" 
                    onClick={handleRefreshRequest}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate Diagnosis
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="diagnosis-data" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Diagnosis Details</CardTitle>
            </CardHeader>
            <CardContent>
              {diagnosisData ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold">Primary Diagnosis</h4>
                    <p>{diagnosisData.primaryDiagnosis}</p>
                  </div>
                  
                  {diagnosisData.differentials && diagnosisData.differentials.length > 0 && (
                    <div>
                      <h4 className="font-semibold">Differential Diagnoses</h4>
                      <ul className="list-disc pl-5">
                        {diagnosisData.differentials.map((diff: any, index: number) => (
                          <li key={index}>
                            {diff.diagnosis} - Confidence: {diff.confidence}%
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {diagnosisData.explanation && (
                    <div>
                      <h4 className="font-semibold">Explanation</h4>
                      <p className="text-sm whitespace-pre-wrap">{diagnosisData.explanation}</p>
                    </div>
                  )}
                  
                  {diagnosisData.requiresMoreInfo && diagnosisData.questions && (
                    <div className="bg-amber-50 p-3 rounded border border-amber-200">
                      <h4 className="font-semibold text-amber-800">More Information Needed</h4>
                      <ul className="list-disc pl-5 text-sm text-amber-800">
                        {diagnosisData.questions.map((question: string, index: number) => (
                          <li key={index}>{question}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No diagnosis data available.</p>
                  <Button 
                    className="mt-4" 
                    variant="outline" 
                    onClick={handleRefreshRequest}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate Diagnosis
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default TreatmentPlanIntelligence;