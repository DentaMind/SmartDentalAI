import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Upload } from "lucide-react";

type AIDiagnosisProps = {
  patientId: number;
};

export default function AIDiagnosis({ patientId }: AIDiagnosisProps) {
  const [symptoms, setSymptoms] = useState("");
  const [xrayImage, setXrayImage] = useState<string | null>(null);

  const diagnosisMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai/diagnosis", {
        symptoms,
        xrayImage,
        patientId,
      });
      return res.json();
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setXrayImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Diagnostic Assistant</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Symptoms</label>
            <Textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Describe the symptoms..."
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">X-Ray Image (optional)</label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center">
              {xrayImage ? (
                <img
                  src={xrayImage}
                  alt="X-Ray preview"
                  className="max-h-48 mx-auto"
                />
              ) : (
                <label className="cursor-pointer block">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Click to upload X-Ray
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              )}
            </div>
          </div>

          <Button
            onClick={() => diagnosisMutation.mutate()}
            disabled={!symptoms || diagnosisMutation.isPending}
            className="w-full"
          >
            {diagnosisMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Generate Diagnosis
          </Button>
        </CardContent>
      </Card>

      {diagnosisMutation.data && (
        <Card>
          <CardHeader>
            <CardTitle>AI Diagnosis Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Diagnosis</h3>
              <p>{diagnosisMutation.data.diagnosis}</p>
            </div>

            <div>
              <h3 className="font-medium mb-2">Confidence Level</h3>
              <Progress
                value={diagnosisMutation.data.confidence * 100}
                className="h-2"
              />
              <p className="text-sm text-muted-foreground mt-1">
                {Math.round(diagnosisMutation.data.confidence * 100)}% confident
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-2">Recommendations</h3>
              <ul className="list-disc pl-4 space-y-1">
                {diagnosisMutation.data.recommendations.map((rec: string, i: number) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
