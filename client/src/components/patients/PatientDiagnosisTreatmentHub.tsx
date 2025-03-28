import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import AIHubPanel from "@/components/diagnosis/AIHubPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import axios from "axios";

interface PatientDiagnosisTreatmentHubProps {
  patientId: number;
  patientName: string;
}

export default function PatientDiagnosisTreatmentHub({ patientId, patientName }: PatientDiagnosisTreatmentHubProps) {
  // Fetch all previous diagnoses and treatment plans
  const { data: diagnosisHistory, isLoading: loadingDiagnosis } = useQuery({
    queryKey: [`/api/diagnosis/history/${patientId}`],
    queryFn: async () => {
      try {
        const res = await axios.get(`/api/diagnosis/history/${patientId}`);
        return res.data;
      } catch (err) {
        console.error("Error fetching diagnosis history:", err);
        return [];
      }
    },
    enabled: !!patientId,
  });

  const { data: treatmentHistory, isLoading: loadingTreatments } = useQuery({
    queryKey: [`/api/treatment-plan/history/${patientId}`],
    queryFn: async () => {
      try {
        const res = await axios.get(`/api/treatment-plan/history/${patientId}`);
        return res.data;
      } catch (err) {
        console.error("Error fetching treatment plan history:", err);
        return [];
      }
    },
    enabled: !!patientId,
  });

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">AI-Powered Diagnosis & Treatment</h2>
        <p className="text-muted-foreground">
          Analyze chart data, x-rays, and patient history to generate diagnostic insights and treatment options for {patientName}.
        </p>
      </div>

      <Tabs defaultValue="aihub" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="aihub">AI Hub</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="aihub">
          <AIHubPanel patientId={patientId.toString()} />
        </TabsContent>
        
        <TabsContent value="history">
          {(loadingDiagnosis || loadingTreatments) ? (
            <div className="flex justify-center items-center p-8">
              <LoadingAnimation />
            </div>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Diagnosis History</CardTitle>
                  <CardDescription>Previous AI-assisted diagnoses with provider feedback</CardDescription>
                </CardHeader>
                <CardContent>
                  {diagnosisHistory && diagnosisHistory.length > 0 ? (
                    <div className="space-y-4">
                      {diagnosisHistory.map((diagnosis: any, index: number) => (
                        <Card key={index} className="p-4 shadow-sm">
                          <div className="flex justify-between">
                            <div>
                              <div className="font-medium">{diagnosis.condition}</div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(diagnosis.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm">
                                {diagnosis.status === "approved" ? "✓ Provider Approved" : "AI Generated"}
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 text-sm">
                            {diagnosis.modifiedExplanation || diagnosis.explanation}
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      No diagnosis history found for this patient.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Treatment Plan History</CardTitle>
                  <CardDescription>Previous treatment plans with status</CardDescription>
                </CardHeader>
                <CardContent>
                  {treatmentHistory && treatmentHistory.length > 0 ? (
                    <div className="space-y-4">
                      {treatmentHistory.map((plan: any, index: number) => (
                        <Card key={index} className="p-4 shadow-sm">
                          <div className="flex justify-between">
                            <div>
                              <div className="font-medium">
                                {plan.title || `Treatment Plan (${new Date(plan.createdAt).toLocaleDateString()})`}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {plan.diagnosis}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm capitalize">
                                Status: {plan.status}
                              </div>
                              <div className="text-sm">
                                Cost: ${plan.cost}
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 text-sm whitespace-pre-line">
                            {plan.planDetails || "No details provided"}
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      No treatment plan history found for this patient.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}