import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Loader2, AlertTriangle } from "lucide-react";

interface SymptomPrediction {
  possibleConditions: Array<{
    condition: string;
    confidence: number;
    description: string;
    recommendations: string[];
    urgencyLevel: "low" | "medium" | "high" | "emergency";
  }>;
  followUpQuestions: string[];
  generalAdvice: string;
}

export function SymptomPredictor({ patientHistory }: { patientHistory?: string }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [symptoms, setSymptoms] = useState("");

  const predictMutation = useMutation({
    mutationFn: async (symptoms: string) => {
      const res = await apiRequest("POST", "/api/ai/predict", {
        symptoms,
        patientHistory,
      });
      return res.json() as Promise<SymptomPrediction>;
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
          <CardTitle>{t("ai.symptoms")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder={t("ai.enterSymptoms")}
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            className="min-h-[100px]"
          />
          <Button
            className="mt-4 w-full"
            onClick={() => predictMutation.mutate(symptoms)}
            disabled={!symptoms || predictMutation.isPending}
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
                      <span className={getUrgencyColor(condition.urgencyLevel)}>
                        {condition.urgencyLevel.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {condition.description}
                    </p>
                    <div className="mb-2">
                      <span className="text-sm font-medium">
                        {t("ai.confidence")}:{" "}
                      </span>
                      <span>{Math.round(condition.confidence * 100)}%</span>
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
