import axios from 'axios';
import { socket } from '../utils/socket';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ResearchMode, SuggestionAction, ResearchEncounter, ResearchMetrics, ResearchSummary, ResearchSuggestion } from '../types/research';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

export interface AISuggestion {
  id: string;
  type: string;
  action: SuggestionAction;
  timestamp: string;
}

export interface StartEncounterRequest {
  patient_id: string;
  mode: ResearchMode;
}

export interface EndEncounterRequest {
  encounter_id: string;
  patient_acceptance: boolean;
}

export interface SubmitDiagnosisRequest {
  encounter_id: string;
  diagnosis: string;
  treatment_plan: string;
  confidence: number;
  notes?: string;
}

export interface RecordSuggestionRequest {
  encounter_id: string;
  suggestion_type: string;
  action: SuggestionAction;
}

export interface AddAuditEntryRequest {
  encounter_id: string;
  action: string;
  details: Record<string, any>;
}

export const researchService = {
  // Metrics
  getMetrics: async (doctorId?: string): Promise<ResearchMetrics> => {
    const url = doctorId 
      ? `${API_BASE_URL}/research/metrics/${doctorId}`
      : `${API_BASE_URL}/research/metrics`;
    const response = await axios.get(url);
    return response.data;
  },

  getSummaries: async (): Promise<ResearchSummary[]> => {
    const response = await axios.get(`${API_BASE_URL}/research/summaries`);
    return response.data;
  },

  // Encounters
  getEncounters: async (doctorId?: string): Promise<ResearchEncounter[]> => {
    const url = doctorId
      ? `${API_BASE_URL}/research/encounters/${doctorId}`
      : `${API_BASE_URL}/research/encounters`;
    const response = await axios.get(url);
    return response.data;
  },

  startEncounter: async (data: {
    patientId: string;
    doctorId: string;
    mode: 'clinical' | 'training';
  }): Promise<ResearchEncounter> => {
    const response = await axios.post(`${API_BASE_URL}/research/encounters/start`, data);
    return response.data;
  },

  endEncounter: async (encounterId: string, data: {
    diagnosis?: string;
    treatmentPlan?: string;
    confidence?: number;
    notes?: string;
    patientAcceptance?: boolean;
  }): Promise<ResearchEncounter> => {
    const response = await axios.post(`${API_BASE_URL}/research/encounters/${encounterId}/end`, data);
    return response.data;
  },

  // Suggestions
  addSuggestion: async (encounterId: string, data: {
    type: string;
    content: string;
    confidence: number;
  }): Promise<ResearchSuggestion> => {
    const response = await axios.post(`${API_BASE_URL}/research/encounters/${encounterId}/suggestions`, data);
    return response.data;
  },

  updateSuggestion: async (encounterId: string, suggestionId: string, data: {
    action: 'shown' | 'accepted' | 'modified' | 'rejected';
    modifiedContent?: string;
  }): Promise<ResearchSuggestion> => {
    const response = await axios.put(
      `${API_BASE_URL}/research/encounters/${encounterId}/suggestions/${suggestionId}`,
      data
    );
    return response.data;
  }
};

// WebSocket connection for real-time updates
export const connectResearchWebSocket = (doctor_id: string, onUpdate: (data: any) => void) => {
  const ws = socket.connect(`/ws/research/${doctor_id}`);
  
  ws.on('connect', () => {
    console.log('Connected to research WebSocket');
  });

  ws.on('update', (data: any) => {
    onUpdate(data);
  });

  ws.on('error', (error: any) => {
    console.error('Research WebSocket error:', error);
  });

  return () => {
    ws.disconnect();
  };
}; 