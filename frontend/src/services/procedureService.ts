import axios from 'axios';
import { API_BASE_URL } from '../config';

// Types
export enum ProcedureCategory {
  PREVENTIVE = 'preventive',
  RESTORATIVE = 'restorative',
  ENDODONTIC = 'endodontic',
  PERIODONTAL = 'periodontal',
  ORTHODONTIC = 'orthodontic',
  PROSTHODONTIC = 'prosthodontic',
  SURGICAL = 'surgical',
  OTHER = 'other'
}

export interface ProcedureBase {
  code: string;
  name: string;
  description: string;
  category: ProcedureCategory;
  default_duration_minutes: number;
}

export interface Procedure extends ProcedureBase {
  id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProcedureRequirements {
  pre_operative: string[];
  post_operative: string[];
  equipment: string[];
  staff_requirements: number;
  room_requirements: string[];
}

export interface ProcedureStatistics {
  total_procedures: number;
  active_procedures: number;
  category_counts: Record<string, number>;
}

export interface ProviderDurationProfile {
  average_duration_minutes: number;
  duration_modifier: number;
  total_procedures: number;
}

class ProcedureService {
  private api = axios.create({
    baseURL: `${API_BASE_URL}/procedures`,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // List procedures with optional filtering
  async listProcedures(params?: {
    query?: string;
    category?: ProcedureCategory;
    active_only?: boolean;
  }): Promise<Procedure[]> {
    const response = await this.api.get<Procedure[]>('/', { params });
    return response.data;
  }

  // Get procedure by ID
  async getProcedure(id: string): Promise<Procedure> {
    const response = await this.api.get<Procedure>(`/${id}`);
    return response.data;
  }

  // Get procedure by ADA code
  async getProcedureByCode(code: string): Promise<Procedure> {
    const response = await this.api.get<Procedure>(`/code/${code}`);
    return response.data;
  }

  // Create new procedure
  async createProcedure(procedure: ProcedureBase): Promise<Procedure> {
    const response = await this.api.post<Procedure>('/', procedure);
    return response.data;
  }

  // Update existing procedure
  async updateProcedure(
    id: string,
    updates: Partial<ProcedureBase & { is_active?: boolean }>
  ): Promise<Procedure> {
    const response = await this.api.put<Procedure>(`/${id}`, updates);
    return response.data;
  }

  // Deactivate procedure
  async deactivateProcedure(id: string): Promise<void> {
    await this.api.delete(`/${id}`);
  }

  // Get procedure requirements
  async getProcedureRequirements(id: string): Promise<ProcedureRequirements> {
    const response = await this.api.get<ProcedureRequirements>(`/${id}/requirements`);
    return response.data;
  }

  // Get provider duration for a procedure
  async getProviderDuration(
    procedureId: string,
    providerId: string
  ): Promise<number> {
    const response = await this.api.get<{ duration_minutes: number }>(
      `/${procedureId}/duration/${providerId}`
    );
    return response.data.duration_minutes;
  }

  // Update provider duration tracking
  async updateProviderDuration(
    procedureId: string,
    providerId: string,
    actualDuration: number
  ): Promise<{
    message: string;
    profile: ProviderDurationProfile;
  }> {
    const response = await this.api.post<{
      message: string;
      profile: ProviderDurationProfile;
    }>(`/${procedureId}/duration/${providerId}`, null, {
      params: { actual_duration: actualDuration },
    });
    return response.data;
  }

  // Get procedure statistics
  async getStatistics(): Promise<ProcedureStatistics> {
    const response = await this.api.get<ProcedureStatistics>('/statistics');
    return response.data;
  }

  // Search procedures with debounce
  private searchTimeout: NodeJS.Timeout | null = null;
  async searchProcedures(
    query: string,
    category?: ProcedureCategory
  ): Promise<Procedure[]> {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    return new Promise((resolve) => {
      this.searchTimeout = setTimeout(async () => {
        const procedures = await this.listProcedures({ query, category });
        resolve(procedures);
      }, 300); // 300ms debounce
    });
  }

  // Get procedures by category
  async getProceduresByCategory(category: ProcedureCategory): Promise<Procedure[]> {
    return this.listProcedures({ category, active_only: true });
  }

  // Get active procedures only
  async getActiveProcedures(): Promise<Procedure[]> {
    return this.listProcedures({ active_only: true });
  }

  // Get procedure duration with provider adjustment
  async getAdjustedDuration(
    procedureId: string,
    providerId: string
  ): Promise<{
    baseDuration: number;
    adjustedDuration: number;
    modifier: number;
  }> {
    const procedure = await this.getProcedure(procedureId);
    const providerDuration = await this.getProviderDuration(procedureId, providerId);
    
    return {
      baseDuration: procedure.default_duration_minutes,
      adjustedDuration: providerDuration,
      modifier: providerDuration / procedure.default_duration_minutes,
    };
  }
}

// Export singleton instance
export const procedureService = new ProcedureService(); 