import React, { createContext, useContext, useState } from 'react';

// Define the types
interface DiagnosisResult {
  id: string;
  findings: string[];
  confidence: number;
  imageIds: string[];
}

interface TreatmentSuggestion {
  id: string;
  diagnosisId: string;
  procedureCodes: string[];
  rationale: string;
  confidence: number;
}

type AIModel = 'general' | 'perio' | 'restorative' | 'orthodontic';

interface AIContextType {
  activeModel: AIModel;
  setActiveModel: (model: AIModel) => void;
  diagnosisResults: DiagnosisResult[];
  treatmentSuggestions: TreatmentSuggestion[];
  runDiagnosis: (imageIds: string[]) => Promise<DiagnosisResult[]>;
  getSuggestions: (diagnosisId: string) => Promise<TreatmentSuggestion[]>;
  confidenceThreshold: number;
  setConfidenceThreshold: (threshold: number) => void;
  isProcessing: boolean;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const AIProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [activeModel, setActiveModel] = useState<AIModel>('general');
  const [diagnosisResults, setDiagnosisResults] = useState<DiagnosisResult[]>([]);
  const [treatmentSuggestions, setTreatmentSuggestions] = useState<TreatmentSuggestion[]>([]);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.7);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Run diagnosis on images
  const runDiagnosis = async (imageIds: string[]): Promise<DiagnosisResult[]> => {
    setIsProcessing(true);
    try {
      // This would call your actual API
      const response = await fetch('/api/ai/diagnose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageIds,
          model: activeModel,
          confidenceThreshold
        }),
      });
      
      const results = await response.json();
      setDiagnosisResults(prev => [...prev, ...results]);
      return results;
    } catch (error) {
      console.error('Error running diagnosis:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Get treatment suggestions for a diagnosis
  const getSuggestions = async (diagnosisId: string): Promise<TreatmentSuggestion[]> => {
    setIsProcessing(true);
    try {
      // This would call your actual API
      const response = await fetch(`/api/ai/treatment-suggestions?diagnosisId=${diagnosisId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const suggestions = await response.json();
      setTreatmentSuggestions(prev => [...prev, ...suggestions]);
      return suggestions;
    } catch (error) {
      console.error('Error getting suggestions:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AIContext.Provider value={{
      activeModel,
      setActiveModel,
      diagnosisResults,
      treatmentSuggestions,
      runDiagnosis,
      getSuggestions,
      confidenceThreshold,
      setConfidenceThreshold,
      isProcessing
    }}>
      {children}
    </AIContext.Provider>
  );
};

export const useAI = () => {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};
