import { useEvents, EventMetadata } from './useEvents';

interface ConsentEventMetadata {
  patientId?: number;
  userId?: number;
  originalValue?: any;
  newValue?: any;
  reason?: string;
  source?: 'user' | 'system' | 'ai';
  consentId?: number;
  consentType?: string;
  documentId?: number;
  documentType?: string;
  expirationDate?: string;
}

export const useConsentEvents = () => {
  const { collectEvent } = useEvents();

  const collectConsentRevoked = async (
    patientId: number,
    consentId: number,
    reason: string,
    metadata: Partial<EventMetadata> = {}
  ) => {
    await collectEvent('consent.revoked', {
      patientId,
      consentId,
      reason
    }, metadata);
  };

  const collectConsentExpired = async (
    patientId: number,
    consentId: number,
    metadata: Partial<EventMetadata> = {}
  ) => {
    await collectEvent('consent.expired', {
      patientId,
      consentId
    }, metadata);
  };

  const collectConsentRenewed = async (
    patientId: number,
    consentId: number,
    metadata: Partial<EventMetadata> = {}
  ) => {
    await collectEvent('consent.renewed', {
      patientId,
      consentId
    }, metadata);
  };

  const collectConsentDocumentUploaded = async (
    patientId: number,
    consentId: number,
    documentId: number,
    documentType: string,
    metadata: Partial<EventMetadata> = {}
  ) => {
    await collectEvent('consent.document.uploaded', {
      patientId,
      consentId,
      documentId,
      documentType
    }, metadata);
  };

  const collectConsentDocumentViewed = async (
    patientId: number,
    consentId: number,
    documentId: number,
    metadata: Partial<EventMetadata> = {}
  ) => {
    await collectEvent('consent.document.viewed', {
      patientId,
      consentId,
      documentId
    }, metadata);
  };

  return {
    collectConsentRevoked,
    collectConsentExpired,
    collectConsentRenewed,
    collectConsentDocumentUploaded,
    collectConsentDocumentViewed
  };
}; 