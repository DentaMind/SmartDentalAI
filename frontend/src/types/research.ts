export enum ResearchMode {
  CLINICAL = 'clinical',
  TRAINING = 'training'
}

export enum SuggestionAction {
  SHOWN = 'shown',
  ACCEPTED = 'accepted',
  MODIFIED = 'modified',
  REJECTED = 'rejected'
}

export interface ResearchEncounter {
  id: string;
  doctor_id: string;
  patient_id: string;
  mode: 'clinical' | 'training';
  start_time: string;
  end_time?: string;
  duration?: number;
  diagnosis?: string;
  treatment_plan?: string;
  confidence?: number;
  patient_acceptance?: boolean;
  suggestions: ResearchSuggestion[];
  status: 'active' | 'completed' | 'abandoned';
  created_at: string;
  updated_at: string;
}

export interface ResearchSuggestion {
  id: string;
  encounter_id: string;
  type: string;
  content: string;
  confidence: number;
  action: 'shown' | 'accepted' | 'modified' | 'rejected';
  modified_content?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ResearchMetrics {
  doctor_id: string;
  total_encounters: number;
  clinical_encounters: number;
  training_encounters: number;
  avg_encounter_duration: number;
  total_suggestions: number;
  suggestions_shown: number;
  suggestions_accepted: number;
  suggestions_modified: number;
  suggestions_rejected: number;
  avg_confidence: number;
  patient_acceptance_rate: number;
  last_updated: string;
}

export interface ResearchSummary {
  doctor_id: string;
  doctor_name: string;
  total_encounters: number;
  clinical_encounters: number;
  training_encounters: number;
  suggestion_acceptance_rate: number;
  patient_acceptance_rate: number;
  avg_confidence: number;
  last_encounter: string;
} 