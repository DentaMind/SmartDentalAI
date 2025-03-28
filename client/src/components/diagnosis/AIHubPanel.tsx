import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import DiagnosisFeedbackPanel from "./DiagnosisFeedbackPanel";
import PatientTreatmentEditor from "./PatientTreatmentEditor";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface AIHubPanelProps {
  patientId: string;
}

export default function AIHubPanel({ patientId }: AIHubPanelProps) {
  const [activeTab, setActiveTab] = useState("diagnosis");

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>DentaMind AI Hub</CardTitle>
        <CardDescription>
          AI-powered diagnosis and treatment planning with provider oversight
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="diagnosis" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="diagnosis">AI Diagnosis</TabsTrigger>
            <TabsTrigger value="treatment">Treatment Plan</TabsTrigger>
            <TabsTrigger value="history">AI History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="diagnosis">
            <DiagnosisFeedbackPanel patientId={patientId} onDiagnosisComplete={() => setActiveTab("treatment")} />
          </TabsContent>
          
          <TabsContent value="treatment">
            <PatientTreatmentEditor patientId={patientId} />
          </TabsContent>
          
          <TabsContent value="history">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">AI Interaction History</h3>
              <p className="text-muted-foreground text-sm">
                Track all AI-generated diagnoses and treatment plans along with provider feedback and modifications.
              </p>
              <div className="border rounded-md p-4 text-center text-muted-foreground">
                AI history will appear here after diagnoses and treatment plans are created and reviewed.
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}