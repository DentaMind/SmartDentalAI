import { useState } from "react";
import { useTranslation } from "react-i18next";
import { InteractiveDiagnosis } from "@/components/ai/interactive-diagnosis";
import { Brain, Stethoscope, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function InteractiveDiagnosisPage() {
  const { t } = useTranslation();
  const [patientId, setPatientId] = useState<number | null>(null);

  return (
    <div className="container mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Diagnostic Assistant</h1>
            <p className="text-muted-foreground">
              Interactive dental diagnosis with follow-up questions for more accurate results
            </p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href="/ai-hub">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to AI Hub
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <Stethoscope className="h-6 w-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-medium text-blue-800 text-lg mb-2">
                How the Interactive Diagnostic Works:
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Describe your dental symptoms in detail</li>
                <li>Our AI will analyze your symptoms and ask relevant follow-up questions</li>
                <li>Your answers help refine the diagnosis to be more accurate</li>
                <li>Receive a comprehensive diagnosis with confidence levels and recommendations</li>
              </ol>
              <div className="mt-4 text-sm text-blue-700">
                <strong>Note:</strong> This tool is designed to assist dentists, not replace professional dental care. 
                Always consult with your dentist for official diagnoses and treatment plans.
              </div>
            </div>
          </div>
        </div>

        <InteractiveDiagnosis />
      </div>
    </div>
  );
}