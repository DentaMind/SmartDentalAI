import { useEventCollector } from './useEventCollector';

interface TreatmentPlanEventMetadata {
  patientId?: number;
  userId?: number;
  planId?: number;
  originalValue?: any;
  newValue?: any;
  reason?: string;
  source?: 'user' | 'system' | 'ai';
  procedureId?: number;
  procedureType?: string;
  estimateId?: number;
  noteId?: number;
  attachmentId?: number;
}

export function useTreatmentPlanEvents() {
  const { collectEvent } = useEventCollector();

  const collectPlanCreated = (
    patientId: number,
    planId: number,
    metadata: TreatmentPlanEventMetadata = {}
  ) => {
    return collectEvent('treatment_plan_created', {
      patient_id: patientId,
      plan_id: planId,
      ...metadata
    });
  };

  const collectPlanUpdated = (
    patientId: number,
    planId: number,
    metadata: TreatmentPlanEventMetadata = {}
  ) => {
    return collectEvent('treatment_plan_updated', {
      patient_id: patientId,
      plan_id: planId,
      ...metadata
    });
  };

  const collectPlanArchived = (
    patientId: number,
    planId: number,
    reason: string,
    metadata: TreatmentPlanEventMetadata = {}
  ) => {
    return collectEvent('treatment_plan_archived', {
      patient_id: patientId,
      plan_id: planId,
      archive_reason: reason,
      ...metadata
    });
  };

  const collectProcedureAdded = (
    patientId: number,
    planId: number,
    procedureType: string,
    metadata: TreatmentPlanEventMetadata = {}
  ) => {
    return collectEvent('treatment_procedure_added', {
      patient_id: patientId,
      plan_id: planId,
      procedure_type: procedureType,
      ...metadata
    });
  };

  const collectProcedureUpdated = (
    patientId: number,
    planId: number,
    procedureId: number,
    metadata: TreatmentPlanEventMetadata = {}
  ) => {
    return collectEvent('treatment_procedure_updated', {
      patient_id: patientId,
      plan_id: planId,
      procedure_id: procedureId,
      ...metadata
    });
  };

  const collectProcedureRemoved = (
    patientId: number,
    planId: number,
    procedureId: number,
    reason: string,
    metadata: TreatmentPlanEventMetadata = {}
  ) => {
    return collectEvent('treatment_procedure_removed', {
      patient_id: patientId,
      plan_id: planId,
      procedure_id: procedureId,
      removal_reason: reason,
      ...metadata
    });
  };

  const collectEstimateGenerated = (
    patientId: number,
    planId: number,
    estimateId: number,
    metadata: TreatmentPlanEventMetadata = {}
  ) => {
    return collectEvent('treatment_estimate_generated', {
      patient_id: patientId,
      plan_id: planId,
      estimate_id: estimateId,
      ...metadata
    });
  };

  const collectEstimateUpdated = (
    patientId: number,
    planId: number,
    estimateId: number,
    metadata: TreatmentPlanEventMetadata = {}
  ) => {
    return collectEvent('treatment_estimate_updated', {
      patient_id: patientId,
      plan_id: planId,
      estimate_id: estimateId,
      ...metadata
    });
  };

  const collectNoteAdded = (
    patientId: number,
    planId: number,
    noteId: number,
    metadata: TreatmentPlanEventMetadata = {}
  ) => {
    return collectEvent('treatment_note_added', {
      patient_id: patientId,
      plan_id: planId,
      note_id: noteId,
      ...metadata
    });
  };

  const collectNoteUpdated = (
    patientId: number,
    planId: number,
    noteId: number,
    metadata: TreatmentPlanEventMetadata = {}
  ) => {
    return collectEvent('treatment_note_updated', {
      patient_id: patientId,
      plan_id: planId,
      note_id: noteId,
      ...metadata
    });
  };

  const collectAttachmentAdded = (
    patientId: number,
    planId: number,
    attachmentId: number,
    metadata: TreatmentPlanEventMetadata = {}
  ) => {
    return collectEvent('treatment_attachment_added', {
      patient_id: patientId,
      plan_id: planId,
      attachment_id: attachmentId,
      ...metadata
    });
  };

  const collectAttachmentRemoved = (
    patientId: number,
    planId: number,
    attachmentId: number,
    reason: string,
    metadata: TreatmentPlanEventMetadata = {}
  ) => {
    return collectEvent('treatment_attachment_removed', {
      patient_id: patientId,
      plan_id: planId,
      attachment_id: attachmentId,
      removal_reason: reason,
      ...metadata
    });
  };

  const collectPlanShared = (
    patientId: number,
    planId: number,
    recipientId: number,
    metadata: TreatmentPlanEventMetadata = {}
  ) => {
    return collectEvent('treatment_plan_shared', {
      patient_id: patientId,
      plan_id: planId,
      recipient_id: recipientId,
      ...metadata
    });
  };

  return {
    collectPlanCreated,
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
  };
} 