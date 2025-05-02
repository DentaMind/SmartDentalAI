import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ModelInfo {
  version: string;
  accuracy: number;
  lastUpdated: string;
  sampleSize: number;
  clinicAccuracy?: number;
}

interface AIModelContextType {
  globalModel: ModelInfo | null;
  clinicModel: ModelInfo | null;
  isLoading: boolean;
  refreshModels: () => void;
}

const AIModelContext = createContext<AIModelContextType>({
  globalModel: null,
  clinicModel: null,
  isLoading: false,
  refreshModels: () => {},
});

export const useAIModel = () => useContext(AIModelContext);

export const AIModelProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [globalModel, setGlobalModel] = useState<ModelInfo | null>(null);
  const [clinicModel, setClinicModel] = useState<ModelInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchModelInfo = async () => {
    setIsLoading(true);
    
    try {
      // In a real implementation, fetch from API
      // const globalResponse = await axios.get('/api/ai/metrics');
      // const clinicResponse = await axios.get('/api/ai/metrics?clinicId=current');
      
      // Mock data for development
      await new Promise(resolve => setTimeout(resolve, 600));
      
      setGlobalModel({
        version: '2.1.0',
        accuracy: 0.87,
        lastUpdated: new Date().toISOString(),
        sampleSize: 12500,
      });
      
      setClinicModel({
        version: '2.1.0-clinic-123',
        accuracy: 0.89,
        lastUpdated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        sampleSize: 350,
        clinicAccuracy: 0.91,
      });
    } catch (error) {
      console.error('Failed to fetch AI model information:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModelInfo();
  }, []);

  const refreshModels = () => {
    fetchModelInfo();
  };

  return (
    <AIModelContext.Provider
      value={{
        globalModel,
        clinicModel,
        isLoading,
        refreshModels,
      }}
    >
      {children}
    </AIModelContext.Provider>
  );
}; 