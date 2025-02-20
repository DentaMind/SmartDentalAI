import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TreatmentPlan } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, FileText } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { useToast } from "@/hooks/use-toast";

type TreatmentPlanProps = {
  patientId: number;
  existingPlans: TreatmentPlan[];
};

export default function TreatmentPlanComponent({
  patientId,
  existingPlans,
}: TreatmentPlanProps) {
  const { toast } = useToast();
  const [diagnosis, setDiagnosis] = useState("");
  const [procedures, setProcedures] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");

  const generatePlanMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai/treatment-plan", {
        diagnosis,
        patientHistory: existingPlans,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setProcedures(data.procedures.join("\n"));
      setEstimatedCost(data.estimatedCost.toString());
      toast({
        title: "Treatment plan generated",
        description: "AI has suggested a treatment plan based on the diagnosis",
      });
    },
  });

  const savePlanMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/treatment-plans", {
        patientId,
        diagnosis,
        procedures: procedures.split("\n").filter(Boolean),
        estimatedCost: parseInt(estimatedCost),
        status: "proposed",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/treatment-plans", patientId] });
      toast({
        title: "Treatment plan saved",
        description: "The plan has been saved successfully",
      });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Treatment Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Diagnosis</label>
            <Textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Enter diagnosis..."
              className="min-h-[100px]"
            />
          </div>

          <Button
            onClick={() => generatePlanMutation.mutate()}
            disabled={!diagnosis || generatePlanMutation.isPending}
          >
            {generatePlanMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Generate Treatment Plan
          </Button>

          <div className="space-y-2">
            <label className="text-sm font-medium">Procedures</label>
            <Textarea
              value={procedures}
              onChange={(e) => setProcedures(e.target.value)}
              placeholder="List procedures..."
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Estimated Cost ($)</label>
            <Input
              type="number"
              value={estimatedCost}
              onChange={(e) => setEstimatedCost(e.target.value)}
              placeholder="Enter estimated cost..."
            />
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={() => savePlanMutation.mutate()}
              disabled={
                !diagnosis || !procedures || !estimatedCost || savePlanMutation.isPending
              }
            >
              {savePlanMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Plan
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Treatment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {existingPlans.map((plan) => (
              <div
                key={plan.id}
                className="border rounded-lg p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium">{plan.diagnosis}</p>
                  <span className="text-sm text-muted-foreground">
                    {new Date(plan.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <ul className="list-disc pl-4 space-y-1">
                  {(plan.procedures as string[]).map((proc, i) => (
                    <li key={i} className="text-sm">{proc}</li>
                  ))}
                </ul>
                <p className="text-sm text-muted-foreground">
                  Estimated Cost: ${plan.estimatedCost}
                </p>
                <Button variant="outline" size="sm" className="mt-2">
                  <FileText className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
