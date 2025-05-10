import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { InteractiveDentalChart3D } from '../../components/dental/InteractiveDentalChart3D';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Separator } from '../../components/ui/separator';
import { useToast } from '../../hooks/use-toast';
import { Badge } from '../../components/ui/badge';
import { FileImage, Brain, Info, Clock, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { DiagnosticPanel } from '../../components/diagnosis/DiagnosticPanel';
import { useAIDiagnosis } from '../../hooks/useAIDiagnosis';

interface PatientInfo {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  patientSince: string;
  lastVisit?: string;
}

export default function PatientDentalChart() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);
  const [selectedToothNumber, setSelectedToothNumber] = useState<string | null>(null);
  const [loadingPatient, setLoadingPatient] = useState(true);
  const [tabView, setTabView] = useState<'chart' | 'summary' | 'images'>('chart');
  
  const { aiDiagnosis, diagnosisLoading, getAIDiagnosis, runNewDiagnosis } = useAIDiagnosis();
  
  // Fetch patient info
  useEffect(() => {
    const fetchPatientInfo = async () => {
      try {
        setLoadingPatient(true);
        
        if (!patientId) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Patient ID not provided',
          });
          navigate('/patients');
          return;
        }
        
        const response = await axios.get(`/api/patients/${patientId}`);
        
        if (response.status === 200) {
          setPatientInfo(response.data);
        } else {
          throw new Error('Failed to fetch patient info');
        }
      } catch (err: any) {
        console.error('Error fetching patient:', err);
        
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load patient information',
        });
        
        // For development, create mock patient data
        if (process.env.NODE_ENV === 'development') {
          setPatientInfo({
            id: patientId || 'mock-id',
            firstName: 'John',
            lastName: 'Doe',
            dateOfBirth: '1985-06-15',
            gender: 'Male',
            patientSince: '2020-03-10',
            lastVisit: '2023-11-22'
          });
        }
      } finally {
        setLoadingPatient(false);
      }
    };
    
    fetchPatientInfo();
  }, [patientId, navigate, toast]);
  
  const handleSelectTooth = (toothNumber: string) => {
    setSelectedToothNumber(toothNumber);
  };
  
  const handleRunAIAnalysis = async () => {
    if (!patientId) return;
    
    try {
      await runNewDiagnosis(patientId);
      
      toast({
        title: 'AI Analysis Complete',
        description: 'The dental chart has been analyzed with AI.',
      });
    } catch (error) {
      console.error('AI analysis error:', error);
      
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: 'Could not complete AI analysis. Please try again.',
      });
    }
  };
  
  const getTotalFindings = () => {
    if (!aiDiagnosis?.findings) return 0;
    return aiDiagnosis.findings.length;
  };
  
  const getHighPriorityCount = () => {
    if (!aiDiagnosis?.findings) return 0;
    return aiDiagnosis.findings.filter(f => f.severity === 'high' || f.severity === 'critical').length;
  };
  
  const getPatientAge = () => {
    if (!patientInfo?.dateOfBirth) return 'Unknown';
    
    const birthDate = new Date(patientInfo.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          className="mr-4"
          onClick={() => navigate(`/patients/${patientId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Patient
        </Button>
        
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            Dental Chart
            {patientInfo && (
              <span className="ml-2 text-muted-foreground">
                - {patientInfo.firstName} {patientInfo.lastName}
              </span>
            )}
          </h1>
          
          {patientInfo && (
            <div className="flex space-x-4 mt-1 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Info className="mr-1 h-3 w-3" />
                {getPatientAge()} y/o {patientInfo.gender}
              </div>
              <div className="flex items-center">
                <Clock className="mr-1 h-3 w-3" />
                Patient since {formatDate(patientInfo.patientSince)}
              </div>
            </div>
          )}
        </div>
        
        <div className="ml-auto flex gap-2">
          <Button size="sm" onClick={handleRunAIAnalysis} disabled={diagnosisLoading}>
            <Brain className="mr-2 h-4 w-4" />
            Run AI Analysis
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Tabs defaultValue="chart" onValueChange={(value) => setTabView(value as any)}>
            <TabsList className="mb-4">
              <TabsTrigger value="chart">3D Dental Chart</TabsTrigger>
              <TabsTrigger value="summary">AI Summary</TabsTrigger>
              <TabsTrigger value="images">X-rays & Images</TabsTrigger>
            </TabsList>
            
            <TabsContent value="chart">
              {patientId && (
                <InteractiveDentalChart3D 
                  patientId={patientId}
                  onToothSelect={handleSelectTooth}
                />
              )}
            </TabsContent>
            
            <TabsContent value="summary">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="mr-2 h-5 w-5 text-primary" />
                    AI Diagnostic Summary
                  </CardTitle>
                  <CardDescription>
                    Comprehensive analysis of dental conditions based on chart data and imaging
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {diagnosisLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-4 text-muted-foreground">Analyzing patient data...</p>
                    </div>
                  ) : aiDiagnosis ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Badge className="mr-2" variant={getHighPriorityCount() > 0 ? "destructive" : "outline"}>
                            {getTotalFindings()} Findings
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Last updated: {new Date(aiDiagnosis.timestamp).toLocaleString()}
                          </span>
                        </div>
                        
                        {aiDiagnosis.overallScore !== undefined && (
                          <div className="bg-muted rounded-full h-10 w-10 flex items-center justify-center">
                            <span className={`text-sm font-medium ${
                              aiDiagnosis.overallScore > 80 ? 'text-green-600' :
                              aiDiagnosis.overallScore > 60 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {aiDiagnosis.overallScore}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="bg-muted p-4 rounded-md">
                        <p>{aiDiagnosis.summary || 'No summary available.'}</p>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-3">
                        <h3 className="font-medium">Key Findings</h3>
                        
                        {aiDiagnosis.findings.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {aiDiagnosis.findings
                              .sort((a, b) => {
                                const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                                return severityOrder[a.severity as keyof typeof severityOrder] - 
                                       severityOrder[b.severity as keyof typeof severityOrder];
                              })
                              .slice(0, 4)
                              .map((finding, idx) => (
                                <div key={idx} className="border rounded-md p-3 flex items-start">
                                  {finding.severity === 'high' || finding.severity === 'critical' ? (
                                    <AlertCircle className="h-5 w-5 mr-2 text-red-500 flex-shrink-0" />
                                  ) : (
                                    <Info className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0" />
                                  )}
                                  <div>
                                    <div className="font-medium">Tooth #{finding.tooth}: {finding.type}</div>
                                    <div className="text-sm text-muted-foreground">{finding.description}</div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">
                            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                            <p>No findings detected</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No AI analysis available. Click "Run AI Analysis" to generate a diagnostic summary.</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full"
                    onClick={handleRunAIAnalysis}
                    disabled={diagnosisLoading}
                  >
                    <Brain className="mr-2 h-4 w-4" />
                    {diagnosisLoading ? 'Analyzing...' : aiDiagnosis ? 'Refresh Analysis' : 'Run AI Analysis'}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="images">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileImage className="mr-2 h-5 w-5 text-primary" />
                    X-rays & Dental Images
                  </CardTitle>
                  <CardDescription>
                    View and analyze patient's radiographs and clinical images
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <p>X-ray viewer will be available in the next update.</p>
                    <Button className="mt-4" variant="outline" disabled>
                      <FileImage className="mr-2 h-4 w-4" />
                      Upload New X-ray
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Tooth Details</CardTitle>
              <CardDescription>
                {selectedToothNumber 
                  ? `Information for Tooth #${selectedToothNumber}`
                  : 'Select a tooth to view details'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedToothNumber ? (
                <>
                  <DiagnosticPanel
                    toothNumber={selectedToothNumber}
                    findings={aiDiagnosis?.findings.filter(f => f.tooth === selectedToothNumber) || []}
                    loading={diagnosisLoading}
                    onApprove={() => {}}
                    onReject={() => {}}
                  />
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Click on any tooth in the dental chart to view AI diagnoses, status, and treatment options.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 