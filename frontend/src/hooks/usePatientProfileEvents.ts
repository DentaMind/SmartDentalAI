import { useEventCollector } from './useEventCollector';

interface PatientProfileEventMetadata {
  patientId?: number;
  userId?: number;
  originalValue?: any;
  newValue?: any;
  reason?: string;
  source?: 'user' | 'system' | 'ai';
  documentId?: number;
  documentType?: string;
  appointmentId?: number;
  insuranceId?: number;
}

export function usePatientProfileEvents() {
  const { collectEvent } = useEventCollector();

  const collectProfileCreated = (
    patientId: number,
    metadata: PatientProfileEventMetadata = {}
  ) => {
    return collectEvent('patient_profile_created', {
      patient_id: patientId,
      ...metadata
    });
  };

  const collectProfileUpdated = (
    patientId: number,
    metadata: PatientProfileEventMetadata = {}
  ) => {
    return collectEvent('patient_profile_updated', {
      patient_id: patientId,
      ...metadata
    });
  };

  const collectProfileArchived = (
    patientId: number,
    reason: string,
    metadata: PatientProfileEventMetadata = {}
  ) => {
    return collectEvent('patient_profile_archived', {
      patient_id: patientId,
      archive_reason: reason,
      ...metadata
    });
  };

  const collectDocumentUploaded = (
    patientId: number,
    documentType: string,
    metadata: PatientProfileEventMetadata = {}
  ) => {
    return collectEvent('patient_document_uploaded', {
      patient_id: patientId,
      document_type: documentType,
      ...metadata
    });
  };

  const collectDocumentViewed = (
    patientId: number,
    documentId: number,
    metadata: PatientProfileEventMetadata = {}
  ) => {
    return collectEvent('patient_document_viewed', {
      patient_id: patientId,
      document_id: documentId,
      ...metadata
    });
  };

  const collectDocumentShared = (
    patientId: number,
    documentId: number,
    recipientId: number,
    metadata: PatientProfileEventMetadata = {}
  ) => {
    return collectEvent('patient_document_shared', {
      patient_id: patientId,
      document_id: documentId,
      recipient_id: recipientId,
      ...metadata
    });
  };

  const collectAppointmentScheduled = (
    patientId: number,
    appointmentId: number,
    metadata: PatientProfileEventMetadata = {}
  ) => {
    return collectEvent('patient_appointment_scheduled', {
      patient_id: patientId,
      appointment_id: appointmentId,
      ...metadata
    });
  };

  const collectAppointmentRescheduled = (
    patientId: number,
    appointmentId: number,
    metadata: PatientProfileEventMetadata = {}
  ) => {
    return collectEvent('patient_appointment_rescheduled', {
      patient_id: patientId,
      appointment_id: appointmentId,
      ...metadata
    });
  };

  const collectAppointmentCancelled = (
    patientId: number,
    appointmentId: number,
    reason: string,
    metadata: PatientProfileEventMetadata = {}
  ) => {
    return collectEvent('patient_appointment_cancelled', {
      patient_id: patientId,
      appointment_id: appointmentId,
      cancellation_reason: reason,
      ...metadata
    });
  };

  const collectInsuranceUpdated = (
    patientId: number,
    insuranceId: number,
    metadata: PatientProfileEventMetadata = {}
  ) => {
    return collectEvent('patient_insurance_updated', {
      patient_id: patientId,
      insurance_id: insuranceId,
      ...metadata
    });
  };

  const collectConsentFormSigned = (
    patientId: number,
    formType: string,
    metadata: PatientProfileEventMetadata = {}
  ) => {
    return collectEvent('patient_consent_form_signed', {
      patient_id: patientId,
      form_type: formType,
      ...metadata
    });
  };

  const collectPreferencesUpdated = (
    patientId: number,
    metadata: PatientProfileEventMetadata = {}
  ) => {
    return collectEvent('patient_preferences_updated', {
      patient_id: patientId,
      ...metadata
    });
  };

  return {
    collectProfileCreated,
    collectProfileUpdated,
    collectProfileArchived,
    collectDocumentUploaded,
    collectDocumentViewed,
    collectDocumentShared,
    collectAppointmentScheduled,
    collectAppointmentRescheduled,
    collectAppointmentCancelled,
    collectInsuranceUpdated,
    collectConsentFormSigned,
    collectPreferencesUpdated
  };
} 