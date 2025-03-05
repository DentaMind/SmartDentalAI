import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Stethoscope, FileImage, Calculator, ClipboardList, Loader2 } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AIDiagnosticsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("diagnosis");
  const [symptoms, setSymptoms] = useState("");

  const diagnosisMutation = useMutation({
    mutationFn: async (symptoms: string) => {
      try {
        const res = await apiRequest("POST", "/api/ai/diagnosis", { 
          symptoms,
          patientHistory: "" // Optional: Add patient history if available
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error("API Error:", errorText);
          throw new Error(`Failed to analyze symptoms: ${res.status} ${res.statusText}`);
        }

        return res.json();
      } catch (error) {
        console.error("Diagnosis request error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Analysis Complete",
        description: "AI has analyzed your symptoms and provided recommendations.",
      });
    },
    onError: (error: Error) => {
      console.error("Diagnosis error:", error);
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="container mx-auto p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-xl bg-primary/10">
          <Brain className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Diagnostics</h1>
          <p className="text-muted-foreground">
            Comprehensive AI-powered dental analysis and treatment planning
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="diagnosis" className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            <span>Diagnosis</span>
          </TabsTrigger>
          <TabsTrigger value="imaging" className="flex items-center gap-2">
            <FileImage className="h-4 w-4" />
            <span>Imaging</span>
          </TabsTrigger>
          <TabsTrigger value="treatment" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            <span>Treatment</span>
          </TabsTrigger>
          <TabsTrigger value="costs" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            <span>Costs</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="diagnosis">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Diagnosis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Describe Symptoms</label>
                <Textarea
                  placeholder="Please describe the dental symptoms in detail..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  rows={5}
                />
              </div>
              <Button 
                onClick={() => diagnosisMutation.mutate(symptoms)}
                disabled={diagnosisMutation.isPending || !symptoms}
                className="w-full"
              >
                {diagnosisMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze Symptoms"
                )}
              </Button>

              {diagnosisMutation.data && (
                <div className="mt-6 space-y-4">
                  <h3 className="text-lg font-semibold">Analysis Results</h3>
                  <div className="grid gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Possible Conditions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {diagnosisMutation.data.conditions && diagnosisMutation.data.conditions.map((condition: any, index: number) => (
                          <div key={index} className="mb-2">
                            <p className="font-medium">{condition.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Confidence: {Math.round(condition.confidence * 100)}%
                            </p>
                            {condition.description && (
                              <p className="text-sm mt-1">{condition.description}</p>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    {diagnosisMutation.data.aiDomains && Object.entries(diagnosisMutation.data.aiDomains).map(([domain, data]: [string, any]) => (
                      <Card key={domain}>
                        <CardHeader>
                          <CardTitle className="text-sm capitalize">{domain} Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div>
                              <h4 className="font-medium">Findings:</h4>
                              <ul className="list-disc pl-4 text-sm">
                                {data.findings.map((finding: string, index: number) => (
                                  <li key={index}>{finding}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-medium">Recommendations:</h4>
                              <ul className="list-disc pl-4 text-sm">
                                {data.recommendations.map((rec: string, index: number) => (
                                  <li key={index}>{rec}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="imaging">
          <Card>
            <CardHeader>
              <CardTitle>X-Ray Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-40 border-2 border-dashed rounded-lg border-gray-200">
                <p className="text-muted-foreground">Upload X-ray images for AI analysis</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="treatment">
          <Card>
            <CardHeader>
              <CardTitle>Treatment Planning</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Complete the diagnosis first to receive AI-generated treatment recommendations
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs">
          <Card>
            <CardHeader>
              <CardTitle>Cost Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Select a treatment plan to see detailed cost breakdown and insurance coverage
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}