import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, UploadCloud, Image, FileText } from 'lucide-react';
import { usePatientById } from '../../hooks/use-patient';

interface OrthodonticAnalyzerProps {
  patientId?: number;
  onAnalysisComplete?: (analysisData: any) => void;
}

export function OrthodonticAnalyzer({ patientId, onAnalysisComplete }: OrthodonticAnalyzerProps) {
  const { patient, loading } = usePatientById(patientId);
  const [analysisInProgress, setAnalysisInProgress] = useState(false);
  const [activeTab, setActiveTab] = useState('images');

  const handleRunAnalysis = () => {
    setAnalysisInProgress(true);
    
    // Mock analysis generation after a delay
    setTimeout(() => {
      const mockAnalysis = {
        facialProfile: {
          analysis: "Class II skeletal pattern with mandibular retrognathism",
          recommendations: ["Consider growth modification therapy", "Evaluate for functional appliance"],
          indicators: ["Increased overjet", "Retrognathic mandible", "Convex profile"]
        },
        dentalArchAnalysis: {
          archForm: "Narrow maxillary arch with V-shaped tendency",
          crowding: "Moderate maxillary crowding (4-6mm)",
          spacing: "Minimal mandibular spacing",
          recommendations: ["Arch expansion indicated", "Interproximal reduction not required"]
        },
        cephalometricMeasurements: {
          snAngle: 82,
          anBAngle: 6,
          mandibularPlaneAngle: 28,
          frankfortMandibularAngle: 26,
          interpretation: "Class II skeletal relationship with normal vertical proportions"
        },
        treatmentOptions: [
          {
            option: "Non-extraction with functional appliance",
            duration: "24-30 months",
            pros: ["Addresses skeletal discrepancy", "Improves profile", "Maintains arch width"],
            cons: ["Requires excellent compliance", "Longer treatment duration", "Two-phase treatment needed"],
            estimatedCost: 6800
          },
          {
            option: "Clear aligner therapy with elastics",
            duration: "18-24 months",
            pros: ["Aesthetic treatment option", "Good compliance predictor", "Fewer appointments needed"],
            cons: ["Limited skeletal correction", "May require attachments", "Cost consideration"],
            estimatedCost: 5500
          },
          {
            option: "Fixed appliances with Class II mechanics",
            duration: "22-28 months",
            pros: ["Predictable tooth movement", "Good control of root positioning", "Versatile mechanics"],
            cons: ["Aesthetic concerns", "Oral hygiene challenges", "Increased emergency visits"],
            estimatedCost: 5200
          }
        ],
        growthPrediction: {
          potentialGrowth: "Moderate mandibular growth potential based on CVM stage 3",
          recommendations: ["Capitalize on remaining growth with functional appliance", "Monitor cervical vertebral maturation"],
          timeframe: "12-18 months of active growth remaining"
        }
      };
      
      setAnalysisInProgress(false);
      if (onAnalysisComplete) {
        onAnalysisComplete(mockAnalysis);
      }
    }, 3000);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Orthodontic AI Analysis
        </CardTitle>
        <CardDescription>
          Upload and analyze orthodontic records to generate AI-powered treatment recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!patient && patientId ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading patient information...</p>
          </div>
        ) : !patientId ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Please select a patient to begin analysis</p>
          </div>
        ) : (
          <>
            <div className="p-4 bg-muted rounded-md">
              <h3 className="font-medium text-sm">Patient Information</h3>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="text-sm">{patient?.firstName} {patient?.lastName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date of Birth</p>
                  <p className="text-sm">{patient?.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="images">
                  <Image className="h-4 w-4 mr-2" />
                  Images
                </TabsTrigger>
                <TabsTrigger value="scans">
                  <FileText className="h-4 w-4 mr-2" />
                  Scans & Records
                </TabsTrigger>
                <TabsTrigger value="analysis">
                  <Brain className="h-4 w-4 mr-2" />
                  Analysis
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="images" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Facial Photographs</p>
                    <div className="border-2 border-dashed rounded-md h-40 flex items-center justify-center">
                      <div className="text-center">
                        <UploadCloud className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                        <p className="text-sm text-muted-foreground mt-2">Drag & drop or click to upload</p>
                        <Input type="file" className="hidden" />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-2">Intraoral Photographs</p>
                    <div className="border-2 border-dashed rounded-md h-40 flex items-center justify-center">
                      <div className="text-center">
                        <UploadCloud className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                        <p className="text-sm text-muted-foreground mt-2">Drag & drop or click to upload</p>
                        <Input type="file" className="hidden" />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="scans" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Cephalometric Radiograph</p>
                    <div className="border-2 border-dashed rounded-md h-40 flex items-center justify-center">
                      <div className="text-center">
                        <UploadCloud className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                        <p className="text-sm text-muted-foreground mt-2">Drag & drop or click to upload</p>
                        <Input type="file" className="hidden" />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-2">3D Scan / Model</p>
                    <div className="border-2 border-dashed rounded-md h-40 flex items-center justify-center">
                      <div className="text-center">
                        <UploadCloud className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                        <p className="text-sm text-muted-foreground mt-2">Drag & drop or click to upload</p>
                        <Input type="file" className="hidden" />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="analysis" className="space-y-4">
                <div className="text-center">
                  <div className="mb-6">
                    <Brain className="h-16 w-16 mx-auto text-primary/20" />
                    <h3 className="text-lg font-medium mt-2">AI Analysis</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                      The AI will analyze all uploaded images and records to generate 
                      comprehensive orthodontic analysis and treatment recommendations
                    </p>
                  </div>
                  
                  <Button 
                    size="lg" 
                    onClick={handleRunAnalysis}
                    disabled={analysisInProgress}
                  >
                    {analysisInProgress ? (
                      <>Running Analysis...</>
                    ) : (
                      <>Run Comprehensive Analysis</>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
}