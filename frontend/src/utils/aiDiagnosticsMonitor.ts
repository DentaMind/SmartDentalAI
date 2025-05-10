/**
 * AI Diagnostics Monitoring Utility
 * 
 * Provides client-side monitoring and logging for AI diagnostic operations.
 * Collects metrics about AI performance, confidence scores, and resources.
 */

import { API_URL } from '../config/constants';

// Types for client-side metrics
export interface AIDiagnosticMetrics {
  // Performance metrics
  performance: {
    inference_time_ms: number;
    preprocessing_time_ms: number;
    postprocessing_time_ms: number;
    total_processing_time_ms: number;
  };
  
  // Diagnostic metrics
  diagnostic: {
    type: string;  // caries, periapical, periodontal, etc.
    confidence_score: number;
    findings_count: number;
    finding_types?: string[];  // Array of finding types (e.g. "caries", "fracture")
  };
  
  // Resource usage
  resources?: {
    cpu_utilization?: number;
    memory_usage_mb?: number;
    gpu_utilization?: number;
  };
  
  // Clinical metrics
  clinical?: {
    clinician_agreement?: boolean;
    clinician_review_time_ms?: number;
    specific_findings_feedback?: {
      finding_id: string;
      finding_type: string;
      is_correct: boolean;
      correction_type?: string;
      correction_details?: string;
    }[];
  };
  
  // Error information (if any)
  error?: {
    type: string;
    message: string;
  };
}

export interface AIDiagnosticSubmitRequest {
  model_name: string;
  model_version: string;
  request_id: string;
  metrics: AIDiagnosticMetrics;
  patient_id?: string;
  location_info?: {
    region?: string;
    country?: string;
    city?: string;
    clinic_id?: string;
  };
}

export interface AIDiagnosticSubmitResponse {
  success: boolean;
  message: string;
  timestamp: string;
}

export interface ModelRetrainingTriggerRequest {
  model_name: string;
  model_version: string;
  triggered_by?: string;
  reason?: string;
}

export interface FindingFeedbackRequest {
  finding_id: string;
  provider_id: string;
  patient_id: string;
  is_correct: boolean;
  correction_type?: string;
  correction_details?: string;
  priority?: string;
  model_version?: string;
}

/**
 * Class for monitoring AI diagnostics and submitting metrics
 */
export class AIDiagnosticsMonitor {
  private static instance: AIDiagnosticsMonitor;
  private token: string | null = null;
  
  private constructor() {
    // Initialize from localStorage if available
    this.token = localStorage.getItem('token');
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): AIDiagnosticsMonitor {
    if (!AIDiagnosticsMonitor.instance) {
      AIDiagnosticsMonitor.instance = new AIDiagnosticsMonitor();
    }
    return AIDiagnosticsMonitor.instance;
  }
  
  /**
   * Set authentication token
   */
  public setToken(token: string): void {
    this.token = token;
    localStorage.setItem('token', token);
  }
  
  /**
   * Submit AI diagnostic metrics to the server
   */
  public async submitMetrics(request: AIDiagnosticSubmitRequest): Promise<AIDiagnosticSubmitResponse> {
    try {
      const response = await fetch(`${API_URL}/api/ai/diagnostics/metrics`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      if (!response.ok) {
        throw new Error(`Error submitting AI diagnostic metrics: ${response.statusText}`);
      }
      
      return await response.json() as AIDiagnosticSubmitResponse;
    } catch (error) {
      console.error('Failed to submit AI diagnostic metrics:', error);
      
      // Return failure response
      return {
        success: false,
        message: `Failed to submit metrics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      };
    }
  }
  
  /**
   * Track AI diagnostic operation and submit metrics
   * 
   * @param modelName Name of the AI model
   * @param modelVersion Version of the AI model
   * @param diagnosticType Type of diagnostic operation
   * @param patientId Optional patient ID
   * @param operation Function to track (will measure execution time)
   * @returns Result of the operation
   */
  public async trackOperation<T>(
    modelName: string,
    modelVersion: string,
    diagnosticType: string,
    patientId?: string,
    operation?: () => Promise<T>
  ): Promise<T | undefined> {
    // Generate unique request ID
    const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Initialize metrics
    const metrics: AIDiagnosticMetrics = {
      performance: {
        inference_time_ms: 0,
        preprocessing_time_ms: 0,
        postprocessing_time_ms: 0,
        total_processing_time_ms: 0,
      },
      diagnostic: {
        type: diagnosticType,
        confidence_score: 0,
        findings_count: 0,
        finding_types: [],
      },
    };
    
    let result: T | undefined;
    const startTime = performance.now();
    
    try {
      // Execute operation if provided
      if (operation) {
        result = await operation();
        
        // Try to extract confidence and findings count from result if available
        if (result && typeof result === 'object') {
          const resultObj = result as Record<string, any>;
          
          if (resultObj.confidence !== undefined) {
            metrics.diagnostic.confidence_score = resultObj.confidence;
          }
          
          if (resultObj.findings !== undefined && Array.isArray(resultObj.findings)) {
            metrics.diagnostic.findings_count = resultObj.findings.length;
            
            // Extract finding types
            const findingTypes = new Set<string>();
            resultObj.findings.forEach((finding: any) => {
              if (finding.type) {
                findingTypes.add(finding.type);
              }
            });
            metrics.diagnostic.finding_types = Array.from(findingTypes);
          }
        }
      }
      
      // Calculate total time
      const endTime = performance.now();
      metrics.performance.total_processing_time_ms = endTime - startTime;
      
      // For simplicity, assign all time to inference
      // In a real implementation, preprocessing and postprocessing would be measured separately
      metrics.performance.inference_time_ms = metrics.performance.total_processing_time_ms;
      
      // Submit metrics
      this.submitMetrics({
        model_name: modelName,
        model_version: modelVersion,
        request_id: requestId,
        metrics,
        patient_id: patientId,
      });
      
      return result;
    } catch (error) {
      // Calculate time even for errors
      const endTime = performance.now();
      metrics.performance.total_processing_time_ms = endTime - startTime;
      
      // Add error information
      metrics.error = {
        type: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
      };
      
      // Submit metrics with error
      this.submitMetrics({
        model_name: modelName,
        model_version: modelVersion,
        request_id: requestId,
        metrics,
        patient_id: patientId,
      });
      
      // Re-throw the error
      throw error;
    }
  }
  
  /**
   * Record clinical feedback for a diagnostic result
   */
  public async recordClinicalFeedback(
    modelName: string,
    modelVersion: string,
    requestId: string,
    clinicianAgreement: boolean,
    reviewTimeMs?: number,
    patientId?: string
  ): Promise<AIDiagnosticSubmitResponse> {
    // Create metrics with clinical feedback
    const metrics: AIDiagnosticMetrics = {
      performance: {
        inference_time_ms: 0,
        preprocessing_time_ms: 0,
        postprocessing_time_ms: 0,
        total_processing_time_ms: 0,
      },
      diagnostic: {
        type: 'feedback',
        confidence_score: 0,
        findings_count: 0,
      },
      clinical: {
        clinician_agreement: clinicianAgreement,
        clinician_review_time_ms: reviewTimeMs,
      },
    };
    
    // Submit metrics
    return this.submitMetrics({
      model_name: modelName,
      model_version: modelVersion,
      request_id: requestId,
      metrics,
      patient_id: patientId,
    });
  }
  
  /**
   * Record feedback on a specific AI finding
   */
  public async recordFindingFeedback(
    findingId: string,
    providerId: string,
    patientId: string,
    isCorrect: boolean,
    modelVersion?: string,
    correctionType?: string,
    correctionDetails?: string,
    priority?: string
  ): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/api/ai/feedback`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          finding_id: findingId,
          provider_id: providerId,
          patient_id: patientId,
          is_correct: isCorrect,
          correction_type: correctionType,
          correction_details: correctionDetails,
          priority: priority || 'medium',
          model_version: modelVersion
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error submitting finding feedback: ${response.statusText}`);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to submit finding feedback:', error);
      return false;
    }
  }
  
  /**
   * Record feedback for multiple findings in a single diagnosis
   */
  public async recordMultipleFindingsFeedback(
    modelName: string,
    modelVersion: string, 
    requestId: string,
    findingsFeedback: {
      finding_id: string;
      finding_type: string;
      is_correct: boolean;
      correction_type?: string;
      correction_details?: string;
    }[],
    patientId?: string,
    providerId?: string
  ): Promise<AIDiagnosticSubmitResponse> {
    // Create metrics with specific findings feedback
    const metrics: AIDiagnosticMetrics = {
      performance: {
        inference_time_ms: 0,
        preprocessing_time_ms: 0,
        postprocessing_time_ms: 0,
        total_processing_time_ms: 0,
      },
      diagnostic: {
        type: 'findings_feedback',
        confidence_score: 0,
        findings_count: findingsFeedback.length,
      },
      clinical: {
        clinician_agreement: findingsFeedback.every(f => f.is_correct),
        specific_findings_feedback: findingsFeedback,
      },
    };
    
    // Submit metrics
    return this.submitMetrics({
      model_name: modelName,
      model_version: modelVersion,
      request_id: requestId,
      metrics,
      patient_id: patientId,
    });
  }
  
  /**
   * Trigger model retraining
   */
  public async triggerModelRetraining(modelName: string, modelVersion: string, reason?: string): Promise<boolean> {
    try {
      const userId = localStorage.getItem('userId') || 'unknown';
      
      const response = await fetch(`${API_URL}/api/ai/training/trigger`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model_name: modelName,
          model_version: modelVersion,
          triggered_by: userId,
          reason: reason || 'manual trigger'
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error triggering model retraining: ${response.statusText}`);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to trigger model retraining:', error);
      return false;
    }
  }
  
  /**
   * Check if model retraining is recommended based on feedback data
   */
  public async checkRetrainingRecommended(modelName: string, modelVersion?: string): Promise<{
    recommended: boolean;
    reason?: string;
    last_trained?: string;
    feedback_count?: number;
  }> {
    try {
      const versionParam = modelVersion ? `&model_version=${modelVersion}` : '';
      
      const response = await fetch(
        `${API_URL}/api/ai/training/status?model_name=${modelName}${versionParam}`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Error checking retraining status: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to check retraining status:', error);
      return { recommended: false };
    }
  }
} 