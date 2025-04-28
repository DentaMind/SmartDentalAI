import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { researchService } from '../services/researchService';
import { ResearchMetrics, ResearchSummary, ResearchEncounter, ResearchSuggestion } from '../types/research';

export const useResearchMetrics = (doctorId?: string) => {
  return useQuery<ResearchMetrics>({
    queryKey: ['research', 'metrics', doctorId],
    queryFn: () => researchService.getMetrics(doctorId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useResearchSummaries = () => {
  return useQuery<ResearchSummary[]>({
    queryKey: ['research', 'summaries'],
    queryFn: researchService.getSummaries,
    staleTime: 5 * 60 * 1000,
  });
};

export const useResearchEncounters = (doctorId?: string) => {
  return useQuery<ResearchEncounter[]>({
    queryKey: ['research', 'encounters', doctorId],
    queryFn: () => researchService.getEncounters(doctorId),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useStartEncounter = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: researchService.startEncounter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['research', 'encounters'] });
      queryClient.invalidateQueries({ queryKey: ['research', 'metrics'] });
    },
  });
};

export const useEndEncounter = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ encounterId, data }: { encounterId: string; data: any }) => 
      researchService.endEncounter(encounterId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['research', 'encounters'] });
      queryClient.invalidateQueries({ queryKey: ['research', 'metrics'] });
    },
  });
};

export const useAddSuggestion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ encounterId, data }: { encounterId: string; data: any }) => 
      researchService.addSuggestion(encounterId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['research', 'encounters'] });
    },
  });
};

export const useUpdateSuggestion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      encounterId, 
      suggestionId, 
      data 
    }: { 
      encounterId: string; 
      suggestionId: string; 
      data: any 
    }) => researchService.updateSuggestion(encounterId, suggestionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['research', 'encounters'] });
      queryClient.invalidateQueries({ queryKey: ['research', 'metrics'] });
    },
  });
}; 