import { useState } from 'react';
import { useToast } from '@mui/material/styles';

interface PreAuthStatus {
  status: 'pending' | 'submitted' | 'approved' | 'denied';
  message?: string;
  documentUrl?: string;
}

interface PreAuthRequest {
  patientId: string;
  cdtCode: string;
  clinicalNotes?: string;
  xrayIds?: string[];
}

export function usePreAuth() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<PreAuthStatus | null>(null);

  const submitPreAuth = async (request: PreAuthRequest) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/preauth/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Failed to submit pre-authorization request');
      }

      const data = await response.json();
      setStatus({
        status: 'submitted',
        message: 'Pre-authorization request submitted successfully',
        documentUrl: data.documentUrl,
      });

      return data;
    } catch (error) {
      setStatus({
        status: 'pending',
        message: error instanceof Error ? error.message : 'An error occurred',
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkStatus = async (preAuthId: string) => {
    try {
      const response = await fetch(`/api/preauth/status/${preAuthId}`);
      if (!response.ok) {
        throw new Error('Failed to check pre-authorization status');
      }
      const data = await response.json();
      setStatus(data);
      return data;
    } catch (error) {
      console.error('Error checking pre-auth status:', error);
      throw error;
    }
  };

  return {
    submitPreAuth,
    checkStatus,
    isSubmitting,
    status,
  };
} 