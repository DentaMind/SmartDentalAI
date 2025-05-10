import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Progress } from "@/components/ui/progress";

interface AnalysisProps {
  patientId: number;
  symptoms: string;
  xrayImages?: string[];
}

export function ComprehensiveAnalysis({ patientId, symptoms, xrayImages }: AnalysisProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analysisMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/ai/comprehensive-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, symptoms, xrayImages }),
      });
      if (!response.ok) throw new Error("Analysis failed");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Analysis Complete",
        description: "AI has generated comprehensive treatment recommendations",
      });
      setIsAnalyzing(false);
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsAnalyzing(false);
    },
  });

  const { data: analysis } = useQuery({
    queryKey: ["/api/ai/analysis", patientId],
    enabled: false,
  });

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    analysisMutation.mutate();
  };

  if (isAnalyzing) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("ai.analyzing")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={66} className="mb-4" />
          <p className="text-sm text-muted-foreground">
            {t("ai.analyzingDescription")}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t("ai.startAnalysis")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleAnalyze} className="w-full">
            {t("ai.analyze")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { diagnosis, treatmentPlan, sequence, costAnalysis } = analysis;

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="diagnosis">
        <AccordionTrigger className="text-lg font-semibold">
          {t("ai.diagnosis")}
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4">
            {diagnosis.conditions.map((condition, index) => (
              <Alert key={index} variant={condition.confidence > 0.7 ? "default" : "warning"}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{condition.name}</AlertTitle>
                <AlertDescription>
                  {condition.description}
                  <br />
                  <span className="text-sm text-muted-foreground">
                    Confidence: {(condition.confidence * 100).toFixed(1)}%
                  </span>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="treatment">
        <AccordionTrigger className="text-lg font-semibold">
          {t("ai.treatmentPlan")}
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4">
            {sequence.steps.map((step, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {index + 1}. {step.procedure}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{step.rationale}</p>
                  <div className="mt-2">
                    <span className="text-sm font-medium">
                      {t("ai.estimatedTime")}: {step.estimatedTime}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="costs">
        <AccordionTrigger className="text-lg font-semibold">
          {t("ai.costAnalysis")}
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4">
            {costAnalysis.procedures.map((procedure, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b">
                <span>{procedure.name}</span>
                <div className="text-right">
                  <div>${procedure.estimatedCost}</div>
                  <div className="text-sm text-muted-foreground">
                    Insurance: ${procedure.insuranceCoverage}
                  </div>
                </div>
              </div>
            ))}
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>{t("ai.totalCost")}</AlertTitle>
              <AlertDescription>
                Total: ${costAnalysis.totalCost}
                <br />
                Insurance Coverage: ${costAnalysis.totalInsuranceCoverage}
                <br />
                Patient Responsibility: ${costAnalysis.totalPatientResponsibility}
              </AlertDescription>
            </Alert>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
