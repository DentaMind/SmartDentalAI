import React from 'react';
import { usePatientProfileEvents } from '@/hooks/usePatientProfileEvents';
import { useQuery } from 'react-query';
import { apiRequest } from '@/lib/apiRequest';
import { queryClient } from '@/lib/queryClient';

export const PatientProfile: React.FC<{ patientId: number }> = ({ patientId }) => {
  const {
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
  } = usePatientProfileEvents();

  const { data: profile, isLoading } = useQuery<PatientProfile>(
    ['patientProfile', patientId],
    () => fetchPatientProfile(patientId)
  );

  const handleProfileUpdate = async (updates: Partial<PatientProfile>) => {
    try {
      const response = await apiRequest('PATCH', `/api/patients/${patientId}`, updates);
      await collectProfileUpdated(patientId, {
        originalValue: profile,
        newValue: { ...profile, ...updates },
        source: 'user'
      });
      queryClient.invalidateQueries(['patientProfile', patientId]);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleProfileArchive = async (reason: string) => {
    try {
      const response = await apiRequest('POST', `/api/patients/${patientId}/archive`, { reason });
      await collectProfileArchived(patientId, reason, { source: 'user' });
      queryClient.invalidateQueries(['patientProfile', patientId]);
    } catch (error) {
      console.error('Failed to archive profile:', error);
    }
  };

  const handleDocumentUpload = async (file: File, documentType: string) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', documentType);
      
      const response = await apiRequest('POST', `/api/patients/${patientId}/documents`, formData);
      await collectDocumentUploaded(patientId, documentType, {
        documentId: response.data.documentId,
        source: 'user'
      });
      queryClient.invalidateQueries(['patientProfile', patientId]);
    } catch (error) {
      console.error('Failed to upload document:', error);
    }
  };

  const handleDocumentView = async (documentId: number) => {
    try {
      const response = await apiRequest('GET', `/api/patients/${patientId}/documents/${documentId}`);
      await collectDocumentViewed(patientId, documentId, { source: 'user' });
      // Handle document viewing logic
    } catch (error) {
      console.error('Failed to view document:', error);
    }
  };

  const handleDocumentShare = async (documentId: number, recipientId: number) => {
    try {
      const response = await apiRequest('POST', `/api/patients/${patientId}/documents/${documentId}/share`, {
        recipientId
      });
      await collectDocumentShared(patientId, documentId, recipientId, { source: 'user' });
    } catch (error) {
      console.error('Failed to share document:', error);
    }
  };

  const handleAppointmentSchedule = async (appointmentDetails: any) => {
    try {
      const response = await apiRequest('POST', `/api/patients/${patientId}/appointments`, appointmentDetails);
      await collectAppointmentScheduled(patientId, response.data.appointmentId, {
        source: 'user'
      });
      queryClient.invalidateQueries(['patientProfile', patientId]);
    } catch (error) {
      console.error('Failed to schedule appointment:', error);
    }
  };

  const handleAppointmentReschedule = async (appointmentId: number, newDetails: any) => {
    try {
      const response = await apiRequest('PATCH', `/api/patients/${patientId}/appointments/${appointmentId}`, newDetails);
      await collectAppointmentRescheduled(patientId, appointmentId, {
        originalValue: profile?.appointments?.find(a => a.id === appointmentId),
        newValue: newDetails,
        source: 'user'
      });
      queryClient.invalidateQueries(['patientProfile', patientId]);
    } catch (error) {
      console.error('Failed to reschedule appointment:', error);
    }
  };

  const handleAppointmentCancel = async (appointmentId: number, reason: string) => {
    try {
      const response = await apiRequest('DELETE', `/api/patients/${patientId}/appointments/${appointmentId}`, { reason });
      await collectAppointmentCancelled(patientId, appointmentId, reason, {
        source: 'user'
      });
      queryClient.invalidateQueries(['patientProfile', patientId]);
    } catch (error) {
      console.error('Failed to cancel appointment:', error);
    }
  };

  const handleInsuranceUpdate = async (insuranceDetails: any) => {
    try {
      const response = await apiRequest('PATCH', `/api/patients/${patientId}/insurance`, insuranceDetails);
      await collectInsuranceUpdated(patientId, response.data.insuranceId, {
        originalValue: profile?.insurance,
        newValue: insuranceDetails,
        source: 'user'
      });
      queryClient.invalidateQueries(['patientProfile', patientId]);
    } catch (error) {
      console.error('Failed to update insurance:', error);
    }
  };

  const handleConsentFormSign = async (formType: string, signature: any) => {
    try {
      const response = await apiRequest('POST', `/api/patients/${patientId}/consent-forms`, {
        formType,
        signature
      });
      await collectConsentFormSigned(patientId, formType, {
        source: 'user'
      });
      queryClient.invalidateQueries(['patientProfile', patientId]);
    } catch (error) {
      console.error('Failed to sign consent form:', error);
    }
  };

  const handlePreferencesUpdate = async (preferences: any) => {
    try {
      const response = await apiRequest('PATCH', `/api/patients/${patientId}/preferences`, preferences);
      await collectPreferencesUpdated(patientId, {
        originalValue: profile?.preferences,
        newValue: preferences,
        source: 'user'
      });
      queryClient.invalidateQueries(['patientProfile', patientId]);
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  };

  return (
    <div className="patient-profile">
      <h2>Patient Profile</h2>
      {/* Patient profile details would go here */}
    </div>
  );
}; 