import React from 'react';
import { useTreatmentPlanEvents } from '@/hooks/useTreatmentPlanEvents';
// ... existing imports ...

export const TreatmentPlan: React.FC<{ patientId: number; planId: number }> = ({ patientId, planId }) => {
  const {
    collectPlanUpdated,
    collectPlanArchived,
    collectProcedureAdded,
    collectProcedureUpdated,
    collectProcedureRemoved,
    collectEstimateGenerated,
    collectEstimateUpdated,
    collectNoteAdded,
    collectNoteUpdated,
    collectAttachmentAdded,
    collectAttachmentRemoved,
    collectPlanShared
  } = useTreatmentPlanEvents();

  const { data: plan, isLoading } = useQuery<TreatmentPlan>(
    ['treatmentPlan', planId],
    () => fetchTreatmentPlan(planId)
  );

  const handlePlanUpdate = async (updates: Partial<TreatmentPlan>) => {
    try {
      const response = await apiRequest('PATCH', `/api/treatment-plans/${planId}`, updates);
      await collectPlanUpdated(patientId, planId, {
        originalValue: plan,
        newValue: { ...plan, ...updates },
        source: 'user'
      });
      queryClient.invalidateQueries(['treatmentPlan', planId]);
    } catch (error) {
      console.error('Failed to update plan:', error);
    }
  };

  const handlePlanArchive = async (reason: string) => {
    try {
      const response = await apiRequest('POST', `/api/treatment-plans/${planId}/archive`, { reason });
      await collectPlanArchived(patientId, planId, reason, { source: 'user' });
      queryClient.invalidateQueries(['treatmentPlan', planId]);
    } catch (error) {
      console.error('Failed to archive plan:', error);
    }
  };

  const handleProcedureAdd = async (procedureDetails: any) => {
    try {
      const response = await apiRequest('POST', `/api/treatment-plans/${planId}/procedures`, procedureDetails);
      await collectProcedureAdded(patientId, planId, procedureDetails.type, {
        procedureId: response.data.procedureId,
        source: 'user'
      });
      queryClient.invalidateQueries(['treatmentPlan', planId]);
    } catch (error) {
      console.error('Failed to add procedure:', error);
    }
  };

  const handleProcedureUpdate = async (procedureId: number, updates: any) => {
    try {
      const response = await apiRequest('PATCH', `/api/treatment-plans/${planId}/procedures/${procedureId}`, updates);
      await collectProcedureUpdated(patientId, planId, procedureId, {
        originalValue: plan?.procedures?.find(p => p.id === procedureId),
        newValue: updates,
        source: 'user'
      });
      queryClient.invalidateQueries(['treatmentPlan', planId]);
    } catch (error) {
      console.error('Failed to update procedure:', error);
    }
  };

  const handleProcedureRemove = async (procedureId: number, reason: string) => {
    try {
      const response = await apiRequest('DELETE', `/api/treatment-plans/${planId}/procedures/${procedureId}`, { reason });
      await collectProcedureRemoved(patientId, planId, procedureId, reason, {
        source: 'user'
      });
      queryClient.invalidateQueries(['treatmentPlan', planId]);
    } catch (error) {
      console.error('Failed to remove procedure:', error);
    }
  };

  const handleEstimateGenerate = async () => {
    try {
      const response = await apiRequest('POST', `/api/treatment-plans/${planId}/estimates`);
      await collectEstimateGenerated(patientId, planId, response.data.estimateId, {
        source: 'user'
      });
      queryClient.invalidateQueries(['treatmentPlan', planId]);
    } catch (error) {
      console.error('Failed to generate estimate:', error);
    }
  };

  const handleEstimateUpdate = async (estimateId: number, updates: any) => {
    try {
      const response = await apiRequest('PATCH', `/api/treatment-plans/${planId}/estimates/${estimateId}`, updates);
      await collectEstimateUpdated(patientId, planId, estimateId, {
        originalValue: plan?.estimates?.find(e => e.id === estimateId),
        newValue: updates,
        source: 'user'
      });
      queryClient.invalidateQueries(['treatmentPlan', planId]);
    } catch (error) {
      console.error('Failed to update estimate:', error);
    }
  };

  const handleNoteAdd = async (noteContent: string) => {
    try {
      const response = await apiRequest('POST', `/api/treatment-plans/${planId}/notes`, { content: noteContent });
      await collectNoteAdded(patientId, planId, response.data.noteId, {
        source: 'user'
      });
      queryClient.invalidateQueries(['treatmentPlan', planId]);
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  };

  const handleNoteUpdate = async (noteId: number, updates: any) => {
    try {
      const response = await apiRequest('PATCH', `/api/treatment-plans/${planId}/notes/${noteId}`, updates);
      await collectNoteUpdated(patientId, planId, noteId, {
        originalValue: plan?.notes?.find(n => n.id === noteId),
        newValue: updates,
        source: 'user'
      });
      queryClient.invalidateQueries(['treatmentPlan', planId]);
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  };

  const handleAttachmentAdd = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiRequest('POST', `/api/treatment-plans/${planId}/attachments`, formData);
      await collectAttachmentAdded(patientId, planId, response.data.attachmentId, {
        source: 'user'
      });
      queryClient.invalidateQueries(['treatmentPlan', planId]);
    } catch (error) {
      console.error('Failed to add attachment:', error);
    }
  };

  const handleAttachmentRemove = async (attachmentId: number, reason: string) => {
    try {
      const response = await apiRequest('DELETE', `/api/treatment-plans/${planId}/attachments/${attachmentId}`, { reason });
      await collectAttachmentRemoved(patientId, planId, attachmentId, reason, {
        source: 'user'
      });
      queryClient.invalidateQueries(['treatmentPlan', planId]);
    } catch (error) {
      console.error('Failed to remove attachment:', error);
    }
  };

  const handlePlanShare = async (recipientId: number) => {
    try {
      const response = await apiRequest('POST', `/api/treatment-plans/${planId}/share`, { recipientId });
      await collectPlanShared(patientId, planId, recipientId, {
        source: 'user'
      });
    } catch (error) {
      console.error('Failed to share plan:', error);
    }
  };

  // ... rest of the component code ...

  return (
    // ... existing JSX ...
  );
}; 