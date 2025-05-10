/**
 * AI Treatment Suggestion Service
 * 
 * Provides client-side API communication for generating, retrieving, and managing
 * AI-generated treatment suggestions based on diagnostic findings.
 */

import axios from 'axios';
import { API_URL } from '../config/constants';

// Type definitions
export interface AITreatmentSuggestion {
  id: string;
  patient_id: string;
  diagnosis_id: string;
  finding_id?: string;
  procedure_code?: string;
  procedure_name: string;
  procedure_description?: string;
  tooth_number?: string;
  surface?: string;
  confidence: number;
  confidence_level: 'low' | 'medium' | 'high' | 'very_high';
  reasoning: string;
  alternatives?: Array<{
    name: string;
    code?: string;
    description?: string;
  }>;
  source: 'xray' | 'clinical_notes' | 'patient_history' | 'perio_chart' | 'multimodal';
  model_version?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  urgency_days?: number;
  clinical_benefits?: string;
  potential_complications?: string;
  evidence_citations?: any[];
  status: 'pending' | 'accepted' | 'modified' | 'rejected';
  clinician_notes?: string;
  modified_procedure?: string;
  rejection_reason?: string;
  clinical_override_reason?: string;
  created_at: string;
  updated_at?: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface TreatmentSuggestionGroup {
  id: string;
  patient_id: string;
  title: string;
  description?: string;
  condition_category?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  suggestions: string[];
  created_at: string;
}

export interface TreatmentSuggestionGroupWithDetails extends TreatmentSuggestionGroup {
  suggestions_details: AITreatmentSuggestion[];
}

export interface SuggestionUpdateData {
  status?: 'pending' | 'accepted' | 'modified' | 'rejected';
  clinician_notes?: string;
  modified_procedure?: string;
  rejection_reason?: string;
  clinical_override_reason?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface TreatmentPlanDetails {
  message: string;
  treatment_plan_id: string;
  suggestion_group_id: string;
}

export interface SuggestionMetrics {
  acceptance_rate: number;
  modification_rate: number;
  rejection_rate: number;
  total_reviewed: number;
}

/**
 * Service for working with AI-generated treatment suggestions
 */
class AITreatmentSuggestionService {
  
  /**
   * Generate treatment suggestions from a diagnosis
   * 
   * @param diagnosisId ID of the diagnosis to generate suggestions from
   * @param generateGroups Whether to group suggestions by condition
   * @returns Promise with generated suggestions and groups
   */
  async generateSuggestionsFromDiagnosis(
    diagnosisId: string,
    generateGroups: boolean = true
  ): Promise<{
    message: string;
    suggestions: AITreatmentSuggestion[];
    groups: TreatmentSuggestionGroup[];
  }> {
    try {
      const response = await axios.post(
        `${API_URL}/api/ai/treatment-suggestions/from-diagnosis/${diagnosisId}`,
        null,
        {
          params: { generate_groups: generateGroups },
          withCredentials: true
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error generating treatment suggestions:', error);
      throw error;
    }
  }
  
  /**
   * Get treatment suggestions for a patient
   * 
   * @param patientId ID of the patient
   * @param status Optional status filter
   * @param minConfidence Optional minimum confidence score
   * @param limit Maximum number of results
   * @param offset Pagination offset
   * @returns Promise with list of suggestions
   */
  async getSuggestionsByPatient(
    patientId: string,
    status?: 'pending' | 'accepted' | 'modified' | 'rejected',
    minConfidence?: number,
    limit: number = 100,
    offset: number = 0
  ): Promise<AITreatmentSuggestion[]> {
    try {
      const response = await axios.get(
        `${API_URL}/api/ai/treatment-suggestions/patients/${patientId}`,
        {
          params: {
            status,
            min_confidence: minConfidence,
            limit,
            offset
          },
          withCredentials: true
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting treatment suggestions for patient:', error);
      throw error;
    }
  }
  
  /**
   * Get treatment suggestion groups for a patient
   * 
   * @param patientId ID of the patient
   * @param limit Maximum number of results
   * @param offset Pagination offset
   * @returns Promise with list of suggestion groups
   */
  async getSuggestionGroupsByPatient(
    patientId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<TreatmentSuggestionGroup[]> {
    try {
      const response = await axios.get(
        `${API_URL}/api/ai/treatment-suggestions/groups/patients/${patientId}`,
        {
          params: { limit, offset },
          withCredentials: true
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting treatment suggestion groups for patient:', error);
      throw error;
    }
  }
  
  /**
   * Get a specific treatment suggestion by ID
   * 
   * @param suggestionId ID of the suggestion
   * @returns Promise with suggestion details
   */
  async getSuggestionById(suggestionId: string): Promise<AITreatmentSuggestion> {
    try {
      const response = await axios.get(
        `${API_URL}/api/ai/treatment-suggestions/suggestions/${suggestionId}`,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting treatment suggestion:', error);
      throw error;
    }
  }
  
  /**
   * Get a treatment suggestion group with detailed suggestions
   * 
   * @param groupId ID of the group
   * @returns Promise with group and its suggestions
   */
  async getSuggestionGroupById(groupId: string): Promise<TreatmentSuggestionGroupWithDetails> {
    try {
      const response = await axios.get(
        `${API_URL}/api/ai/treatment-suggestions/groups/${groupId}`,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting treatment suggestion group:', error);
      throw error;
    }
  }
  
  /**
   * Update a treatment suggestion's status or details
   * 
   * @param suggestionId ID of the suggestion to update
   * @param updateData Data to update
   * @returns Promise with updated suggestion
   */
  async updateSuggestion(
    suggestionId: string,
    updateData: SuggestionUpdateData
  ): Promise<AITreatmentSuggestion> {
    try {
      const response = await axios.patch(
        `${API_URL}/api/ai/treatment-suggestions/suggestions/${suggestionId}`,
        updateData,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating treatment suggestion:', error);
      throw error;
    }
  }
  
  /**
   * Convert a suggestion group to a formal treatment plan
   * 
   * @param groupId ID of the group to convert
   * @param title Optional title for the treatment plan
   * @param description Optional description for the treatment plan
   * @returns Promise with created treatment plan details
   */
  async convertToTreatmentPlan(
    groupId: string,
    title?: string,
    description?: string
  ): Promise<TreatmentPlanDetails> {
    try {
      const response = await axios.post(
        `${API_URL}/api/ai/treatment-suggestions/groups/${groupId}/to-treatment-plan`,
        null,
        {
          params: {
            title,
            description
          },
          withCredentials: true
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error converting to treatment plan:', error);
      throw error;
    }
  }
  
  /**
   * Get metrics on AI treatment suggestions
   * 
   * @returns Promise with suggestion metrics
   */
  async getSuggestionMetrics(): Promise<SuggestionMetrics> {
    try {
      const response = await axios.get(
        `${API_URL}/api/ai/treatment-suggestions/metrics`,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting treatment suggestion metrics:', error);
      throw error;
    }
  }
}

export default new AITreatmentSuggestionService(); 