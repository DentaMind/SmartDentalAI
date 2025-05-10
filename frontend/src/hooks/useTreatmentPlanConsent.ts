import { useState, useCallback } from 'react';

interface ConsentData {
  signed_by: string;
  signed_at: string;
  signature_data: string;
  ip_address: string;
  status: string;
}

export const useTreatmentPlanConsent = (treatmentPlanId: number) => {
  const [consentData, setConsentData] = useState<ConsentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConsentData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/treatment-plan/${treatmentPlanId}/consent`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // No consent found is a valid state
          setConsentData(null);
          return;
        }
        throw new Error('Failed to fetch consent data');
      }

      const data = await response.json();
      setConsentData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch consent data');
      setConsentData(null);
    } finally {
      setLoading(false);
    }
  }, [treatmentPlanId]);

  const isPlanLocked = consentData !== null;

  return {
    consentData,
    loading,
    error,
    fetchConsentData,
    isPlanLocked,
  };
}; 