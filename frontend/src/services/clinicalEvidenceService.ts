import axios from 'axios';
import { API_BASE_URL } from '../config/api';

export interface EvidenceCitation {
  title: string;
  authors?: string;
  publication?: string;
  publication_date?: Date;
  doi?: string;
  url?: string;
  evidence_type: string;
  evidence_grade: string;
  summary?: string;
  page_reference?: string;
  quote?: string;
}

export interface ClinicalEvidence {
  id: string;
  title: string;
  authors?: string;
  publication?: string;
  publication_date?: Date;
  doi?: string;
  url?: string;
  evidence_type: string;
  evidence_grade: string;
  summary?: string;
  recommendations?: any[];
  specialties?: string[];
  conditions?: string[];
  procedures?: string[];
  keywords?: string[];
  version?: string;
  created_at: Date;
  updated_at?: Date;
}

export interface EvidenceWithRelevance {
  evidence: ClinicalEvidence;
  relevance_score: number;
}

/**
 * Service for interacting with the clinical evidence API
 */
class ClinicalEvidenceService {
  /**
   * Search for clinical evidence based on criteria
   * 
   * @param searchTerm - Text to search in title, summary, and keywords
   * @param evidenceType - Type of evidence to filter by
   * @param evidenceGrade - Grade of evidence to filter by
   * @param specialty - Dental specialty to filter by
   * @param limit - Maximum number of results to return
   * @param offset - Pagination offset
   * @returns Promise with list of matching evidence
   */
  async searchEvidence(
    searchTerm?: string,
    evidenceType?: string,
    evidenceGrade?: string,
    specialty?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<ClinicalEvidence[]> {
    const params = new URLSearchParams();
    
    if (searchTerm) params.append('search_term', searchTerm);
    if (evidenceType) params.append('evidence_type', evidenceType);
    if (evidenceGrade) params.append('evidence_grade', evidenceGrade);
    if (specialty) params.append('specialty', specialty);
    
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    
    const response = await axios.get(`${API_BASE_URL}/clinical-evidence/?${params.toString()}`);
    return response.data;
  }
  
  /**
   * Get a clinical evidence entry by ID
   * 
   * @param evidenceId - ID of the evidence entry
   * @returns Promise with the evidence details
   */
  async getEvidenceById(evidenceId: string): Promise<ClinicalEvidence> {
    const response = await axios.get(`${API_BASE_URL}/clinical-evidence/${evidenceId}`);
    return response.data;
  }
  
  /**
   * Create a new clinical evidence entry
   * 
   * @param evidenceData - Data for the new evidence entry
   * @returns Promise with the created evidence
   */
  async createEvidence(evidenceData: Partial<ClinicalEvidence>): Promise<ClinicalEvidence> {
    const response = await axios.post(`${API_BASE_URL}/clinical-evidence/`, evidenceData);
    return response.data;
  }
  
  /**
   * Update an existing clinical evidence entry
   * 
   * @param evidenceId - ID of the evidence to update
   * @param updateData - Data to update
   * @returns Promise with the updated evidence
   */
  async updateEvidence(evidenceId: string, updateData: Partial<ClinicalEvidence>): Promise<ClinicalEvidence> {
    const response = await axios.put(`${API_BASE_URL}/clinical-evidence/${evidenceId}`, updateData);
    return response.data;
  }
  
  /**
   * Delete a clinical evidence entry
   * 
   * @param evidenceId - ID of the evidence to delete
   * @returns Promise with success status
   */
  async deleteEvidence(evidenceId: string): Promise<{ success: boolean }> {
    const response = await axios.delete(`${API_BASE_URL}/clinical-evidence/${evidenceId}`);
    return response.data;
  }
  
  /**
   * Associate a finding with evidence
   * 
   * @param findingType - Type of finding
   * @param evidenceId - ID of the evidence entry
   * @param relevanceScore - Relevance score (0.0 to 1.0)
   * @returns Promise with success status
   */
  async associateFindingWithEvidence(
    findingType: string,
    evidenceId: string,
    relevanceScore: number = 0.7
  ): Promise<{ success: boolean }> {
    const response = await axios.post(`${API_BASE_URL}/clinical-evidence/associate/finding`, {
      finding_type: findingType,
      evidence_id: evidenceId,
      relevance_score: relevanceScore
    });
    return response.data;
  }
  
  /**
   * Associate a treatment with evidence
   * 
   * @param procedureCode - Procedure code
   * @param evidenceId - ID of the evidence entry
   * @param relevanceScore - Relevance score (0.0 to 1.0)
   * @returns Promise with success status
   */
  async associateTreatmentWithEvidence(
    procedureCode: string,
    evidenceId: string,
    relevanceScore: number = 0.7
  ): Promise<{ success: boolean }> {
    const response = await axios.post(`${API_BASE_URL}/clinical-evidence/associate/treatment`, {
      procedure_code: procedureCode,
      evidence_id: evidenceId,
      relevance_score: relevanceScore
    });
    return response.data;
  }
  
  /**
   * Get evidence associated with a finding type
   * 
   * @param findingType - Type of finding to get evidence for
   * @param specialty - Optional specialty to filter by
   * @param limit - Maximum number of results to return
   * @returns Promise with list of evidence relevant to the finding
   */
  async getEvidenceForFinding(
    findingType: string,
    specialty?: string,
    limit: number = 5
  ): Promise<EvidenceWithRelevance[]> {
    const params = new URLSearchParams();
    
    if (specialty) params.append('specialty', specialty);
    params.append('limit', limit.toString());
    
    const response = await axios.get(`${API_BASE_URL}/clinical-evidence/finding/${findingType}?${params.toString()}`);
    return response.data;
  }
  
  /**
   * Get evidence associated with a treatment procedure
   * 
   * @param procedureCode - Procedure code to get evidence for
   * @param findingType - Optional finding type to filter by
   * @param specialty - Optional specialty to filter by
   * @param limit - Maximum number of results to return
   * @returns Promise with list of evidence relevant to the treatment
   */
  async getEvidenceForTreatment(
    procedureCode: string,
    findingType?: string,
    specialty?: string,
    limit: number = 5
  ): Promise<EvidenceWithRelevance[]> {
    const params = new URLSearchParams();
    
    if (findingType) params.append('finding_type', findingType);
    if (specialty) params.append('specialty', specialty);
    params.append('limit', limit.toString());
    
    const response = await axios.get(`${API_BASE_URL}/clinical-evidence/treatment/${procedureCode}?${params.toString()}`);
    return response.data;
  }
  
  /**
   * Get formatted citations for a treatment suggestion
   * 
   * @param findingType - Type of finding
   * @param procedureCode - Procedure code
   * @param specialty - Optional specialty to filter by
   * @param limit - Maximum number of citations
   * @returns Promise with list of formatted citations
   */
  async getCitationsForSuggestion(
    findingType: string,
    procedureCode: string,
    specialty?: string,
    limit: number = 3
  ): Promise<EvidenceCitation[]> {
    const params = new URLSearchParams();
    
    if (specialty) params.append('specialty', specialty);
    params.append('limit', limit.toString());
    
    const response = await axios.get(
      `${API_BASE_URL}/clinical-evidence/citations/${findingType}/${procedureCode}?${params.toString()}`
    );
    return response.data;
  }
  
  /**
   * Seed initial evidence data
   * 
   * @returns Promise with seeding results
   */
  async seedInitialEvidence(): Promise<{ message: string, count: number }> {
    const response = await axios.post(`${API_BASE_URL}/clinical-evidence/seed`);
    return response.data;
  }
}

export default new ClinicalEvidenceService(); 