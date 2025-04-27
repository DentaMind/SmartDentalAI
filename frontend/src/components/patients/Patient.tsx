import React from 'react';
import { usePatientEvents } from '@/hooks/usePatientEvents';
import { useQuery } from 'react-query';
import { apiRequest } from '@/lib/apiRequest';
import { queryClient } from '@/lib/queryClient';

export const Patient: React.FC<{ patientId: number }> = ({ patientId }) => {
  const {
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
  } = usePatientEvents();

  const { data: patient, isLoading } = useQuery<Patient>(
    ['patient', patientId],
    () => fetchPatient(patientId)
  );

  const handlePatientUpdate = async (updates: Partial<Patient>) => {
    try {
      const response = await apiRequest('PATCH', `/api/patients/${patientId}`, updates);
      await collectPatientUpdated(patientId, {
        originalValue: patient,
        newValue: { ...patient, ...updates },
        source: 'user'
      });
      queryClient.invalidateQueries(['patient', patientId]);
    } catch (error) {
      console.error('Failed to update patient:', error);
    }
  };

  const handlePatientArchive = async (reason: string) => {
    try {
      const response = await apiRequest('POST', `/api/patients/${patientId}/archive`, { reason });
      await collectPatientArchived(patientId, reason, {
        source: 'user'
      });
      queryClient.invalidateQueries(['patient', patientId]);
    } catch (error) {
      console.error('Failed to archive patient:', error);
    }
  };

  const handleAppointmentSchedule = async (appointmentData: any) => {
    try {
      const response = await apiRequest('POST', `/api/patients/${patientId}/appointments`, appointmentData);
      await collectAppointmentScheduled(patientId, response.data.appointmentId, appointmentData.type, {
        source: 'user'
      });
      queryClient.invalidateQueries(['patient', patientId]);
    } catch (error) {
      console.error('Failed to schedule appointment:', error);
    }
  };

  const handleAppointmentUpdate = async (appointmentId: number, updates: any) => {
    try {
      const response = await apiRequest('PATCH', `/api/patients/${patientId}/appointments/${appointmentId}`, updates);
      await collectAppointmentUpdated(patientId, appointmentId, {
        originalValue: patient?.appointments?.find(a => a.id === appointmentId),
        newValue: updates,
        source: 'user'
      });
      queryClient.invalidateQueries(['patient', patientId]);
    } catch (error) {
      console.error('Failed to update appointment:', error);
    }
  };

  const handleAppointmentCancel = async (appointmentId: number, reason: string) => {
    try {
      const response = await apiRequest('POST', `/api/patients/${patientId}/appointments/${appointmentId}/cancel`, { reason });
      await collectAppointmentCancelled(patientId, appointmentId, reason, {
        source: 'user'
      });
      queryClient.invalidateQueries(['patient', patientId]);
    } catch (error) {
      console.error('Failed to cancel appointment:', error);
    }
  };

  const handleInsuranceAdd = async (insuranceData: any) => {
    try {
      const response = await apiRequest('POST', `/api/patients/${patientId}/insurance`, insuranceData);
      await collectInsuranceAdded(patientId, response.data.insuranceId, insuranceData.type, {
        source: 'user'
      });
      queryClient.invalidateQueries(['patient', patientId]);
    } catch (error) {
      console.error('Failed to add insurance:', error);
    }
  };

  const handleInsuranceUpdate = async (insuranceId: number, updates: any) => {
    try {
      const response = await apiRequest('PATCH', `/api/patients/${patientId}/insurance/${insuranceId}`, updates);
      await collectInsuranceUpdated(patientId, insuranceId, {
        originalValue: patient?.insurance?.find(i => i.id === insuranceId),
        newValue: updates,
        source: 'user'
      });
      queryClient.invalidateQueries(['patient', patientId]);
    } catch (error) {
      console.error('Failed to update insurance:', error);
    }
  };

  const handleDocumentUpload = async (documentData: any) => {
    try {
      const response = await apiRequest('POST', `/api/patients/${patientId}/documents`, documentData);
      await collectDocumentUploaded(patientId, response.data.documentId, documentData.type, {
        source: 'user'
      });
      queryClient.invalidateQueries(['patient', patientId]);
    } catch (error) {
      console.error('Failed to upload document:', error);
    }
  };

  const handleDocumentUpdate = async (documentId: number, updates: any) => {
    try {
      const response = await apiRequest('PATCH', `/api/patients/${patientId}/documents/${documentId}`, updates);
      await collectDocumentUpdated(patientId, documentId, {
        originalValue: patient?.documents?.find(d => d.id === documentId),
        newValue: updates,
        source: 'user'
      });
      queryClient.invalidateQueries(['patient', patientId]);
    } catch (error) {
      console.error('Failed to update document:', error);
    }
  };

  const handleConsentAdd = async (consentData: any) => {
    try {
      const response = await apiRequest('POST', `/api/patients/${patientId}/consents`, consentData);
      await collectConsentAdded(patientId, response.data.consentId, consentData.type, {
        source: 'user'
      });
      queryClient.invalidateQueries(['patient', patientId]);
    } catch (error) {
      console.error('Failed to add consent:', error);
    }
  };

  const handleConsentUpdate = async (consentId: number, updates: any) => {
    try {
      const response = await apiRequest('PATCH', `/api/patients/${patientId}/consents/${consentId}`, updates);
      await collectConsentUpdated(patientId, consentId, {
        originalValue: patient?.consents?.find(c => c.id === consentId),
        newValue: updates,
        source: 'user'
      });
      queryClient.invalidateQueries(['patient', patientId]);
    } catch (error) {
      console.error('Failed to update consent:', error);
    }
  };

  const handleBillingCreate = async (billingData: any) => {
    try {
      const response = await apiRequest('POST', `/api/patients/${patientId}/billing`, billingData);
      await collectBillingCreated(patientId, response.data.billingId, billingData.type, {
        source: 'user'
      });
      queryClient.invalidateQueries(['patient', patientId]);
    } catch (error) {
      console.error('Failed to create billing:', error);
    }
  };

  const handleBillingUpdate = async (billingId: number, updates: any) => {
    try {
      const response = await apiRequest('PATCH', `/api/patients/${patientId}/billing/${billingId}`, updates);
      await collectBillingUpdated(patientId, billingId, {
        originalValue: patient?.billing?.find(b => b.id === billingId),
        newValue: updates,
        source: 'user'
      });
      queryClient.invalidateQueries(['patient', patientId]);
    } catch (error) {
      console.error('Failed to update billing:', error);
    }
  };

  const handleCommunicationSend = async (communicationData: any) => {
    try {
      const response = await apiRequest('POST', `/api/patients/${patientId}/communications`, communicationData);
      await collectCommunicationSent(patientId, response.data.communicationId, communicationData.type, {
        source: 'user'
      });
      queryClient.invalidateQueries(['patient', patientId]);
    } catch (error) {
      console.error('Failed to send communication:', error);
    }
  };

  const handleCommunicationUpdate = async (communicationId: number, updates: any) => {
    try {
      const response = await apiRequest('PATCH', `/api/patients/${patientId}/communications/${communicationId}`, updates);
      await collectCommunicationUpdated(patientId, communicationId, {
        originalValue: patient?.communications?.find(c => c.id === communicationId),
        newValue: updates,
        source: 'user'
      });
      queryClient.invalidateQueries(['patient', patientId]);
    } catch (error) {
      console.error('Failed to update communication:', error);
    }
  };

  return (
    // ... existing JSX ...
  );
}; 