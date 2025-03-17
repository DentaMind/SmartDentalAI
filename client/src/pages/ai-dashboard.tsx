import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import { SymptomPredictor } from "@/components/ai/symptom-predictor";
import { XrayAnalyzer } from "@/components/ai/xray-analyzer";
import { AITreatmentPlanner } from "@/components/treatment/ai-treatment-planner";
import { AIStatusPanel } from "@/components/ai/ai-status-panel";
import { 
  Stethoscope, 
  FileImage, 
  ClipboardList, 
  Brain, 
  Calculator, 
  Server,
  Activity
} from "lucide-react";

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
            {t("ai.dashboard.title", "Smart Dental AI")}
          </span>
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("ai.dashboard.subtitle", "AI-powered dental diagnostics and treatment planning")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid grid-cols-5 mb-6 w-full">
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
              <TabsTrigger value="cost" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                <span>Cost Analysis</span>
              </TabsTrigger>
              <TabsTrigger value="system" className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                <span>AI Status</span>
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
              <AITreatmentPlanner 
                diagnosis={diagnosis}
                patientHistory="Patient has history of hypertension and takes metoprolol. Previous root canal on #19. Regular dental visits every 6 months."
              />
            </TabsContent>

            <TabsContent value="cost" className="space-y-5">
              {diagnosis && (
                <AITreatmentPlanner 
                  diagnosis={diagnosis}
                  patientHistory="Patient has history of hypertension and takes metoprolol. Previous root canal on #19. Regular dental visits every 6 months."
                  mode="cost-analysis"
                />
              )}
            </TabsContent>

            <TabsContent value="system" className="space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-primary" />
                    AI Performance Metrics
                  </h2>
                  <div className="p-6 border rounded-lg bg-card text-card-foreground">
                    <p className="text-sm text-muted-foreground mb-4">
                      View real-time performance metrics for Smart Dental AI systems, including accuracy rates, processing times, and usage statistics.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border rounded p-4 text-center">
                        <div className="text-3xl font-bold text-primary">94.8%</div>
                        <div className="text-sm text-muted-foreground">Diagnostic Accuracy</div>
                      </div>
                      <div className="border rounded p-4 text-center">
                        <div className="text-3xl font-bold text-primary">2.3s</div>
                        <div className="text-sm text-muted-foreground">Average Response Time</div>
                      </div>
                      <div className="border rounded p-4 text-center">
                        <div className="text-3xl font-bold text-primary">1,248</div>
                        <div className="text-sm text-muted-foreground">X-rays Processed</div>
                      </div>
                      <div className="border rounded p-4 text-center">
                        <div className="text-3xl font-bold text-primary">98.2%</div>
                        <div className="text-sm text-muted-foreground">System Uptime</div>
                      </div>
                    </div>
                  </div>
                </div>
                <AIStatusPanel />
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="hidden md:block">
          <AIStatusPanel />
        </div>
      </div>
    </div>
  );
}

export default AIDashboardPage;