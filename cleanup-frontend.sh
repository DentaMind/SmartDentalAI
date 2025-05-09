#!/bin/bash

# DentaMind Frontend Cleanup Script
# This script implements the cleanup plan to consolidate frontend code
# and remove duplicate components

echo "🧹 Starting DentaMind Frontend Cleanup"

# Create backup directories
echo "📦 Creating backup directories..."
mkdir -p .backup/frontend-cleanup-$(date +"%Y%m%d")
BACKUP_DIR=".backup/frontend-cleanup-$(date +"%Y%m%d")"

# Backup important directories before making changes
echo "💾 Backing up directories before deletion..."
cp -r DentaMind-Frontend "$BACKUP_DIR/DentaMind-Frontend"
cp -r DentaMind-Frontend-Complete "$BACKUP_DIR/DentaMind-Frontend-Complete"
cp -r SmartDentalAI/client "$BACKUP_DIR/SmartDentalAI-client"

# Ensure target directories exist
echo "🏗️ Creating target directories if they don't exist..."
mkdir -p frontend/src/components/dental
mkdir -p frontend/src/components/patient/intake
mkdir -p frontend/src/hooks
mkdir -p frontend/src/features/ai/components
mkdir -p frontend/src/features/ai/hooks
mkdir -p frontend/src/features/ai/services
mkdir -p frontend/src/features/patientIntake/components
mkdir -p frontend/src/features/patientIntake/services
mkdir -p frontend/src/config

# Copy unique components that are actually needed from client to frontend
echo "🔄 Copying unique needed components..."

# Check if source files exist before copying
if [ -f "client/src/components/charting/PerioChartCanvas.tsx" ]; then
    cp client/src/components/charting/PerioChartCanvas.tsx frontend/src/components/dental/
    echo "Copied PerioChartCanvas.tsx"
fi

# Copy entire intake directory if it exists
if [ -d "client/src/components/intake" ]; then
    cp -r client/src/components/intake/* frontend/src/components/patient/intake/
    echo "Copied intake components"
fi

if [ -f "client/src/hooks/usePerioVoiceCommands.ts" ]; then
    cp client/src/hooks/usePerioVoiceCommands.ts frontend/src/hooks/
    echo "Copied usePerioVoiceCommands.ts"
fi

# Create AI config file
echo "⚙️ Creating AI configuration file..."
cat > frontend/src/config/aiConfig.ts << 'EOF'
// AI Models and Configuration
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
EOF

# Consolidate AI-related components by moving them to features/ai
echo "🧠 Consolidating AI components..."
for file in $(find frontend/src/components/ai -name "*.tsx" -o -name "*.ts"); do
    filename=$(basename "$file")
    cp "$file" "frontend/src/features/ai/components/$filename"
    echo "Moved $filename to features/ai/components"
done

# Consolidate AI-related services
for file in $(find frontend/src/services -name "ai*.ts"); do
    filename=$(basename "$file")
    cp "$file" "frontend/src/features/ai/services/$filename"
    echo "Moved $filename to features/ai/services"
done

# Create the AI Context Provider
echo "🧩 Creating AI Context Provider..."
cat > frontend/src/contexts/AIContext.tsx << 'EOF'
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
EOF

echo "✅ Created AIContext provider"

# Create intake AI service
echo "📝 Creating intake AI service..."
cat > frontend/src/features/patientIntake/services/intakeAIService.ts << 'EOF'
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
EOF

echo "✅ Created intake AI service"

# Create a README in each directory explaining the structure
echo "📄 Creating README files explaining directory structure..."
cat > frontend/src/features/ai/README.md << 'EOF'
# AI Features

This directory contains all AI-related functionality for DentaMind.

## Structure

- `/components`: UI components related to AI functionality
- `/hooks`: Custom React hooks for AI features
- `/services`: Services that interface with AI endpoints

## Usage

Import AI components and hooks from this directory rather than from individual component files.
EOF

cat > frontend/src/features/patientIntake/README.md << 'EOF'
# Patient Intake Features

This directory contains all functionality related to patient intake forms.

## Structure

- `/components`: UI components for intake forms
- `/services`: Services for saving and retrieving intake data
- `/hooks`: Custom React hooks for intake form functionality

## Integration with AI

The patient intake system integrates with AI through the `intakeAIService` to provide:

1. Auto-completion suggestions
2. Form field pre-filling
3. Medical history recommendations

Always use the AI service through the provided hooks for consistent behavior.
EOF

# Final cleanup steps - optional but recommended
echo "⚠️ Script completed the necessary changes."
echo "---------------------------------------------"
echo "The following directories can now be manually deleted after verification:"
echo "- DentaMind-Frontend"
echo "- DentaMind-Frontend-Complete"
echo "- SmartDentalAI/client (if it duplicates functionality)"
echo "---------------------------------------------"
echo "✅ Changes have been backed up to $BACKUP_DIR"
echo ""
echo "To complete the cleanup, run:"
echo "1. cd frontend && npm run build - to verify everything still builds"
echo "2. npm test - to verify tests still pass"
echo "3. git add . && git commit -m \"Cleaned up frontend codebase and consolidated AI components\""

# Make sure script has execute permissions
chmod +x cleanup-frontend.sh

echo "🎉 Frontend cleanup script created!" 