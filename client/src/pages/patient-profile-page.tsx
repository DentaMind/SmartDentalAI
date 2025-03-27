import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Patient, User } from "@shared/schema";
import { Sidebar } from "@/components/layout/sidebar";
import XrayAnalysisViewer from "@/components/xray/XrayAnalysisViewer";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FixedEnhancedPerioChart } from "@/components/perio";
import DiagnosisFeedbackUI from "@/components/diagnosis/DiagnosisFeedbackUI";
import {
  AlertCircle,
  Calendar,
  FileText,
  PenTool,
  UserRound,
  BadgeAlert,
  Stethoscope,
  Scissors,
  LineChart,
  Heart,
  Camera,
  Brain,
  Bot,
  Activity,
  FileImage,
  AlertTriangle,
  ClipboardCheck,
  FileWarning
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { IntraoralScanner } from "@/components/imaging/intraoral-scanner";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import { PageHeader } from "@/components/layout/page-header";
import { queryClient } from "@/lib/queryClient";

// Import our dental chart components
import DentalChart from "@/components/dental/dental-chart";
import PerioChart from "@/components/perio/perio-chart";
import EnhancedDentalChart from "@/components/dental/enhanced-dental-chart";
import { ClinicalPerioChart } from "@/components/perio/clinical-perio-chart";
import { ImprovedPerioChart } from "@/components/perio/improved-perio-chart";
import { RestorativeChart } from "@/components/dental/restorative-chart";
import EnhancedPerioChart from "@/components/perio/enhanced-perio-chart";
import { PatientMedicalHistory } from "@/components/patients/patient-medical-history";
import { ASAClassificationCard, type ASAClassification } from "@/components/medical/asa-classification";
import { AutoASAClassification } from "@/components/medical/auto-asa-classification";
import { Contraindications } from "@/components/medical/contraindications";
import { DiseaseInformation } from "@/components/medical/disease-information";
import { ChatHelper } from "@/components/ui/chat-helper";
import { useAuth } from "@/hooks/use-auth";
import PostOpInstructions from "@/components/patients/post-op-instructions";

// Define the full patient type including user data
type PatientWithUser = Patient & {
  user: User;
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
}

export default function PatientProfilePage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { id } = useParams<{ id: string }>();
  const patientId = parseInt(id);
  const [asaClass, setAsaClass] = useState<ASAClassification>('II' as ASAClassification);
  const [emergencyStatus, setEmergencyStatus] = useState(false);

  // Fetch the patient's data
  const { data: patient, isLoading, error: patientError } = useQuery<PatientWithUser>({
    queryKey: [`/api/patients/${patientId}`],
    enabled: !isNaN(patientId),
    retry: 2,
    onError: (error) => {
      console.error("Error fetching patient data:", error);
      toast({
        title: "Error",
        description: "Failed to load patient data. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Get appointments for the patient
  const { data: appointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}/appointments`],
    enabled: !isNaN(patientId) && !!patient,
    retry: 1,
  });

  // Get treatment plans for the patient
  const { data: treatmentPlans, isLoading: treatmentPlansLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}/treatment-plans`],
    enabled: !isNaN(patientId) && !!patient,
    retry: 1,
    onError: (error) => {
      console.error("Error fetching treatment plans:", error);
    }
  });

  // Get medical notes for the patient
  const { data: medicalNotes, isLoading: medicalNotesLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}/medical-notes`],
    enabled: !isNaN(patientId) && !!patient,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto py-12 max-w-7xl flex flex-col items-center justify-center h-full">
            <LoadingAnimation />
            <p className="mt-4 text-muted-foreground">Loading patient profile...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto py-12 max-w-7xl flex flex-col items-center justify-center h-full">
            <AlertCircle className="h-20 w-20 text-destructive" />
            <h1 className="text-2xl font-bold mt-4">Patient Not Found</h1>
            <p className="mt-2 text-muted-foreground">
              The patient you are looking for does not exist or you don't have permission to view it.
            </p>
            <Button className="mt-6" variant="default" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto py-6 max-w-7xl">
          <div className="flex justify-between items-center">
            <PageHeader 
              title="DentaMind" 
              description="Advanced DentaMind AI"
              icon={<Stethoscope className="h-10 w-10" />}
            />
            
            {/* Patient Info Card - Compact version at the top */}
            <Card className="w-auto shadow-sm">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-xl font-bold text-primary-foreground">
                    {getInitials(`${patient.user.firstName} ${patient.user.lastName}`)}
                  </div>
                  <div>
                    <CardTitle>{`${patient.user.firstName} ${patient.user.lastName}`}</CardTitle>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>{patient.user.dateOfBirth || 'No DOB'}</span>
                      <span>•</span>
                      <span>{patient.insuranceProvider || 'No insurance'}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex gap-4 text-sm">
                  {patient.user.phoneNumber && <span>{patient.user.phoneNumber}</span>}
                  {patient.user.email && <span>{patient.user.email}</span>}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Chat Helper */}
          <ChatHelper />
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">{/* Patient detailed info will now be in a dropdown or expandable section */}

            {/* Main Content Area */}
            <div className="md:col-span-3 space-y-6">
              {/* Medical Alerts */}
              <Card className="bg-card border-destructive/20 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                    <BadgeAlert className="h-5 w-5" />
                    Medical Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* AI-Assisted ASA Classification */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Heart className="h-5 w-5 text-green-500" />
                        <h3 className="font-medium">AI-Assisted ASA Classification</h3>
                        <Badge 
                          variant="outline" 
                          className="bg-green-50 text-green-700 border-green-200 ml-auto"
                        >
                          Auto-Generated
                        </Badge>
                      </div>
                      <AutoASAClassification 
                        patientId={patientId}
                        patientName={`${patient.user.firstName} ${patient.user.lastName}`}
                        medicalHistory={{
                          systemicConditions: (() => {
                            // Auto-identify conditions from various fields
                            const conditions = [];
                            if (patient.hypertension) conditions.push('Hypertension');
                            if (patient.diabetes) conditions.push('Diabetes Mellitus');
                            if (patient.heartDisease) conditions.push('Heart Disease');
                            if (patient.asthma) conditions.push('Asthma');
                            if (patient.arthritis) conditions.push('Arthritis');
                            if (patient.cancer) conditions.push('Cancer');
                            if (patient.stroke) conditions.push('Stroke');
                            if (patient.kidneyDisease) conditions.push('Kidney Disease');
                            if (patient.liverDisease) conditions.push('Liver Disease');
                            if (patient.thyroidDisease) conditions.push('Thyroid Disease');
                            if (patient.mentalIllness) conditions.push('Mental Illness');
                            if (patient.seizures) conditions.push('Seizure Disorder');
                            if (patient.bleedingDisorders) conditions.push('Bleeding Disorder');
                            if (patient.autoimmune) conditions.push('Autoimmune Disease');
                            if (patient.hepatitis) conditions.push('Hepatitis');
                            if (patient.hivAids) conditions.push('HIV/AIDS');
                            if (patient.lungDisease) conditions.push('Lung Disease');
                            if (patient.osteoporosis) conditions.push('Osteoporosis');
                            return conditions;
                          })(),
                          medications: patient.currentMedications ? patient.currentMedications.split(',').map(med => med.trim()) : [],
                          allergies: patient.allergies ? patient.allergies.split(',').map(allergy => allergy.trim()) : [],
                          smokingHistory: patient.smokesTobacco === true,
                        }}
                      />
                    </div>
                    
                    {/* Contraindications to Treatment */}
                    <div className="mt-6 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        <h3 className="font-medium">Treatment Contraindications</h3>
                        <Badge 
                          variant="outline" 
                          className="bg-green-50 text-green-700 border-green-200 ml-auto"
                        >
                          AI-Generated
                        </Badge>
                      </div>
                      <Contraindications 
                        patientId={patientId} 
                        patientName={`${patient.user.firstName} ${patient.user.lastName}`}
                        medicalHistory={{
                          systemicConditions: (() => {
                            // Auto-identify conditions from various fields
                            const conditions = [];
                            if (patient.hypertension) conditions.push('Hypertension');
                            if (patient.diabetes) conditions.push('Diabetes Mellitus');
                            if (patient.heartDisease) conditions.push('Heart Disease');
                            if (patient.asthma) conditions.push('Asthma');
                            if (patient.arthritis) conditions.push('Arthritis');
                            if (patient.cancer) conditions.push('Cancer');
                            if (patient.stroke) conditions.push('Stroke');
                            if (patient.kidneyDisease) conditions.push('Kidney Disease');
                            if (patient.liverDisease) conditions.push('Liver Disease');
                            if (patient.thyroidDisease) conditions.push('Thyroid Disease');
                            if (patient.mentalIllness) conditions.push('Mental Illness');
                            if (patient.seizures) conditions.push('Seizure Disorder');
                            if (patient.bleedingDisorders) conditions.push('Bleeding Disorder');
                            if (patient.autoimmune) conditions.push('Autoimmune Disease');
                            if (patient.hepatitis) conditions.push('Hepatitis');
                            if (patient.hivAids) conditions.push('HIV/AIDS');
                            if (patient.lungDisease) conditions.push('Lung Disease');
                            if (patient.osteoporosis) conditions.push('Osteoporosis');
                            return conditions;
                          })(),
                          medications: patient.currentMedications ? patient.currentMedications.split(',').map(med => med.trim()) : [],
                          allergies: patient.allergies ? patient.allergies.split(',').map(allergy => allergy.trim()) : [],
                          vitalSigns: {
                            // Note: We don't have these values stored currently
                            // In a real app, we would fetch them from the most recent visit
                            // For now, providing empty values which will be updated when available
                            bloodPressure: undefined,
                            heartRate: undefined,
                          },
                          smokingHistory: patient.smokesTobacco === true,
                          pregnancyStatus: patient.isPregnantOrNursing ? 'pregnant' : 'not_pregnant'
                        }}
                      />
                    </div>
                    
                    <div className="space-y-2 mt-4 pt-4 border-t">
                      {patient?.allergies && (
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-5 w-5 mt-0.5 text-destructive" />
                          <div>
                            <p className="font-medium">Allergies</p>
                            <p className="text-sm text-muted-foreground">{patient.allergies}</p>
                          </div>
                        </div>
                      )}
                      {patient?.adverseAnestheticReaction && (
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-5 w-5 mt-0.5 text-destructive" />
                          <div>
                            <p className="font-medium">Adverse Anesthetic Reaction</p>
                            <p className="text-sm text-muted-foreground">
                              Patient has reported adverse reactions to anesthetics
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs for different sections */}
              <Tabs defaultValue="medical-history" className="w-full">
                <TabsList className="grid grid-cols-9 mb-6 border rounded-lg bg-gray-50 shadow-sm">
                  <TabsTrigger value="medical-history" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Medical History</TabsTrigger>
                  <TabsTrigger value="dental-chart" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Dental Chart</TabsTrigger>
                  <TabsTrigger value="perio-chart" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Perio Chart</TabsTrigger>
                  <TabsTrigger value="xray" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">X-rays</TabsTrigger>
                  <TabsTrigger value="appointments" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Appointments</TabsTrigger>
                  <TabsTrigger value="treatment-plans" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Treatment Plans</TabsTrigger>
                  <TabsTrigger value="notes" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Clinical Notes</TabsTrigger>
                  <TabsTrigger value="ai-diagnostic" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <div className="flex items-center gap-1">
                      <Brain className="h-4 w-4" />
                      <span>AI Hub</span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger value="post-op" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <div className="flex items-center gap-1">
                      <ClipboardCheck className="h-4 w-4" />
                      <span>Post-Op Care</span>
                    </div>
                  </TabsTrigger>
                </TabsList>

                {/* Medical History Tab */}
                <TabsContent value="medical-history">
                  <div className="space-y-6">
                    <PatientMedicalHistory 
                      patientId={patientId}
                      patientName={`${patient.user.firstName} ${patient.user.lastName}`}
                      readOnly={false}
                      onSave={(data) => {
                        console.log("Medical history saved:", data);
                        // In a real app, this would save the data to the API
                        // For now, we'll just log it to the console
                      }}
                    />
                    
                    {/* Disease Information Component */}
                    <DiseaseInformation 
                      patientId={patientId}
                      conditions={patient.medicalHistory ? (() => {
                        try {
                          const parsedHistory = JSON.parse(patient.medicalHistory);
                          return parsedHistory.systemicConditions || [];
                        } catch (e) {
                          console.error("Error parsing medical history:", e);
                          return [];
                        }
                      })() : []}
                      medications={patient.currentMedications ? patient.currentMedications.split(',').map(med => med.trim()) : []}
                    />
                  </div>
                </TabsContent>
                
                {/* Dental Chart Tab */}
                <TabsContent value="dental-chart">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Scissors className="h-5 w-5 text-primary" />
                        Dental Chart
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <DentalChart 
                        patientId={patientId}
                        readOnly={false}
                        onSave={(data) => {
                          console.log('Dental chart saved:', data);
                          // In a real app, you would call an API to save this data
                        }}
                      />
                      
                      <div className="mt-4">
                        <h3 className="text-lg font-medium mb-4">Restorative Chart (Occlusal View)</h3>
                        <RestorativeChart 
                          patientId={patientId}
                          patientName={`${patient.user.firstName} ${patient.user.lastName}`}
                          readOnly={false}
                          onSave={(data) => {
                            console.log('Restorative chart saved:', data);
                            toast({
                              title: "Restorative Chart Saved",
                              description: "Chart data has been saved successfully",
                              variant: "default"
                            });
                          }}
                        />
                      </div>
                      
                      <div className="mt-4">
                        <h3 className="text-lg font-medium mb-4">Enhanced Dental Chart</h3>
                        <EnhancedDentalChart 
                          patientId={patientId}
                          readOnly={false}
                          onSave={(data) => {
                            console.log('Enhanced dental chart saved:', data);
                            // In a real app, you would call an API to save this data
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Perio Chart Tab */}
                <TabsContent value="perio-chart">
                  <Card className="bg-background">
                    <CardHeader className="bg-card">
                      <CardTitle className="flex items-center gap-2">
                        <LineChart className="h-5 w-5 text-primary" />
                        Periodontal Chart
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="bg-background p-4">
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200 mb-6">
                        <p className="text-sm text-green-700">
                          <strong>Updated Periodontal Chart:</strong> We've enhanced the periodontal chart with anatomically correct tooth visuals and clinically accurate color coding for better diagnosis.
                        </p>
                      </div>
                      
                      <div className="mb-6">
                        <FixedEnhancedPerioChart
                          patientId={patientId}
                          patientName={`${patient.user.firstName} ${patient.user.lastName}`}
                          readOnly={false}
                          onSave={(data) => {
                            console.log('Enhanced perio chart saved:', data);
                            toast({
                              title: "Periodontal Chart Saved",
                              description: "Chart data has been saved successfully",
                              variant: "default"
                            });
                          }}
                        />
                      </div>
                      
                      <div className="mt-8 hidden">
                        <h3 className="text-lg font-medium mb-4">Legacy Chart (For Reference)</h3>
                        <ImprovedPerioChart 
                          patientId={patientId}
                          patientName={`${patient.user.firstName} ${patient.user.lastName}`}
                          readOnly={false}
                          onSave={(data) => {
                            console.log('Improved perio chart saved:', data);
                            toast({
                              title: "Improved Periodontal Chart Saved",
                              description: "Chart data has been saved successfully",
                              variant: "default"
                            });
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* X-Ray Tab */}
                <TabsContent value="xray">
                  <Tabs defaultValue="xray-analysis">
                    <TabsList className="w-full mb-4 border rounded-lg bg-gray-50">
                      <TabsTrigger value="xray-analysis" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">X-ray Analysis</TabsTrigger>
                      <TabsTrigger value="intraoral-scanner" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Intraoral Scanner</TabsTrigger>
                      <TabsTrigger value="multi-modal" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Multi-Modal AI Diagnosis</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="xray-analysis">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-primary" />
                            X-ray Images
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-6">
                            {/* AI X-ray Analysis Section */}
                            <div className="mb-6">
                              <h3 className="text-lg font-medium mb-4">AI X-ray Analysis</h3>
                              
                              {/* Enhanced AI X-ray Analysis Viewer */}
                              <XrayAnalysisViewer patientId={patientId} />
                              
                              <div className="flex flex-wrap gap-2 mt-4">
                                <Button variant="outline" size="sm">Upload New X-ray</Button>
                                <Button variant="outline" size="sm">Capture from Sensor</Button>
                                <Button variant="outline" size="sm">Import from PACS</Button>
                              </div>
                            </div>
                            
                            {/* X-ray History */}
                            <div>
                              <h3 className="text-lg font-medium mb-4">X-ray History</h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {/* Sample x-ray cards */}
                                <Card className="overflow-hidden">
                                  <div className="aspect-video bg-muted relative">
                                    {/* X-ray image would go here */}
                                  </div>
                                  <CardContent className="p-3">
                                    <div className="text-sm font-medium">Full Mouth Series</div>
                                    <div className="text-xs text-muted-foreground">Taken: 12/15/2024</div>
                                  </CardContent>
                                </Card>
                                <Card className="overflow-hidden">
                                  <div className="aspect-video bg-muted relative">
                                    {/* X-ray image would go here */}
                                  </div>
                                  <CardContent className="p-3">
                                    <div className="text-sm font-medium">Panoramic</div>
                                    <div className="text-xs text-muted-foreground">Taken: 11/03/2024</div>
                                  </CardContent>
                                </Card>
                                <Card className="overflow-hidden">
                                  <div className="aspect-video bg-muted relative">
                                    {/* X-ray image would go here */}
                                  </div>
                                  <CardContent className="p-3">
                                    <div className="text-sm font-medium">Bitewings</div>
                                    <div className="text-xs text-muted-foreground">Taken: 09/22/2024</div>
                                  </CardContent>
                                </Card>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="intraoral-scanner">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Camera className="h-5 w-5 text-primary" />
                            Intraoral Scanner
                          </CardTitle>
                          <CardDescription>
                            Analyze intraoral images to detect soft tissue abnormalities, bone loss, and occlusal relationships
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {/* Import the IntraoralScanner component */}
                          <IntraoralScanner
                            patientId={patientId}
                            patientName={`${patient.user.firstName} ${patient.user.lastName}`}
                          />
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="multi-modal">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Brain className="h-5 w-5 text-primary" />
                            Multi-Modal AI Diagnosis
                          </CardTitle>
                          <CardDescription>
                            Comprehensive analysis combining X-rays, intraoral images, and clinical data
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="p-8 text-center space-y-4">
                            <div className="rounded-full mx-auto bg-primary/10 p-3 w-12 h-12 flex items-center justify-center">
                              <Bot className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="text-lg font-medium">Multi-Modal AI Diagnosis</h3>
                            <p className="text-muted-foreground max-w-md mx-auto">
                              Our advanced AI system combines data from X-rays, intraoral images, and clinical findings to provide the most comprehensive and accurate diagnosis.
                            </p>
                            <div className="flex justify-center mt-4">
                              <Button className="mt-2">
                                Generate Comprehensive AI Diagnosis
                              </Button>
                            </div>
                          </div>
                          
                          <div className="mt-8 border-t pt-6">
                            <h3 className="text-lg font-medium mb-4">How Multi-Modal AI Works</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="rounded-lg border p-4">
                                <div className="mb-3 flex items-center gap-2">
                                  <div className="bg-primary/10 p-2 rounded-full">
                                    <FileImage className="h-5 w-5 text-primary" />
                                  </div>
                                  <h4 className="font-medium">X-ray Analysis</h4>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  AI analyzes radiographs to detect cavities, bone loss, abscesses, and other hidden conditions.
                                </p>
                              </div>
                              
                              <div className="rounded-lg border p-4">
                                <div className="mb-3 flex items-center gap-2">
                                  <div className="bg-primary/10 p-2 rounded-full">
                                    <Camera className="h-5 w-5 text-primary" />
                                  </div>
                                  <h4 className="font-medium">Intraoral Imaging</h4>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Advanced computer vision detects soft tissue abnormalities, lesions, and occlusal wear patterns.
                                </p>
                              </div>
                              
                              <div className="rounded-lg border p-4">
                                <div className="mb-3 flex items-center gap-2">
                                  <div className="bg-primary/10 p-2 rounded-full">
                                    <Activity className="h-5 w-5 text-primary" />
                                  </div>
                                  <h4 className="font-medium">Clinical Data</h4>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Integrates patient history, symptoms, and clinical findings for a complete diagnostic picture.
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </TabsContent>

                {/* Appointments Tab */}
                <TabsContent value="appointments">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        Appointments History
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {appointmentsLoading ? (
                        <div className="flex justify-center py-8">
                          <LoadingAnimation />
                        </div>
                      ) : appointments && Array.isArray(appointments) && appointments.length > 0 ? (
                        <div className="space-y-4">
                          {appointments.map((appointment: any) => (
                            <div key={appointment.id} className="border rounded-md p-4">
                              <div className="flex items-center justify-between">
                                <div className="font-medium">{new Date(appointment.date).toLocaleDateString()}</div>
                                <div className={`px-2 py-1 rounded text-xs ${
                                  appointment.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                  appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                                  appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' : 
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                </div>
                              </div>
                              <div className="text-sm text-muted-foreground mt-2">
                                {new Date(appointment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              {appointment.notes && (
                                <div className="mt-2 text-sm">
                                  <p className="font-medium">Notes:</p>
                                  <p className="text-muted-foreground">{appointment.notes}</p>
                                </div>
                              )}
                              <div className="mt-2 text-sm">
                                <span className={appointment.isOnline ? 'text-primary' : 'text-muted-foreground'}>
                                  {appointment.isOnline ? 'Online Appointment' : 'In-office Appointment'}
                                </span>
                                {appointment.insuranceVerified && (
                                  <span className="ml-4 text-green-600">Insurance Verified</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
                          <p className="mt-4 text-muted-foreground">No appointments found for this patient.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Treatment Plans Tab */}
                <TabsContent value="treatment-plans">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PenTool className="h-5 w-5 text-primary" />
                        Treatment Plans
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {treatmentPlansLoading ? (
                        <div className="flex justify-center py-8">
                          <LoadingAnimation />
                        </div>
                      ) : treatmentPlans && Array.isArray(treatmentPlans) && treatmentPlans.length > 0 ? (
                        <div className="space-y-4">
                          {treatmentPlans.map((plan: any) => (
                            <div key={plan.id} className="border rounded-md p-4">
                              <div className="flex items-center justify-between">
                                <div className="font-medium">{plan.diagnosis}</div>
                                <div className={`px-2 py-1 rounded text-xs ${
                                  plan.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                  plan.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                                  plan.status === 'accepted' ? 'bg-blue-100 text-blue-800' : 
                                  plan.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-purple-100 text-purple-800'
                                }`}>
                                  {plan.status.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                </div>
                              </div>
                              <div className="mt-2 text-sm">
                                <div className="font-medium">Cost Information:</div>
                                <div className="grid grid-cols-3 gap-2 mt-1">
                                  <div>
                                    <p className="text-muted-foreground">Total Cost</p>
                                    <p>${plan.cost}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Insurance Coverage</p>
                                    <p>${plan.insuranceCoverage || 0}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Patient Responsibility</p>
                                    <p>${plan.patientResponsibility || plan.cost}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="mt-3 text-sm">
                                <div className="font-medium">Procedures:</div>
                                <ul className="list-disc list-inside mt-1 text-muted-foreground">
                                  {plan.procedures && Array.isArray(plan.procedures) && plan.procedures.map((procedure: any, i: number) => (
                                    <li key={i}>{procedure.name}</li>
                                  ))}
                                </ul>
                              </div>
                              <div className="mt-2 text-xs text-muted-foreground">
                                Created: {new Date(plan.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <PenTool className="h-12 w-12 mx-auto text-muted-foreground" />
                          <p className="mt-4 text-muted-foreground">No treatment plans found for this patient.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Medical Notes Tab */}
                <TabsContent value="notes">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Medical Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {medicalNotesLoading ? (
                        <div className="flex justify-center py-8">
                          <LoadingAnimation />
                        </div>
                      ) : medicalNotes && Array.isArray(medicalNotes) && medicalNotes.length > 0 ? (
                        <div className="space-y-4">
                          {medicalNotes.map((note: any) => (
                            <div key={note.id} className="border rounded-md p-4">
                              <div className="flex items-center justify-between">
                                <div className="font-medium">
                                  {note.createdAt 
                                    ? new Date(note.createdAt).toLocaleDateString() 
                                    : 'No date'}
                                </div>
                                {note.private && (
                                  <div className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                                    Private
                                  </div>
                                )}
                              </div>
                              <div className="mt-3 whitespace-pre-wrap">
                                {note.content}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                          <p className="mt-4 text-muted-foreground">No medical notes found for this patient.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* AI Diagnostic & Treatment Hub Tab */}
                <TabsContent value="ai-diagnostic">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-primary" />
                        AI Diagnosis & Treatment Hub
                      </CardTitle>
                      <CardDescription>
                        Comprehensive AI-assisted diagnosis and treatment planning
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* AI Diagnosis Analysis */}
                        <Card className="shadow-sm border-primary/20">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-md font-medium flex items-center gap-2">
                              <Activity className="h-4 w-4 text-primary" />
                              AI Diagnosis Analysis
                            </CardTitle>
                            <CardDescription>
                              AI-generated diagnostic suggestions based on clinical notes
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {/* DiagnosisFeedbackUI component */}
                              <DiagnosisFeedbackUI 
                                diagnosisData={{
                                  explanation: "Based on the patient's symptoms of tooth sensitivity to cold, visible decay on the occlusal surface, and the radiographic findings showing radiolucency extending into dentin but not reaching the pulp, the most likely diagnosis is moderate dental caries (tooth decay) affecting tooth #30. The depth of the caries suggests it has progressed beyond the enamel and into the dentin layer, which explains the sensitivity to cold stimuli. There is no evidence of pulpal involvement at this time.",
                                  options: [
                                    { label: "Moderate Dental Caries (Tooth #30)", confidence: 92 },
                                    { label: "Early Pulpitis", confidence: 45 },
                                    { label: "Cracked Tooth Syndrome", confidence: 28 },
                                    { label: "Dentinal Hypersensitivity", confidence: 22 }
                                  ],
                                  needsMoreInfo: false,
                                  followUpQuestion: null
                                }}
                                onSubmitFeedback={(feedback) => {
                                  console.log("Diagnosis feedback submitted:", feedback);
                                  // In a production app, this would send the feedback to the API
                                }}
                              />
                            </div>
                          </CardContent>
                        </Card>

                        {/* Treatment Plan Suggestions */}
                        <Card className="shadow-sm border-primary/20">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-md font-medium flex items-center gap-2">
                              <ClipboardCheck className="h-4 w-4 text-primary" />
                              Treatment Plan Suggestions
                            </CardTitle>
                            <CardDescription>
                              AI-generated treatment plan based on diagnosis
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <p className="text-sm text-muted-foreground">
                                Based on the confirmed diagnosis, the AI has generated the following treatment recommendations:
                              </p>
                              
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 rounded-md border p-2">
                                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">1</div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">Composite Restoration (Tooth #30)</p>
                                    <p className="text-xs text-muted-foreground">Remove caries and place composite filling</p>
                                  </div>
                                  <div className="text-xs font-medium bg-green-50 text-green-700 px-2 py-1 rounded">
                                    Confidence: 95%
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2 rounded-md border p-2">
                                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">2</div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">Fluoride Application</p>
                                    <p className="text-xs text-muted-foreground">Apply topical fluoride to strengthen surrounding teeth</p>
                                  </div>
                                  <div className="text-xs font-medium bg-green-50 text-green-700 px-2 py-1 rounded">
                                    Confidence: 89%
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2 rounded-md border p-2">
                                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">3</div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">Oral Hygiene Education</p>
                                    <p className="text-xs text-muted-foreground">Improve brushing technique and recommend flossing</p>
                                  </div>
                                  <div className="text-xs font-medium bg-green-50 text-green-700 px-2 py-1 rounded">
                                    Confidence: 97%
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex justify-end pt-2">
                                <Button size="sm" className="mr-2" variant="outline">Modify Plan</Button>
                                <Button size="sm">Approve Plan</Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* AI Analysis Insights */}
                      <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-md font-medium flex items-center gap-2">
                            <Bot className="h-4 w-4 text-primary" />
                            AI Diagnostic Reasoning
                          </CardTitle>
                          <CardDescription>
                            Detailed explanation of AI diagnostic process
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="rounded-md bg-muted p-4 text-sm">
                              <h4 className="font-medium mb-2">Reasoning Process:</h4>
                              <p className="text-muted-foreground mb-3">
                                The AI model analyzed the following data points to reach its diagnosis:
                              </p>
                              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                                <li>Patient reported cold sensitivity in the lower right quadrant</li>
                                <li>Clinical examination revealed visible decay on the occlusal surface of tooth #30</li>
                                <li>Radiographic findings showed radiolucency extending into dentin but not near the pulp</li>
                                <li>Positive response to cold testing, but pain subsided quickly after stimulus removal</li>
                                <li>No pain on percussion or palpation</li>
                              </ul>
                              
                              <h4 className="font-medium mt-4 mb-2">Differential Diagnosis:</h4>
                              <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
                                <li><span className="font-medium">Moderate Dental Caries (92% confidence)</span>: Strongly supported by visual evidence, radiographic findings, and symptoms</li>
                                <li><span className="font-medium">Early Pulpitis (45% confidence)</span>: Less likely as pain subsides quickly after stimulus removal and no spontaneous pain</li>
                                <li><span className="font-medium">Cracked Tooth Syndrome (28% confidence)</span>: No evidence of crack lines, no pain on biting/release</li>
                                <li><span className="font-medium">Dentinal Hypersensitivity (22% confidence)</span>: Less likely due to presence of decay</li>
                              </ol>
                            </div>
                            
                            <div className="flex justify-end">
                              <Button variant="outline" size="sm">Export Analysis</Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Post-Op Instructions Tab */}
                <TabsContent value="post-op">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ClipboardCheck className="h-5 w-5 text-primary" />
                        Post-Operative Instructions
                      </CardTitle>
                      <CardDescription>
                        Manage detailed post-operative care instructions for this patient
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <PostOpInstructions 
                        patientId={patientId}
                        patientName={`${patient.user.firstName} ${patient.user.lastName}`}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}