import axios from 'axios';
import { API_BASE_URL } from '../config/api';

export interface AITreatmentFeedback {
  treatmentSuggestionId: string;
  diagnosisId: string;
  patientId: string;
  providerId: string;
  action: 'accepted' | 'rejected' | 'modified';
  confidence?: number;
  relevanceScore?: number;
  evidenceQualityRating?: number;
  comment?: string;
  modifiedTreatment?: {
    procedureName?: string;
    procedureCode?: string;
    priority?: string;
  };
}

export interface EvidenceFeedback {
  evidenceId: string;
  treatmentSuggestionId: string;
  providerId: string;
  relevanceScore: number; // 0-1, how relevant the provider found this evidence
  accuracy: number; // 1-5, how accurate the provider found this evidence
  comment?: string;
}

/**
 * Service for tracking AI feedback and evidence evaluation
 */
class AIFeedbackService {
  /**
   * Record feedback when a provider accepts, rejects, or modifies an AI treatment suggestion
   * 
   * @param feedback - Feedback data about the treatment suggestion
   * @returns Promise with the saved feedback
   */
  async recordTreatmentFeedback(feedback: AITreatmentFeedback): Promise<AITreatmentFeedback> {
    const response = await axios.post(`${API_BASE_URL}/ai-feedback/treatment`, feedback);
    return response.data;
  }
  
  /**
   * Record feedback about evidence quality and relevance
   * 
   * @param feedback - Evidence feedback data
   * @returns Promise with the saved feedback
   */
  async recordEvidenceFeedback(feedback: EvidenceFeedback): Promise<EvidenceFeedback> {
    const response = await axios.post(`${API_BASE_URL}/ai-feedback/evidence`, feedback);
    return response.data;
  }
  
  /**
   * Record multiple evidence feedback entries in bulk
   * 
   * @param feedbackArray - Array of evidence feedback entries
   * @returns Promise with operation result
   */
  async recordBulkEvidenceFeedback(feedbackArray: EvidenceFeedback[]): Promise<{ success: boolean, count: number }> {
    const response = await axios.post(`${API_BASE_URL}/ai-feedback/evidence/bulk`, { feedbackItems: feedbackArray });
    return response.data;
  }
  
  /**
   * Get analytics data about treatment suggestion feedback
   * 
   * @param period - Time period to filter by (week, month, quarter, year)
   * @param providerId - Optional provider ID to filter by
   * @returns Promise with feedback analytics data
   */
  async getFeedbackAnalytics(period: string = 'month', providerId: string = 'all'): Promise<any> {
    const params = new URLSearchParams();
    params.append('period', period);
    
    if (providerId !== 'all') {
      params.append('provider_id', providerId);
    }
    
    const response = await axios.get(`${API_BASE_URL}/ai-feedback/analytics?${params.toString()}`);
    return response.data;
  }
  
  /**
   * Get analytics data about evidence feedback
   * 
   * @param period - Time period to filter by (week, month, quarter, year)
   * @param providerId - Optional provider ID to filter by
   * @returns Promise with evidence feedback analytics data
   */
  async getEvidenceFeedbackAnalytics(period: string = 'month', providerId: string = 'all'): Promise<any> {
    const params = new URLSearchParams();
    params.append('period', period);
    
    if (providerId !== 'all') {
      params.append('provider_id', providerId);
    }
    
    const response = await axios.get(`${API_BASE_URL}/ai-feedback/evidence-analytics?${params.toString()}`);
    return response.data;
  }
  
  /**
   * Get treatment pattern analysis data
   * 
   * @param period - Time period to filter by (week, month, quarter, year)
   * @param providerId - Optional provider ID to filter by
   * @returns Promise with treatment pattern analytics data
   */
  async getTreatmentPatterns(period: string = 'month', providerId: string = 'all'): Promise<any> {
    const params = new URLSearchParams();
    params.append('period', period);
    
    if (providerId !== 'all') {
      params.append('provider_id', providerId);
    }
    
    const response = await axios.get(`${API_BASE_URL}/ai-feedback/treatment-patterns?${params.toString()}`);
    return response.data;
  }

  /**
   * Get rejected treatment suggestions for resolution
   * 
   * @param period - Time period to filter by (week, month, quarter, year)
   * @param severity - Optional severity filter (high, medium, low, all)
   * @returns Promise with list of rejected suggestions
   */
  async getRejectedSuggestions(period: string = 'month', severity: string = 'all'): Promise<any[]> {
    const params = new URLSearchParams();
    params.append('period', period);
    
    if (severity !== 'all') {
      params.append('severity', severity);
    }
    
    const response = await axios.get(`${API_BASE_URL}/ai-feedback/rejected-suggestions?${params.toString()}`);
    return response.data;
  }
  
  /**
   * Get flagged evidence for resolution
   * 
   * @param period - Time period to filter by (week, month, quarter, year)
   * @param severity - Optional severity filter (high, medium, low, all)
   * @returns Promise with list of flagged evidence
   */
  async getFlaggedEvidence(period: string = 'month', severity: string = 'all'): Promise<any[]> {
    const params = new URLSearchParams();
    params.append('period', period);
    
    if (severity !== 'all') {
      params.append('severity', severity);
    }
    
    const response = await axios.get(`${API_BASE_URL}/ai-feedback/flagged-evidence?${params.toString()}`);
    return response.data;
  }
  
  /**
   * Get model issues for resolution
   * 
   * @param period - Time period to filter by (week, month, quarter, year)
   * @param severity - Optional severity filter (high, medium, low, all)
   * @returns Promise with list of model issues
   */
  async getModelIssues(period: string = 'month', severity: string = 'all'): Promise<any[]> {
    const params = new URLSearchParams();
    params.append('period', period);
    
    if (severity !== 'all') {
      params.append('severity', severity);
    }
    
    const response = await axios.get(`${API_BASE_URL}/ai-feedback/model-issues?${params.toString()}`);
    return response.data;
  }
  
  /**
   * Submit resolution for a treatment feedback
   * 
   * @param feedbackId - ID of the treatment feedback
   * @param action - Resolution action
   * @param note - Optional resolution note
   * @returns Promise with the updated feedback
   */
  async resolveTreatmentFeedback(feedbackId: string, action: string, note?: string): Promise<any> {
    const response = await axios.post(`${API_BASE_URL}/ai-feedback/resolve-treatment/${feedbackId}`, {
      action,
      note
    });
    return response.data;
  }
  
  /**
   * Submit resolution for evidence feedback
   * 
   * @param feedbackId - ID of the evidence feedback
   * @param action - Resolution action
   * @param note - Optional resolution note
   * @returns Promise with the updated feedback
   */
  async resolveEvidenceFeedback(feedbackId: string, action: string, note?: string): Promise<any> {
    const response = await axios.post(`${API_BASE_URL}/ai-feedback/resolve-evidence/${feedbackId}`, {
      action,
      note
    });
    return response.data;
  }
  
  /**
   * Submit resolution for a model issue
   * 
   * @param issueId - ID of the model issue
   * @param action - Resolution action
   * @param note - Optional resolution note
   * @returns Promise with the updated issue
   */
  async resolveModelIssue(issueId: string, action: string, note?: string): Promise<any> {
    const response = await axios.post(`${API_BASE_URL}/ai-feedback/resolve-issue/${issueId}`, {
      action,
      note
    });
    return response.data;
  }
}

const aiFeedbackService = new AIFeedbackService();
export default aiFeedbackService; 