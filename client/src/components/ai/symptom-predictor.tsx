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
import { Loader2, AlertTriangle, Clock, ThermometerSun } from "lucide-react";
import { predictDentalCondition, type SymptomPrediction, type PredictionContext } from "@/lib/ai-predictor";

interface Props {
  patientHistory?: string;
  vitalSigns?: PredictionContext["vitalSigns"];
  relevantTests?: PredictionContext["relevantTests"];
}

export function SymptomPredictor({ patientHistory, vitalSigns, relevantTests }: Props) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [symptoms, setSymptoms] = useState("");

  const predictMutation = useMutation({
    mutationFn: async (symptoms: string) => {
      if (!symptoms.trim()) {
        throw new Error("Please describe the symptoms in detail");
      }
      return await predictDentalCondition({
        symptoms,
        patientHistory,
        vitalSigns,
        relevantTests
      });
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ThermometerSun className="h-5 w-5 text-primary" />
            {t("ai.symptoms")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Describe the symptoms in detail, including:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Type and duration of pain (sharp, dull, lingering)</li>
                <li>X-ray findings (radiolucency, bone loss)</li>
                <li>Clinical observations (swelling, mobility)</li>
                <li>Relevant tooth numbers</li>
              </ul>
            </p>
          </div>
          <Textarea
            placeholder="Example: Lingering pain and radiolucency on tooth #30, sensitive to cold, pain lasting 30 seconds after stimulus"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            className="min-h-[100px] mb-4"
          />
          <div className="flex gap-2 items-center text-sm text-muted-foreground mb-4">
            <Clock className="h-4 w-4" />
            <span>AI analysis usually takes 2-3 seconds</span>
          </div>
          <Button
            className="w-full"
            onClick={() => predictMutation.mutate(symptoms)}
            disabled={!symptoms.trim() || predictMutation.isPending}
          >
            {predictMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("ai.loading")}
              </>
            ) : (
              t("ai.analyze")
            )}
          </Button>
        </CardContent>
      </Card>

      {predictMutation.data && (
        <Card>
          <CardHeader>
            <CardTitle>{t("ai.results")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">{t("ai.possibleConditions")}</h3>
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
                        {t("ai.confidence")}: {Math.round(condition.confidence * 100)}%
                      </span>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium mb-1">
                        {t("ai.recommendations")}:
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
              <h3 className="font-semibold mb-2">
                {t("ai.followUpQuestions")}
              </h3>
              <ul className="list-disc list-inside text-gray-600">
                {predictMutation.data.followUpQuestions.map((question, index) => (
                  <li key={index}>{question}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">{t("ai.generalAdvice")}</h3>
              <p className="text-gray-600">{predictMutation.data.generalAdvice}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {predictMutation.isError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t("ai.error")}</AlertTitle>
          <AlertDescription>
            {predictMutation.error.message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}