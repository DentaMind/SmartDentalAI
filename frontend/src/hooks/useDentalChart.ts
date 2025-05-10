import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { useToast } from './use-toast';

// Define types for dental chart data
export interface ToothRestoration {
  id: string;
  restoration_type: string;
  surfaces: string[];
  procedure_date: string;
  condition: string;
}

export interface ToothData {
  id: string;
  patient_id: string;
  tooth_number: string;
  status: string;
  last_updated: string;
  notes?: string;
  current_restoration?: ToothRestoration;
}

export function useDentalChart(patientId: string) {
  const [toothChart, setToothChart] = useState<ToothData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load the dental chart data
  const loadChart = useCallback(async () => {
    if (!patientId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // In a real implementation, fetch from API
      // const response = await axios.get(`/api/dental/chart/${patientId}`);
      
      // For development, use mock data
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      
      // Generate mock data for testing the UI
      const mockTeeth: ToothData[] = [];
      
      // Define some sample tooth statuses and restorations
      const statuses = ['present', 'missing', 'extracted', 'impacted', 'planned_extraction', 'planned_implant'];
      const restorationTypes = ['composite', 'amalgam', 'crown_pfm', 'crown_zirconia', 'veneer', 'implant'];
      const surfaces = ['M', 'O', 'D', 'B', 'L', 'F', 'I'];
      
      // Generate mock tooth chart data for all 32 teeth
      for (let i = 1; i <= 32; i++) {
        const toothNumber = i.toString();
        
        // Different statuses based on tooth position
        let status = 'present';
        let restoration = null;
        
        // Apply some patterns for demo purposes
        if (i === 1 || i === 16 || i === 17 || i === 32) {
          status = 'missing';
        } else if (i === 3 || i === 19) {
          restoration = {
            id: `rest-${i}`,
            restoration_type: 'crown_pfm',
            surfaces: [],
            procedure_date: new Date().toISOString(),
            condition: 'good'
          };
        } else if (i === 5 || i === 12) {
          restoration = {
            id: `rest-${i}`,
            restoration_type: 'composite',
            surfaces: ['O', 'M', 'D'],
            procedure_date: new Date().toISOString(),
            condition: 'good'
          };
        } else if (i === 8 || i === 9) {
          restoration = {
            id: `rest-${i}`,
            restoration_type: 'veneer',
            surfaces: [],
            procedure_date: new Date().toISOString(),
            condition: 'good'
          };
        } else if (i === 14 || i === 15) {
          status = 'planned_implant';
        } else if (i === 30) {
          status = 'impacted';
        }
        
        mockTeeth.push({
          id: `tooth-${i}`,
          patient_id: patientId,
          tooth_number: toothNumber,
          status,
          last_updated: new Date().toISOString(),
          notes: i % 5 === 0 ? 'Sample tooth note' : undefined,
          current_restoration: restoration
        });
      }
      
      setToothChart(mockTeeth);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching the dental chart');
      console.error('Dental chart fetch error:', err);
      
      toast({
        variant: 'destructive',
        title: 'Error loading chart',
        description: 'Could not load dental chart data',
      });
    } finally {
      setLoading(false);
    }
  }, [patientId, toast]);
  
  // Update tooth status
  const updateToothStatus = useCallback(async (toothNumber: string, status: string) => {
    if (!patientId || !toothNumber) return;
    
    try {
      setLoading(true);
      
      // In a real implementation, update via API
      // await axios.patch(`/api/dental/chart/${patientId}/tooth/${toothNumber}`, { status });
      
      // For development, update local state
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
      
      setToothChart(prev => 
        prev.map(tooth => 
          tooth.tooth_number === toothNumber 
            ? { ...tooth, status } 
            : tooth
        )
      );
      
      toast({
        title: 'Status updated',
        description: `Tooth #${toothNumber} status changed to ${status}`,
      });
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating tooth status');
      console.error('Tooth status update error:', err);
      
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: 'Could not update tooth status',
      });
    } finally {
      setLoading(false);
    }
  }, [patientId, toast]);
  
  // Update tooth restoration
  const updateRestoration = useCallback(async (
    toothNumber: string, 
    restoration: Partial<{
      restoration_type: string;
      surfaces: string[];
      notes: string;
    }>
  ) => {
    if (!patientId || !toothNumber) return;
    
    try {
      setLoading(true);
      
      // In a real implementation, update via API
      // const response = await axios.post(`/api/dental/chart/${patientId}/tooth/${toothNumber}/restoration`, restoration);
      
      // For development, update local state
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
      
      setToothChart(prev => 
        prev.map(tooth => {
          if (tooth.tooth_number === toothNumber) {
            return {
              ...tooth,
              current_restoration: {
                id: `temp-${Date.now()}`,
                restoration_type: restoration.restoration_type || 'composite',
                surfaces: restoration.surfaces || [],
                procedure_date: new Date().toISOString(),
                condition: 'good'
              }
            };
          }
          return tooth;
        })
      );
      
      toast({
        title: 'Restoration added',
        description: `Added ${restoration.restoration_type} to tooth #${toothNumber}`,
      });
    } catch (err: any) {
      setError(err.message || 'An error occurred while adding restoration');
      console.error('Restoration add error:', err);
      
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: 'Could not add restoration',
      });
    } finally {
      setLoading(false);
    }
  }, [patientId, toast]);
  
  // Load chart data on initial render
  useEffect(() => {
    if (patientId) {
      loadChart();
    }
  }, [patientId, loadChart]);
  
  return {
    toothChart,
    loading,
    error,
    loadChart,
    updateToothStatus,
    updateRestoration
  };
} 