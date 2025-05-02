import { useState, useCallback } from 'react';
import axios from 'axios';
import { useToast } from './use-toast';
import { API_URL } from '../config/constants';

export interface AIDiagnosticFinding {
  id: string;
  tooth: string;
  type: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  location?: {
    [key: string]: any;
  };
  treatmentSuggestions?: Array<{
    procedure: string;
    description: string;
    alternatives?: string[];
    urgency?: 'routine' | 'soon' | 'urgent';
  }>;
}

export interface AIAnalysis {
  patientId: string;
  timestamp: string;
  findings: AIDiagnosticFinding[];
  summary?: string;
  overallScore?: number;
}

export interface AIDiagnosis {
  id?: string;
  findings?: string[];
  recommendations?: string[];
  confidence: number;
  timestamp?: number;
}

export const useAIDiagnosis = () => {
  const [aiDiagnosis, setAIDiagnosis] = useState<AIDiagnosis | null>(null);
  const [diagnosisLoading, setDiagnosisLoading] = useState(false);
  const [diagnosisError, setDiagnosisError] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * Run a new AI diagnosis
   * @param patientId - ID of the patient
   * @returns The diagnosis result
   */
  const runNewDiagnosis = async (patientId: string): Promise<AIDiagnosis> => {
    setDiagnosisLoading(true);
    setDiagnosisError(null);

    try {
      // In production, this would call the actual API
      // For demo purposes, we'll simulate a response
      
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Sample diagnosis response
      const diagnosisResult: AIDiagnosis = {
        id: `diag-${Date.now()}`,
        findings: [
          'Dental caries detected on tooth #14 (distal surface)',
          'Incipient caries on tooth #30 (occlusal surface)',
          'Moderate bone loss in the posterior region',
          'Periapical radiolucency associated with tooth #19'
        ],
        recommendations: [
          'Restoration recommended for tooth #14',
          'Preventive resin restoration for tooth #30',
          'Periodontal evaluation and possible treatment',
          'Endodontic consultation for tooth #19'
        ],
        confidence: 0.87,
        timestamp: Date.now()
      };
      
      setAIDiagnosis(diagnosisResult);
      return diagnosisResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setDiagnosisError(errorMessage);
      throw error;
    } finally {
      setDiagnosisLoading(false);
    }
  };

  // Fetch AI diagnosis for a patient
  const getAIDiagnosis = useCallback(async (patientId: string) => {
    if (!patientId) return null;
    
    try {
      setDiagnosisLoading(true);
      setDiagnosisError(null);
      
      // In a real implementation, fetch from API
      // const response = await axios.get(`/api/ai/diagnosis/${patientId}`);
      
      // For development, use mock data
      await new Promise(resolve => setTimeout(resolve, 700)); // Simulate API delay
      
      // Generate mock AI findings for testing
      const mockFindings: AIDiagnosticFinding[] = [
        {
          id: 'finding-1',
          tooth: '3',
          type: 'Recurrent Caries',
          confidence: 0.92,
          severity: 'high',
          description: 'Recurrent decay detected at the margin of existing crown on distal surface.',
          location: {
            surface: 'D',
            area: 'cervical'
          },
          treatmentSuggestions: [
            {
              procedure: 'Crown Replacement',
              description: 'Remove existing crown, remove caries, and place new crown.',
              alternatives: ['Large Class II Composite'],
              urgency: 'soon'
            }
          ]
        },
        {
          id: 'finding-2',
          tooth: '14',
          type: 'Periapical Radiolucency',
          confidence: 0.86,
          severity: 'medium',
          description: 'Apical radiolucency detected, approximately 3mm in diameter.',
          location: {
            area: 'apical'
          },
          treatmentSuggestions: [
            {
              procedure: 'Root Canal Therapy',
              description: 'Endodontic treatment recommended to address apical pathology.',
              urgency: 'routine'
            }
          ]
        },
        {
          id: 'finding-3',
          tooth: '19',
          type: 'Crown Fracture',
          confidence: 0.78,
          severity: 'medium',
          description: 'Hairline fracture detected on mesial-lingual cusp of existing PFM crown.',
          location: {
            surface: 'ML',
            area: 'occlusal'
          },
          treatmentSuggestions: [
            {
              procedure: 'Crown Replacement',
              description: 'Replace fractured crown to prevent further damage.',
              alternatives: ['Monitor if asymptomatic'],
              urgency: 'routine'
            }
          ]
        },
        {
          id: 'finding-4',
          tooth: '30',
          type: 'Impacted Tooth',
          confidence: 0.95,
          severity: 'medium',
          description: 'Mesioangular impaction with potential pressure on adjacent tooth.',
          location: {
            position: 'mesioangular'
          },
          treatmentSuggestions: [
            {
              procedure: 'Surgical Extraction',
              description: 'Surgical removal recommended to prevent complications.',
              alternatives: ['Monitor with periodic radiographs'],
              urgency: 'routine'
            }
          ]
        },
        {
          id: 'finding-5',
          tooth: '9',
          type: 'Interproximal Caries',
          confidence: 0.82,
          severity: 'low',
          description: 'Early interproximal decay detected on distal surface.',
          location: {
            surface: 'D',
            area: 'interproximal'
          },
          treatmentSuggestions: [
            {
              procedure: 'Class III Composite',
              description: 'Conservative restoration recommended to address early decay.',
              alternatives: ['Remineralization therapy', 'Silver Diamine Fluoride'],
              urgency: 'routine'
            }
          ]
        }
      ];
      
      // Create mock analysis
      const mockAnalysis: AIAnalysis = {
        patientId,
        timestamp: new Date().toISOString(),
        findings: mockFindings,
        summary: 'AI analysis detected 5 findings requiring attention. Most significant issues include recurrent caries on tooth #3 and impacted tooth #30.',
        overallScore: 72
      };
      
      setAIDiagnosis(mockAnalysis);
      return mockAnalysis;
    } catch (err: any) {
      const errorMsg = err.message || 'An error occurred while fetching the AI diagnosis';
      setDiagnosisError(errorMsg);
      console.error('AI diagnosis fetch error:', err);
      
      toast({
        variant: 'destructive',
        title: 'Diagnosis failed',
        description: 'Could not fetch AI diagnosis',
      });
      
      return null;
    } finally {
      setDiagnosisLoading(false);
    }
  }, [toast]);
  
  // Approve an AI finding
  const approveFinding = useCallback(async (findingId: string) => {
    if (!findingId) return false;
    
    try {
      // In a real implementation, call API
      // const response = await axios.post(`/api/ai/feedback`, {
      //   finding_id: findingId,
      //   is_correct: true
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      toast({
        title: 'Finding approved',
        description: 'The AI finding has been confirmed.',
      });
      
      return true;
    } catch (err: any) {
      console.error('Error approving finding:', err);
      
      toast({
        variant: 'destructive',
        title: 'Approval failed',
        description: 'Could not approve finding',
      });
      
      return false;
    }
  }, [toast]);
  
  // Reject an AI finding
  const rejectFinding = useCallback(async (findingId: string) => {
    if (!findingId) return false;
    
    try {
      // In a real implementation, call API
      // const response = await axios.post(`/api/ai/feedback`, {
      //   finding_id: findingId,
      //   is_correct: false
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      toast({
        title: 'Finding rejected',
        description: 'The AI finding has been rejected.',
      });
      
      return true;
    } catch (err: any) {
      console.error('Error rejecting finding:', err);
      
      toast({
        variant: 'destructive',
        title: 'Rejection failed',
        description: 'Could not reject finding',
      });
      
      return false;
    }
  }, [toast]);
  
  return {
    aiDiagnosis,
    diagnosisLoading,
    diagnosisError,
    getAIDiagnosis,
    approveFinding,
    rejectFinding,
    runNewDiagnosis
  };
}; 