import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DiagnosisFeedbackPanel from "./DiagnosisFeedbackPanel";
import PatientTreatmentEditor from "./PatientTreatmentEditor";
import TreatmentPlanEditor from "./TreatmentPlanEditor";
import { Brain, ClipboardCheck, FileText } from "lucide-react";

interface AIHubPanelProps {
  patientId: string;
}

export default function AIHubPanel({ patientId }: AIHubPanelProps) {
  const [activeTab, setActiveTab] = useState("diagnosis");
  const [diagnosisComplete, setDiagnosisComplete] = useState(false);

  const handleDiagnosisComplete = () => {
    setDiagnosisComplete(true);
    // Automatically switch to treatment tab when diagnosis is complete
    setActiveTab("treatment");
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold mb-2">AI Diagnostic & Treatment Hub</h2>
        <p className="text-muted-foreground">
          AI-assisted diagnosis and treatment planning based on patient data analysis
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="diagnosis" className="flex items-center gap-1">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">Diagnosis</span>
            <span className="inline sm:hidden">Diag</span>
          </TabsTrigger>
          <TabsTrigger 
            value="treatment" 
            className="flex items-center gap-1"
            disabled={!diagnosisComplete && activeTab !== "treatment"}
          >
            <ClipboardCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Treatment Plan</span>
            <span className="inline sm:hidden">Plan</span>
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Notes & Documentation</span>
            <span className="inline sm:hidden">Notes</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="diagnosis" className="mt-4">
          <DiagnosisFeedbackPanel 
            patientId={patientId} 
            onDiagnosisComplete={handleDiagnosisComplete}
          />
        </TabsContent>

        <TabsContent value="treatment" className="mt-4">
          <TreatmentPlanEditor patientId={patientId} />
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <div className="p-4 border rounded-md bg-muted/30">
            <h3 className="text-lg font-medium mb-2">Clinical Documentation</h3>
            <p className="text-muted-foreground mb-4">
              View and manage AI-generated clinical notes based on the diagnosis and treatment plan.
            </p>
            
            {/* Placeholder for notes component */}
            <div className="border rounded-md p-4 bg-background">
              <p className="text-center text-muted-foreground">
                Documentation features will be displayed here.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}