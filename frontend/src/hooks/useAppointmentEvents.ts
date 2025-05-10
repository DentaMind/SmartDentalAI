import { useEvents, EventMetadata } from './useEvents';

export const useAppointmentEvents = () => {
  const { collectEvent } = useEvents();

  const collectAppointmentScheduled = async (
    patientId: number,
    appointmentId: number,
    metadata: Partial<EventMetadata> & {
      startTime: string;
      duration: number;
      type: string;
      providerId: string;
    }
  ) => {
    await collectEvent('appointment.scheduled', {
      patientId,
      appointmentId,
      startTime: metadata.startTime,
      duration: metadata.duration,
      type: metadata.type,
      providerId: metadata.providerId
    }, metadata);
  };

  const collectAppointmentRescheduled = async (
    patientId: number,
    appointmentId: number,
    metadata: Partial<EventMetadata> & {
      oldStartTime: string;
      newStartTime: string;
    }
  ) => {
    await collectEvent('appointment.rescheduled', {
      patientId,
      appointmentId,
      oldStartTime: metadata.oldStartTime,
      newStartTime: metadata.newStartTime
    }, metadata);
  };

  const collectAppointmentCancelled = async (
    patientId: number,
    appointmentId: number,
    metadata: Partial<EventMetadata> & {
      reason: string;
    }
  ) => {
    await collectEvent('appointment.cancelled', {
      patientId,
      appointmentId,
      reason: metadata.reason
    }, metadata);
  };

  const collectAppointmentCompleted = async (
    patientId: number,
    appointmentId: number,
    metadata: Partial<EventMetadata> & {
      duration: number;
      procedures: string[];
    }
  ) => {
    await collectEvent('appointment.completed', {
      patientId,
      appointmentId,
      duration: metadata.duration,
      procedures: metadata.procedures
    }, metadata);
  };

  const collectAppointmentNoShow = async (
    patientId: number,
    appointmentId: number,
    metadata: Partial<EventMetadata> = {}
  ) => {
    await collectEvent('appointment.noshow', {
      patientId,
      appointmentId
    }, metadata);
  };

  const collectAppointmentReminder = async (
    patientId: number,
    appointmentId: number,
    metadata: Partial<EventMetadata> & {
      method: 'sms' | 'email' | 'call';
      status: 'sent' | 'failed' | 'delivered';
    }
  ) => {
    await collectEvent('appointment.reminder', {
      patientId,
      appointmentId,
      method: metadata.method,
      status: metadata.status
    }, metadata);
  };

  const collectAppointmentConfirmed = async (
    patientId: number,
    appointmentId: number,
    metadata: Partial<EventMetadata> & {
      method: 'sms' | 'email' | 'call' | 'portal';
    }
  ) => {
    await collectEvent('appointment.confirmed', {
      patientId,
      appointmentId,
      method: metadata.method
    }, metadata);
  };

  return {
    collectAppointmentScheduled,
    collectAppointmentRescheduled,
    collectAppointmentCancelled,
    collectAppointmentCompleted,
    collectAppointmentNoShow,
    collectAppointmentReminder,
    collectAppointmentConfirmed
  };
}; 