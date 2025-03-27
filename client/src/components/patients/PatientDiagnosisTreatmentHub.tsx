import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import DiagnosisFeedbackUI from "@/components/diagnosis/DiagnosisFeedbackUI";
import AdvancedTreatmentPlan from "@/components/treatment/AdvancedTreatmentPlan";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/api';
import { BrainCircuit, FileText, RefreshCw, AlertCircle, Lightbulb } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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

interface TreatmentPlan {
  id: string;
  patientId: string;
  title: string;
  diagnosis: string;
  procedures: any[];
  reasoning: string;
  confidence: number;
  totalCost: number;
  status: 'draft' | 'approved' | 'rejected' | 'modified';
  aiDraft: string;
  approvedPlan?: string;
  providerNote?: string;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

interface PatientDiagnosisTreatmentHubProps {
  patientId: number;
  patientName?: string;
}

const PatientDiagnosisTreatmentHub: React.FC<PatientDiagnosisTreatmentHubProps> = ({ 
  patientId,
  patientName
}) => {
  const [activeTab, setActiveTab] = useState('diagnoses');
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [isLoadingDiagnoses, setIsLoadingDiagnoses] = useState(true);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDiagnoses();
    fetchTreatmentPlans();
  }, [patientId]);

  const fetchDiagnoses = async () => {
    setIsLoadingDiagnoses(true);
    try {
      const response = await apiRequest(`/api/diagnoses/${patientId}`, {
        method: 'GET'
      });
      
      if (response && Array.isArray(response)) {
        setDiagnoses(response);
      } else {
        setDiagnoses([]);
      }
    } catch (error) {
      console.error('Error fetching diagnoses:', error);
      toast({
        title: "Failed to load diagnoses",
        description: "There was an error loading the diagnoses. Please try again.",
        variant: "destructive"
      });
      setDiagnoses([]);
    } finally {
      setIsLoadingDiagnoses(false);
    }
  };

  const fetchTreatmentPlans = async () => {
    setIsLoadingPlans(true);
    try {
      const response = await apiRequest(`/api/treatment-plans/${patientId}`, {
        method: 'GET'
      });
      
      if (response && Array.isArray(response)) {
        setTreatmentPlans(response);
      } else {
        setTreatmentPlans([]);
      }
    } catch (error) {
      console.error('Error fetching treatment plans:', error);
      toast({
        title: "Failed to load treatment plans",
        description: "There was an error loading the treatment plans. Please try again.",
        variant: "destructive"
      });
      setTreatmentPlans([]);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const handleGenerateDiagnosis = async () => {
    try {
      toast({
        title: "Generating AI diagnosis",
        description: "Please wait while we analyze the patient data...",
      });
      
      const diagnosis = await apiRequest('/api/diagnoses/generate', {
        method: 'POST',
        data: {
          patientId,
          includeNotes: true,
          includeXrays: true,
          includeCharts: true
        }
      });
      
      if (diagnosis) {
        setDiagnoses(prev => [diagnosis, ...prev]);
        toast({
          title: "AI diagnosis generated",
          description: "A new diagnosis has been created based on patient data.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error generating diagnosis:', error);
      toast({
        title: "Failed to generate diagnosis",
        description: "There was an error generating the AI diagnosis. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleFeedbackSubmitted = (updatedDiagnosis: Diagnosis) => {
    setDiagnoses(prev => 
      prev.map(d => d.id === updatedDiagnosis.id ? updatedDiagnosis : d)
    );
  };

  const renderDiagnosesTab = () => {
    if (isLoadingDiagnoses) {
      return (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <Card key={i}>
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
          ))}
        </div>
      );
    }

    if (diagnoses.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lightbulb className="mr-2 h-5 w-5" />
              No AI Diagnoses Yet
            </CardTitle>
            <CardDescription>
              Generate an AI diagnosis based on this patient's clinical data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              The AI will analyze the patient's notes, X-rays, and chart data to provide diagnostic suggestions.
              These suggestions are for reference only and require professional review.
            </p>
            <Button onClick={handleGenerateDiagnosis}>
              <BrainCircuit className="mr-2 h-4 w-4" />
              Generate AI Diagnosis
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">AI Diagnostic Suggestions</h3>
          <Button size="sm" onClick={handleGenerateDiagnosis}>
            <BrainCircuit className="mr-2 h-4 w-4" /> Generate New Diagnosis
          </Button>
        </div>
        
        <div className="space-y-6">
          {diagnoses.map(diagnosis => (
            <DiagnosisFeedbackUI 
              key={diagnosis.id} 
              diagnosis={diagnosis} 
              patientId={patientId}
              onFeedbackSubmitted={handleFeedbackSubmitted}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderTreatmentPlansTab = () => {
    if (isLoadingPlans) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      );
    }

    if (treatmentPlans.length === 0) {
      return (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">AI Treatment Planning</h3>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                No Treatment Plans Yet
              </CardTitle>
              <CardDescription>
                Create a new AI-powered treatment plan for this patient
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                A new AI treatment plan will be generated based on approved diagnoses, patient X-rays, and chart data.
              </p>
            </CardContent>
          </Card>
          
          <AdvancedTreatmentPlan 
            patientId={patientId.toString()} 
            onSave={(plan) => {
              setTreatmentPlans(prev => [plan, ...prev]);
            }}
          />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Treatment Plans</h3>
          <Button 
            size="sm" 
            onClick={() => {
              setTreatmentPlans([]);
              setIsLoadingPlans(true);
              setTimeout(() => {
                fetchTreatmentPlans();
              }, 100);
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh Plans
          </Button>
        </div>
        
        {treatmentPlans.map((plan, index) => (
          <AdvancedTreatmentPlan 
            key={plan.id} 
            patientId={patientId.toString()}
            initialPlan={plan}
            readOnly={index !== 0 || plan.status === 'approved'}
            onSave={(updatedPlan) => {
              setTreatmentPlans(prev => 
                prev.map(p => p.id === updatedPlan.id ? updatedPlan : p)
              );
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <BrainCircuit className="mr-2 h-5 w-5" />
          AI Diagnosis & Treatment Hub
          {patientName && <span className="ml-2 text-muted-foreground">({patientName})</span>}
        </CardTitle>
        <CardDescription>
          Review AI-generated diagnoses and treatment plans with clinical decision support
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="diagnoses">Diagnoses</TabsTrigger>
            <TabsTrigger value="treatment-plans">Treatment Plans</TabsTrigger>
            <TabsTrigger value="ai-analytics">AI Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="diagnoses" className="space-y-4">
            {renderDiagnosesTab()}
          </TabsContent>
          
          <TabsContent value="treatment-plans" className="space-y-4">
            {renderTreatmentPlansTab()}
          </TabsContent>
          
          <TabsContent value="ai-analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="mr-2 h-5 w-5" />
                  AI Performance Analytics
                </CardTitle>
                <CardDescription>
                  Diagnostic accuracy metrics and AI learning progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  This feature will provide analytics on AI performance, accuracy improvements over time, and provider feedback integration. Coming soon!
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="border-t pt-4 text-xs text-muted-foreground">
        <div>
          AI recommendations are provided for clinical decision support only. All diagnoses and treatments must be reviewed and approved by a licensed provider.
        </div>
      </CardFooter>
    </Card>
  );
};

export default PatientDiagnosisTreatmentHub;