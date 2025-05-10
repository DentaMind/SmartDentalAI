
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Loader2, ClipboardList, ArrowDownToLine } from "lucide-react";
import { generateTreatmentPlan } from "@/lib/ai-predictor";

interface Props {
  diagnosis?: string;
  patientHistory?: string;
}

export function TreatmentPlanGenerator({ diagnosis, patientHistory }: Props) {
  const [diagnosisText, setDiagnosisText] = useState(diagnosis || "");
  const { toast } = useToast();

  const generateMutation = useMutation({
    mutationFn: async (data: { diagnosis: string, patientHistory?: string }) => {
      try {
        const result = await generateTreatmentPlan(data.diagnosis, data.patientHistory);
        return result;
      } catch (error) {
        console.error("Treatment plan generation error:", error);
        throw error;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleGenerate = () => {
    if (!diagnosisText.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter a diagnosis to generate a treatment plan",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate({
      diagnosis: diagnosisText,
      patientHistory
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          AI Treatment Plan Generator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Diagnosis</label>
            <Textarea
              placeholder="Enter the diagnosis or paste AI analysis results"
              value={diagnosisText}
              onChange={(e) => setDiagnosisText(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <Button
            className="w-full"
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Treatment Plan...
              </>
            ) : (
              <>
                <ArrowDownToLine className="mr-2 h-4 w-4" />
                Generate Treatment Plan
              </>
            )}
          </Button>

          {generateMutation.data && (
            <div className="mt-2 space-y-4">
              <Separator />
              
              <div>
                <h3 className="font-semibold text-primary mb-2">Treatment Plan</h3>
                <div className="space-y-3">
                  <div className="bg-primary/5 p-3 rounded-md">
                    <h4 className="font-medium mb-1 text-sm">Treatment Sequence:</h4>
                    <ol className="list-decimal list-inside text-sm space-y-1">
                      {generateMutation.data.treatmentSteps.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ol>
                  </div>
                  
                  <div className="bg-primary/5 p-3 rounded-md">
                    <h4 className="font-medium mb-1 text-sm">Estimated Timeline:</h4>
                    <p className="text-sm">{generateMutation.data.estimatedTimeline}</p>
                  </div>
                  
                  <div className="bg-primary/5 p-3 rounded-md">
                    <h4 className="font-medium mb-1 text-sm">Cost Estimate:</h4>
                    <p className="text-sm">${generateMutation.data.costEstimate.totalCost}</p>
                    <div className="mt-1">
                      <span className="text-xs text-muted-foreground">Insurance estimate: ${generateMutation.data.costEstimate.insuranceCoverage}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Patient responsibility: ${generateMutation.data.costEstimate.patientResponsibility}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  // In a real app, this would create a treatment plan record
                  toast({
                    title: "Treatment Plan Saved",
                    description: "The treatment plan has been saved to the patient record"
                  });
                }}
              >
                Save Treatment Plan
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
