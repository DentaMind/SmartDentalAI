import { useEventCollector } from './useEventCollector';

interface PatientEventMetadata {
  userId?: number;
  originalValue?: any;
  newValue?: any;
  reason?: string;
  source?: 'user' | 'system' | 'ai';
  appointmentId?: number;
  appointmentType?: string;
  insuranceId?: number;
  insuranceType?: string;
  documentId?: number;
  documentType?: string;
  consentId?: number;
  consentType?: string;
  billingId?: number;
  billingType?: string;
  communicationId?: number;
  communicationType?: string;
}

export function usePatientEvents() {
  const { collectEvent } = useEventCollector();

  const collectPatientCreated = (
    patientId: number,
    metadata: PatientEventMetadata = {}
  ) => {
    return collectEvent('patient_created', {
      patient_id: patientId,
      ...metadata
    });
  };

  const collectPatientUpdated = (
    patientId: number,
    metadata: PatientEventMetadata = {}
  ) => {
    return collectEvent('patient_updated', {
      patient_id: patientId,
      ...metadata
    });
  };

  const collectPatientArchived = (
    patientId: number,
    reason: string,
    metadata: PatientEventMetadata = {}
  ) => {
    return collectEvent('patient_archived', {
      patient_id: patientId,
      archival_reason: reason,
      ...metadata
    });
  };

  const collectAppointmentScheduled = (
    patientId: number,
    appointmentId: number,
    appointmentType: string,
    metadata: PatientEventMetadata = {}
  ) => {
    return collectEvent('patient_appointment_scheduled', {
      patient_id: patientId,
      appointment_id: appointmentId,
      appointment_type: appointmentType,
      ...metadata
    });
  };

  const collectAppointmentUpdated = (
    patientId: number,
    appointmentId: number,
    metadata: PatientEventMetadata = {}
  ) => {
    return collectEvent('patient_appointment_updated', {
      patient_id: patientId,
      appointment_id: appointmentId,
      ...metadata
    });
  };

  const collectAppointmentCancelled = (
    patientId: number,
    appointmentId: number,
    reason: string,
    metadata: PatientEventMetadata = {}
  ) => {
    return collectEvent('patient_appointment_cancelled', {
      patient_id: patientId,
      appointment_id: appointmentId,
      cancellation_reason: reason,
      ...metadata
    });
  };

  const collectInsuranceAdded = (
    patientId: number,
    insuranceId: number,
    insuranceType: string,
    metadata: PatientEventMetadata = {}
  ) => {
    return collectEvent('patient_insurance_added', {
      patient_id: patientId,
      insurance_id: insuranceId,
      insurance_type: insuranceType,
      ...metadata
    });
  };

  const collectInsuranceUpdated = (
    patientId: number,
    insuranceId: number,
    metadata: PatientEventMetadata = {}
  ) => {
    return collectEvent('patient_insurance_updated', {
      patient_id: patientId,
      insurance_id: insuranceId,
      ...metadata
    });
  };

  const collectDocumentUploaded = (
    patientId: number,
    documentId: number,
    documentType: string,
    metadata: PatientEventMetadata = {}
  ) => {
    return collectEvent('patient_document_uploaded', {
      patient_id: patientId,
      document_id: documentId,
      document_type: documentType,
      ...metadata
    });
  };

  const collectDocumentUpdated = (
    patientId: number,
    documentId: number,
    metadata: PatientEventMetadata = {}
  ) => {
    return collectEvent('patient_document_updated', {
      patient_id: patientId,
      document_id: documentId,
      ...metadata
    });
  };

  const collectConsentAdded = (
    patientId: number,
    consentId: number,
    consentType: string,
    metadata: PatientEventMetadata = {}
  ) => {
    return collectEvent('patient_consent_added', {
      patient_id: patientId,
      consent_id: consentId,
      consent_type: consentType,
      ...metadata
    });
  };

  const collectConsentUpdated = (
    patientId: number,
    consentId: number,
    metadata: PatientEventMetadata = {}
  ) => {
    return collectEvent('patient_consent_updated', {
      patient_id: patientId,
      consent_id: consentId,
      ...metadata
    });
  };

  const collectBillingCreated = (
    patientId: number,
    billingId: number,
    billingType: string,
    metadata: PatientEventMetadata = {}
  ) => {
    return collectEvent('patient_billing_created', {
      patient_id: patientId,
      billing_id: billingId,
      billing_type: billingType,
      ...metadata
    });
  };

  const collectBillingUpdated = (
    patientId: number,
    billingId: number,
    metadata: PatientEventMetadata = {}
  ) => {
    return collectEvent('patient_billing_updated', {
      patient_id: patientId,
      billing_id: billingId,
      ...metadata
    });
  };

  const collectCommunicationSent = (
    patientId: number,
    communicationId: number,
    communicationType: string,
    metadata: PatientEventMetadata = {}
  ) => {
    return collectEvent('patient_communication_sent', {
      patient_id: patientId,
      communication_id: communicationId,
      communication_type: communicationType,
      ...metadata
    });
  };

  const collectCommunicationUpdated = (
    patientId: number,
    communicationId: number,
    metadata: PatientEventMetadata = {}
  ) => {
    return collectEvent('patient_communication_updated', {
      patient_id: patientId,
      communication_id: communicationId,
      ...metadata
    });
  };

  return {
    collectPatientCreated,
    collectPatientUpdated,
    collectPatientArchived,
    collectAppointmentScheduled,
    collectAppointmentUpdated,
    collectAppointmentCancelled,
    collectInsuranceAdded,
    collectInsuranceUpdated,
    collectDocumentUploaded,
    collectDocumentUpdated,
    collectConsentAdded,
    collectConsentUpdated,
    collectBillingCreated,
    collectBillingUpdated,
    collectCommunicationSent,
    collectCommunicationUpdated
  };
} 