
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ShieldAlert, AlertTriangle, Check } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MedicalHistoryData {
  systemicConditions: string[];
  medications: string[];
  allergies: string[];
  surgicalHistory: string[];
  vitalSigns: {
    bloodPressure: string;
    heartRate: number;
  };
}

interface MedicalAnalysisProps {
  patientId: number;
}

export function MedicalHistoryPanel({ patientId }: MedicalAnalysisProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("conditions");

  // Fetch patient's medical history
  const { data: medicalHistory, isLoading } = useQuery({
    queryKey: ["medicalHistory", patientId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/patients/${patientId}/medical-history`);
      return res.json() as Promise<MedicalHistoryData>;
    }
  });

  // Get AI analysis of medical history
  const analysisMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        "POST", 
        "/api/ai/medical-analysis", 
        { patientId }
      );
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Analysis Complete",
        description: "Medical history has been analyzed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Risk level indicator component
  const RiskLevel = ({ level }: { level: string }) => {
    if (level === "high") {
      return (
        <Badge variant="destructive" className="gap-1">
          <ShieldAlert className="h-3.5 w-3.5" />
          High Risk
        </Badge>
      );
    } else if (level === "moderate") {
      return (
        <Badge variant="warning" className="gap-1 bg-amber-500">
          <AlertTriangle className="h-3.5 w-3.5" />
          Moderate Risk
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="gap-1 bg-green-100 text-green-800 border-green-300">
          <Check className="h-3.5 w-3.5" />
          Low Risk
        </Badge>
      );
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading medical history...</div>;
  }

  if (!medicalHistory) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No medical history found</AlertTitle>
          <AlertDescription>
            This patient does not have any medical history records.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Medical History</CardTitle>
            <Button 
              onClick={() => analysisMutation.mutate()} 
              disabled={analysisMutation.isPending}
            >
              {analysisMutation.isPending ? "Analyzing..." : "Analyze with AI"}
            </Button>
          </div>
          <CardDescription>
            Patient's medical conditions, medications, and treatment considerations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="conditions">Conditions</TabsTrigger>
              <TabsTrigger value="medications">Medications</TabsTrigger>
              <TabsTrigger value="allergies">Allergies</TabsTrigger>
              <TabsTrigger value="vitals">Vital Signs</TabsTrigger>
            </TabsList>
            
            <TabsContent value="conditions" className="space-y-4">
              {medicalHistory.systemicConditions.length > 0 ? (
                <ul className="space-y-2">
                  {medicalHistory.systemicConditions.map((condition, index) => (
                    <li key={index} className="p-3 bg-slate-50 rounded-md">
                      {condition}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No systemic conditions reported.</p>
              )}
            </TabsContent>
            
            <TabsContent value="medications" className="space-y-4">
              {medicalHistory.medications.length > 0 ? (
                <ul className="space-y-2">
                  {medicalHistory.medications.map((medication, index) => (
                    <li key={index} className="p-3 bg-slate-50 rounded-md flex items-center justify-between">
                      <span>{medication}</span>
                      {medication.toLowerCase().includes("coumadin") && (
                        <Badge variant="destructive">Bleeding Risk</Badge>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No medications reported.</p>
              )}
            </TabsContent>
            
            <TabsContent value="allergies" className="space-y-4">
              {medicalHistory.allergies.length > 0 ? (
                <ul className="space-y-2">
                  {medicalHistory.allergies.map((allergy, index) => (
                    <li key={index} className="p-3 bg-slate-50 rounded-md">
                      {allergy}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No allergies reported.</p>
              )}
            </TabsContent>
            
            <TabsContent value="vitals" className="space-y-4">
              {medicalHistory.vitalSigns ? (
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Blood Pressure</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{medicalHistory.vitalSigns.bloodPressure}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Heart Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{medicalHistory.vitalSigns.heartRate} BPM</p>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <p className="text-muted-foreground">No vital signs recorded.</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {analysisMutation.isSuccess && analysisMutation.data && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                AI Medical Risk Assessment
              </CardTitle>
              <RiskLevel level={analysisMutation.data.overallRiskLevel} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysisMutation.data.treatmentContraindications.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Contraindications</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5 mt-2">
                    {analysisMutation.data.treatmentContraindications.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            {analysisMutation.data.recommendedPrecautions.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Recommended Precautions</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {analysisMutation.data.recommendedPrecautions.map((precaution, i) => (
                    <li key={i}>{precaution}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysisMutation.data.medicationInteractions.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Medication Interactions</h4>
                <div className="space-y-3">
                  {analysisMutation.data.medicationInteractions.map((interaction, i) => (
                    <div key={i} className="bg-white p-3 rounded-md border">
                      <div className="font-medium">{interaction.medication}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Interacts with: {interaction.interactsWith.join(", ")}
                      </div>
                      <div className="mt-2">
                        <span className="text-sm font-medium">Recommendations:</span>
                        <ul className="list-disc pl-5 mt-1 text-sm">
                          {interaction.recommendations.map((rec, j) => (
                            <li key={j}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
