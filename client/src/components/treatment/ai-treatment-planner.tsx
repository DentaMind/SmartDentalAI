import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
  BarChart,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Calendar,
  ArrowRight,
  Brain
} from "lucide-react";
import { TreatmentPlan } from "@shared/schema";

export function AITreatmentPlanner() {
  const [diagnosis, setDiagnosis] = useState("");
  const [patientHistory, setPatientHistory] = useState("");
  const { toast } = useToast();

  const planMutation = useMutation({
    mutationFn: async (data: { diagnosis: string; patientHistory: string }) => {
      const response = await fetch("/api/ai/generate-treatment-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagnosis: data.diagnosis,
          patientHistory: data.patientHistory,
          aiKey: "TREATMENT_AI_KEY" // This will be replaced by the correct environment variable on the server
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to generate treatment plan");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Treatment Plan Generated",
        description: "AI has analyzed and provided recommendations",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const costMutation = useMutation({
    mutationFn: async (treatmentPlan: TreatmentPlan) => {
      const response = await fetch("/api/ai/cost-comparison", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          treatmentPlan,
          aiKey: "FINANCIAL_AI_KEY" // This will be replaced by the correct environment variable on the server
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to generate cost comparison");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Cost Analysis Complete",
        description: "Financial breakdown and insurance coverage estimates generated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Cost Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Treatment Planner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Diagnosis</label>
              <Textarea
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="Enter detailed diagnosis..."
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Patient History</label>
              <Textarea
                value={patientHistory}
                onChange={(e) => setPatientHistory(e.target.value)}
                placeholder="Enter relevant patient history..."
                className="mt-1"
              />
            </div>
            <Button
              onClick={() => planMutation.mutate({ diagnosis, patientHistory })}
              disabled={!diagnosis || planMutation.isPending}
              className="w-full"
            >
              {planMutation.isPending ? (
                "Generating Plan..."
              ) : (
                <>
                  Generate AI Treatment Plan
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {planMutation.data && (
        <Tabs defaultValue="plan" className="w-full">
          <TabsList>
            <TabsTrigger value="plan">Treatment Steps</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
            <TabsTrigger value="risks">Risk Assessment</TabsTrigger>
          </TabsList>

          <TabsContent value="plan">
            <Card>
              <CardHeader>
                <CardTitle>Recommended Treatment Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-4">
                  {planMutation.data.treatmentSteps.map((step, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle>Treatment Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Estimated Duration: {planMutation.data.estimatedTimeline}
                  </p>
                  {/* Add timeline visualization here */}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="costs">
            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Cost</p>
                      <p className="text-2xl font-bold">
                        ${planMutation.data.costEstimate.totalCost}
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Insurance Coverage
                      </p>
                      <p className="text-2xl font-bold">
                        ${planMutation.data.costEstimate.insuranceCoverage}
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Patient Responsibility
                      </p>
                      <p className="text-2xl font-bold">
                        ${planMutation.data.costEstimate.patientResponsibility}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risks">
            <Card>
              <CardHeader>
                <CardTitle>Risk Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {planMutation.data.alternativeOptions.map((option, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <span>{option}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
