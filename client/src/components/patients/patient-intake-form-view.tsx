import React from 'react';
import { useParams } from 'react-router-dom';
import { AITriageResults } from './ai-triage-results';
import { AiTriageTimeline } from './ai-triage-timeline';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function PatientIntakeFormView() {
  const { formId, patientId } = useParams<{ formId: string; patientId: string }>();

  if (!formId || !patientId) {
    return <div>Missing form or patient ID</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="current">
        <TabsList>
          <TabsTrigger value="current">Current Analysis</TabsTrigger>
          <TabsTrigger value="history">Triage History</TabsTrigger>
        </TabsList>
        <TabsContent value="current">
          <AITriageResults />
        </TabsContent>
        <TabsContent value="history">
          <AiTriageTimeline patientId={parseInt(patientId)} />
        </TabsContent>
      </Tabs>
    </div>
  );
} 