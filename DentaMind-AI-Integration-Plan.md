# DentaMind AI Integration Plan

## Current State of AI Components

Based on our analysis, the DentaMind application has several AI-related components spread across different directories:

1. **AI Diagnosis Components**:
   - `frontend/src/components/ai/AITreatmentSuggestions.tsx`
   - `frontend/src/components/ai/AITreatmentSuggestionsWithEvidence.tsx`
   - `client/src/components/ai/treatment-plan-generator.tsx`
   - `src/pages/AI/AIDiagnosis.js`

2. **AI Integration Services**:
   - `frontend/src/services/aiDiagnosticsService.ts`
   - `frontend/src/services/aiFeedbackService.ts`
   - `frontend/src/services/aiOpsService.ts`
   - `frontend/src/services/aiTreatmentSuggestionService.ts`

3. **Patient Intake with AI**:
   - Recently implemented patient intake system in `backend/api/routers/patient_intake.py`
   - Frontend components spread across different directories

## AI Integration Recommendations

### 1. Consolidate AI Components

**Approach**: Create a unified AI module in the frontend directory with clearly defined submodules.

```
frontend/src/features/ai/
├── components/
│   ├── AIDiagnosisPanel.tsx
│   ├── AITreatmentSuggestions.tsx
│   ├── AIEvidence.tsx
│   └── AIFeedbackForm.tsx
├── hooks/
│   ├── useAIDiagnosis.ts
│   └── useAITreatmentSuggestions.ts
└── services/
    ├── aiDiagnosticsService.ts
    ├── aiFeedbackService.ts
    └── aiTreatmentSuggestionService.ts
```

### 2. AI Context Provider

Create a dedicated AI Context Provider to manage AI-related state:

```typescript
// frontend/src/contexts/AIContext.tsx
import React, { createContext, useContext, useState } from 'react';
import { AIModel, DiagnosisResult, TreatmentSuggestion } from '../types/ai';

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

  // Implementation of context methods...

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
```

### 3. Patient Intake AI Assist

Enhance the patient intake form with AI assist functionality:

1. **Create unified AI service for intake forms**:

```typescript
// frontend/src/features/patientIntake/services/intakeAIService.ts
import axios from 'axios';
import { API_BASE_URL } from '../../../config/constants';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/patient-intake`,
});

// Add auth token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const intakeAIService = {
  // Get AI suggestions for intake form
  getAISuggestions: async (patientId: string, currentFormData: any) => {
    try {
      const response = await api.post(`/${patientId}/ai-suggest`, { current_form_data: currentFormData });
      return response.data;
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      throw error;
    }
  },
  
  // Save AI feedback (for training)
  submitAIFeedback: async (patientId: string, suggestionId: string, feedback: { isHelpful: boolean, comments?: string }) => {
    try {
      const response = await api.post(`/${patientId}/ai-feedback/${suggestionId}`, feedback);
      return response.data;
    } catch (error) {
      console.error('Error submitting AI feedback:', error);
      throw error;
    }
  }
};
```

2. **Create AI-assisted intake component**:

```typescript
// frontend/src/features/patientIntake/components/AIAssistedIntakeForm.tsx
import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Card, Spin } from 'antd';
import { intakeAIService } from '../services/intakeAIService';
import { IntakeForm } from '../components/IntakeForm';

export const AIAssistedIntakeForm: React.FC<{
  patientId: string;
  onComplete: (formData: any) => void;
}> = ({ patientId, onComplete }) => {
  const [form] = Form.useForm();
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [currentSection, setCurrentSection] = useState('personal_info');
  
  // Request AI suggestions when section changes
  const requestSuggestions = async () => {
    try {
      setIsLoadingSuggestions(true);
      const currentFormData = form.getFieldsValue(true);
      const suggestions = await intakeAIService.getAISuggestions(patientId, currentFormData);
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error('Failed to get AI suggestions:', error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };
  
  // Apply AI suggestions to form
  const applySuggestions = () => {
    if (!aiSuggestions) return;
    
    form.setFieldsValue(aiSuggestions.suggestions);
  };
  
  // Handle section change
  const handleSectionChange = (section: string) => {
    setCurrentSection(section);
    requestSuggestions();
  };
  
  return (
    <div>
      <IntakeForm 
        form={form}
        patientId={patientId}
        onSectionChange={handleSectionChange}
        onComplete={onComplete}
      />
      
      {isLoadingSuggestions ? (
        <Card className="ai-suggestions-card">
          <Spin size="small" />
          <span className="ml-2">AI is analyzing your data...</span>
        </Card>
      ) : aiSuggestions && (
        <Card 
          className="ai-suggestions-card"
          title="AI Suggestions" 
          extra={<Button type="primary" size="small" onClick={applySuggestions}>Apply All</Button>}
        >
          <p>Confidence: {Math.round(aiSuggestions.confidence_score * 100)}%</p>
          <div className="suggestion-items">
            {Object.entries(aiSuggestions.suggestions).map(([field, value]) => (
              <div key={field} className="suggestion-item">
                <span>{field.replace(/_/g, ' ')}:</span> <strong>{value}</strong>
              </div>
            ))}
          </div>
          
          <div className="mt-3">
            <p>Was this helpful?</p>
            <Button size="small" onClick={() => intakeAIService.submitAIFeedback(patientId, aiSuggestions.id, { isHelpful: true })}>
              👍 Yes
            </Button>
            <Button size="small" className="ml-2" onClick={() => intakeAIService.submitAIFeedback(patientId, aiSuggestions.id, { isHelpful: false })}>
              👎 No
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
```

### 4. Centralizing AI Configuration

Create a centralized configuration for AI models and settings:

```typescript
// frontend/src/config/aiConfig.ts
export const AI_MODELS = {
  GENERAL: 'general-diagnostic',
  PERIO: 'periodontal-specialist',
  RESTORATIVE: 'restorative-specialist',
  ORTHODONTIC: 'orthodontic-specialist',
};

export const AI_CONFIDENCE_LEVELS = {
  HIGH: 0.85,
  MEDIUM: 0.7,
  LOW: 0.5,
};

export const AI_FEATURE_FLAGS = {
  ENABLE_VOICE_COMMANDS: true,
  ENABLE_AUTO_SUGGESTIONS: true,
  ENABLE_AI_DIAGNOSIS: true,
  ENABLE_TREATMENT_GENERATOR: true,
};

export const AI_ENDPOINTS = {
  DIAGNOSIS: '/api/ai/diagnose',
  TREATMENT_SUGGESTIONS: '/api/ai/treatment-suggestions',
  INTAKE_SUGGESTIONS: '/api/patient-intake/:patientId/ai-suggest',
  FEEDBACK: '/api/ai/feedback',
};
```

## Implementing the Plan

### Phase 1: Consolidation (Week 1)

1. Create the folder structure for AI features
2. Implement the AIContext provider
3. Move existing AI components to the new structure
4. Update imports in dependent components

### Phase 2: Enhance Patient Intake (Week 2)

1. Implement the AIAssistedIntakeForm component
2. Create integration tests for AI suggestion functionality
3. Add feedback mechanism for AI suggestions

### Phase 3: Documentation and Refinement (Week 3)

1. Document the AI API and integration points
2. Create example workflows for AI features
3. Create monitoring and analytics for AI usage
4. Add telemetry to track AI suggestion acceptance rates

## Expected Outcomes

1. **Unified AI Experience**: Consistent AI interface across the application
2. **Improved Development Velocity**: Centralized AI services make adding new AI features faster
3. **Better Patient Experience**: Smart suggestions speed up intake process
4. **Data-Driven Improvement**: Feedback mechanisms help improve AI models over time
5. **Reduced Code Duplication**: Single source of truth for AI functionality 