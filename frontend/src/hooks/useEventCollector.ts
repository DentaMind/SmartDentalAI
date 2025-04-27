import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './useAuth';

interface EventMetadata {
  [key: string]: any;
}

interface EventData {
  event_type: string;
  user_id?: string;
  session_id: string;
  metadata: EventMetadata;
  timestamp?: string;
}

const API_URL = process.env.REACT_APP_API_URL || '';

export const useEventCollector = () => {
  const { user } = useAuth();
  
  const collectEvent = useCallback(async (
    eventType: string,
    metadata: EventMetadata = {}
  ) => {
    try {
      const eventData: EventData = {
        event_type: eventType,
        user_id: user?.id,
        session_id: uuidv4(),
        metadata: {
          ...metadata,
          url: window.location.pathname,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      };
      
      const response = await fetch(`${API_URL}/api/v1/events/frontend/collect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add CSRF token here
        },
        body: JSON.stringify(eventData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to collect event: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error collecting event:', error);
      // Don't throw - we don't want to break the app flow
      return null;
    }
  }, [user]);
  
  // Predefined event collectors for common scenarios
  const collectDiagnosisCorrection = useCallback((
    originalDiagnosis: string,
    correctedDiagnosis: string,
    metadata: EventMetadata = {}
  ) => {
    return collectEvent('diagnosis_correction', {
      original_diagnosis: originalDiagnosis,
      corrected_diagnosis: correctedDiagnosis,
      ...metadata
    });
  }, [collectEvent]);
  
  const collectTreatmentPlanEdit = useCallback((
    originalPlan: any,
    editedPlan: any,
    metadata: EventMetadata = {}
  ) => {
    return collectEvent('treatment_plan_edit', {
      original_plan: originalPlan,
      edited_plan: editedPlan,
      ...metadata
    });
  }, [collectEvent]);
  
  const collectBillingOverride = useCallback((
    originalAmount: number,
    overriddenAmount: number,
    reason: string,
    metadata: EventMetadata = {}
  ) => {
    return collectEvent('billing_override', {
      original_amount: originalAmount,
      overridden_amount: overriddenAmount,
      reason,
      ...metadata
    });
  }, [collectEvent]);
  
  const collectLanguageUsage = useCallback((
    language: string,
    context: string,
    metadata: EventMetadata = {}
  ) => {
    return collectEvent('language_usage', {
      language,
      context,
      ...metadata
    });
  }, [collectEvent]);
  
  const collectNavigationEvent = useCallback((
    fromPath: string,
    toPath: string,
    metadata: EventMetadata = {}
  ) => {
    return collectEvent('navigation', {
      from_path: fromPath,
      to_path: toPath,
      ...metadata
    });
  }, [collectEvent]);
  
  const collectTimingEvent = useCallback((
    eventName: string,
    durationMs: number,
    metadata: EventMetadata = {}
  ) => {
    return collectEvent('timing', {
      event_name: eventName,
      duration_ms: durationMs,
      ...metadata
    });
  }, [collectEvent]);
  
  return {
    collectEvent,
    collectDiagnosisCorrection,
    collectTreatmentPlanEdit,
    collectBillingOverride,
    collectLanguageUsage,
    collectNavigationEvent,
    collectTimingEvent
  };
}; 