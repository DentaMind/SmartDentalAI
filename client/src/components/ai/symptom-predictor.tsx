import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Loader2, AlertTriangle, Clock, ThermometerSun, Shield, Stethoscope } from "lucide-react";
import {
  predictDentalCondition,
  type SymptomPrediction,
  type PredictionContext,
  needsSpecialistReferral,
  getImmediateActions
} from "@/lib/ai-predictor";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { analyzePerioStatus } from "@/lib/ai-predictor";

interface Props {
  patientHistory?: string;
  vitalSigns?: PredictionContext["vitalSigns"];
  relevantTests?: PredictionContext["relevantTests"];
  dentalRecords?: PredictionContext["dentalRecords"];
}

export function SymptomPredictor({ patientHistory, vitalSigns, relevantTests, dentalRecords }: Props) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [symptoms, setSymptoms] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const predictMutation = useMutation({
    mutationFn: async (symptoms: string) => {
      setIsAnalyzing(true);
      try {
        const result = await predictDentalCondition({
          symptoms,
          patientHistory,
          vitalSigns,
          relevantTests,
          dentalRecords
        });
        return result;
      } catch (error) {
        console.error("Prediction error:", error);
        throw error;
      } finally {
        setIsAnalyzing(false);
      }
    },
    onError: (error: Error) => {
      toast({
        title: t("ai.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case "emergency":
        return "text-red-500 font-bold";
      case "high":
        return "text-orange-500 font-bold";
      case "medium":
        return "text-yellow-500";
      default:
        return "text-green-500";
    }
  };

  const renderAIDomainFindings = (domain: string, findings: { findings: string[], recommendations: string[] }) => {
    if (!findings?.findings?.length) return null;

    return (
      <AccordionItem value={domain}>
        <AccordionTrigger className="text-primary font-medium">
          {domain.charAt(0).toUpperCase() + domain.slice(1)} Analysis
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4 p-4">
            <div>
              <h4 className="font-medium mb-2">Clinical Findings:</h4>
              <ul className="list-disc list-inside space-y-1">
                {findings.findings.map((finding, idx) => (
                  <li key={idx} className="text-sm text-gray-600">{finding}</li>
                ))}
              </ul>
            </div>
            {findings.recommendations?.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Treatment Recommendations:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {findings.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm text-gray-600">{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            Dental Symptom Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Describe the symptoms in detail, including:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Type and location of pain (sharp, dull, lingering)</li>
                <li>Duration and triggers of symptoms</li>
                <li>Any visible changes or swelling</li>
                <li>Recent dental work or injuries</li>
                <li>Affected tooth numbers if known</li>
              </ul>
            </p>
          </div>
          <Textarea
            placeholder="Example: Sharp pain on upper right molar (#3) when biting, started 2 days ago. Cold sensitivity lasting 30 seconds. No visible swelling."
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            className="min-h-[100px] mb-4"
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <div className="flex gap-2 items-center">
              <Clock className="h-4 w-4" />
              <span>Analysis takes 2-3 seconds</span>
            </div>
            <div className="flex gap-2 items-center">
              <Shield className="h-4 w-4 text-primary" />
              <span>AI-Powered Dental Analysis</span>
            </div>
          </div>
          <Button
            className="w-full"
            onClick={() => predictMutation.mutate(symptoms)}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Symptoms...
              </>
            ) : (
              "Analyze Symptoms"
            )}
          </Button>
        </CardContent>
      </Card>

      {predictMutation.data && (
        <Card>
          <CardHeader>
            <CardTitle>Diagnostic Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {getImmediateActions(predictMutation.data).length > 0 && (
              <Alert variant="destructive">
                <AlertTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Urgent Care Needed
                </AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside mt-2">
                    {getImmediateActions(predictMutation.data).map((action, idx) => (
                      <li key={idx}>{action}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            <div>
              <h3 className="font-semibold mb-2">Possible Conditions</h3>
              <div className="space-y-4">
                {predictMutation.data.possibleConditions.map((condition, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{condition.condition}</h4>
                      <Badge
                        variant={condition.urgencyLevel === "emergency" ? "destructive" : "secondary"}
                        className={getUrgencyColor(condition.urgencyLevel)}
                      >
                        {condition.urgencyLevel.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {condition.description}
                    </p>
                    <div className="mb-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{ width: `${Math.round(condition.confidence * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium mt-1 block">
                        Confidence: {Math.round(condition.confidence * 100)}%
                      </span>
                    </div>
                    {condition.specialistReferral && (
                      <div className="mb-2 p-2 bg-orange-50 rounded-md">
                        <p className="text-sm font-medium text-orange-700">
                          Specialist Referral Recommended: {condition.specialistReferral.type}
                        </p>
                        <p className="text-sm text-orange-600">
                          Reason: {condition.specialistReferral.reason}
                        </p>
                      </div>
                    )}
                    <div>
                      <h5 className="text-sm font-medium mb-1">
                        Recommendations:
                      </h5>
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {condition.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Specialized Analysis</h3>
              <Accordion type="single" collapsible className="border rounded-lg">
                {Object.entries(predictMutation.data.aiDomains).map(([domain, findings]) =>
                  renderAIDomainFindings(domain, findings)
                )}
              </Accordion>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Additional Information Needed</h3>
              <ul className="list-disc list-inside text-gray-600">
                {predictMutation.data.followUpQuestions.map((question, index) => (
                  <li key={index}>{question}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">General Recommendations</h3>
              <p className="text-gray-600">{predictMutation.data.generalAdvice}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {predictMutation.isError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Analysis Error</AlertTitle>
          <AlertDescription>
            {predictMutation.error.message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}