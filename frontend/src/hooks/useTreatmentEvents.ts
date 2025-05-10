import { useEvents, EventMetadata } from './useEvents';

export const useTreatmentEvents = () => {
  const { collectEvent } = useEvents();

  const collectTreatmentPlanCreated = async (
    patientId: number,
    planId: number,
    metadata: Partial<EventMetadata> & {
      procedures: Array<{
        code: string;
        tooth?: string;
        surface?: string;
        quadrant?: string;
      }>;
      totalCost: number;
      phaseCount: number;
    }
  ) => {
    await collectEvent('treatment.plan.created', {
      patientId,
      planId,
      procedures: metadata.procedures,
      totalCost: metadata.totalCost,
      phaseCount: metadata.phaseCount
    }, metadata);
  };

  const collectTreatmentPlanUpdated = async (
    patientId: number,
    planId: number,
    metadata: Partial<EventMetadata> & {
      changes: Array<{
        type: 'add' | 'remove' | 'modify';
        procedure: {
          code: string;
          tooth?: string;
          surface?: string;
          quadrant?: string;
        };
      }>;
    }
  ) => {
    await collectEvent('treatment.plan.updated', {
      patientId,
      planId,
      changes: metadata.changes
    }, metadata);
  };

  const collectTreatmentPhaseCompleted = async (
    patientId: number,
    planId: number,
    phaseId: number,
    metadata: Partial<EventMetadata> & {
      completedProcedures: string[];
      nextPhaseId?: number;
    }
  ) => {
    await collectEvent('treatment.phase.completed', {
      patientId,
      planId,
      phaseId,
      completedProcedures: metadata.completedProcedures,
      nextPhaseId: metadata.nextPhaseId
    }, metadata);
  };

  const collectProcedureStarted = async (
    patientId: number,
    procedureId: number,
    metadata: Partial<EventMetadata> & {
      code: string;
      tooth?: string;
      surface?: string;
      quadrant?: string;
      provider: string;
    }
  ) => {
    await collectEvent('treatment.procedure.started', {
      patientId,
      procedureId,
      code: metadata.code,
      tooth: metadata.tooth,
      surface: metadata.surface,
      quadrant: metadata.quadrant,
      provider: metadata.provider
    }, metadata);
  };

  const collectProcedureCompleted = async (
    patientId: number,
    procedureId: number,
    metadata: Partial<EventMetadata> & {
      duration: number;
      complications?: string[];
      notes?: string;
    }
  ) => {
    await collectEvent('treatment.procedure.completed', {
      patientId,
      procedureId,
      duration: metadata.duration,
      complications: metadata.complications,
      notes: metadata.notes
    }, metadata);
  };

  const collectTreatmentNoteAdded = async (
    patientId: number,
    planId: number,
    noteId: number,
    metadata: Partial<EventMetadata> & {
      type: 'clinical' | 'financial' | 'general';
      content: string;
    }
  ) => {
    await collectEvent('treatment.note.added', {
      patientId,
      planId,
      noteId,
      type: metadata.type,
      content: metadata.content
    }, metadata);
  };

  return {
    collectTreatmentPlanCreated,
    collectTreatmentPlanUpdated,
    collectTreatmentPhaseCompleted,
    collectProcedureStarted,
    collectProcedureCompleted,
    collectTreatmentNoteAdded
  };
}; 