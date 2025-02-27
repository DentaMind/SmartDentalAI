
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import { SymptomPredictor } from "@/components/ai/symptom-predictor";
import { XrayAnalyzer } from "@/components/ai/xray-analyzer";
import { TreatmentPlanGenerator } from "@/components/ai/treatment-plan-generator";
import { Stethoscope, FileImage, ClipboardList, Calendar, Brain } from "lucide-react";

export function AIDashboardPage() {
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState("symptoms");
  const [diagnosis, setDiagnosis] = useState("");

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            {t("ai.dashboard.title", "DentaMind AI")}
          </span>
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("ai.dashboard.subtitle", "AI-powered dental diagnostics and treatment planning")}
        </p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-6 w-full md:w-[400px]">
          <TabsTrigger value="symptoms" className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            <span>Diagnosis</span>
          </TabsTrigger>
          <TabsTrigger value="xray" className="flex items-center gap-2">
            <FileImage className="h-4 w-4" />
            <span>X-rays</span>
          </TabsTrigger>
          <TabsTrigger value="treatment" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            <span>Treatment</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="symptoms" className="space-y-5">
          <SymptomPredictor 
            patientHistory="Patient has history of hypertension and takes metoprolol. Previous root canal on #19. Regular dental visits every 6 months."
            onDiagnosisGenerated={(diagnosisText) => {
              setDiagnosis(diagnosisText);
              // Automatically move to treatment tab after diagnosis
              setTimeout(() => setSelectedTab("treatment"), 500);
            }}
          />
        </TabsContent>

        <TabsContent value="xray" className="space-y-5">
          <XrayAnalyzer />
        </TabsContent>

        <TabsContent value="treatment" className="space-y-5">
          <TreatmentPlanGenerator 
            diagnosis={diagnosis}
            patientHistory="Patient has history of hypertension and takes metoprolol. Previous root canal on #19. Regular dental visits every 6 months."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AIDashboardPage;
