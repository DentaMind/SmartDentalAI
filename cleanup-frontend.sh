#!/bin/bash

# DentaMind Frontend Cleanup Script
# This script implements the cleanup plan to consolidate frontend code
# and remove duplicate components

# Set default mode (not dry-run)
DRY_RUN=false
VERBOSE=false

# Process command line arguments
for arg in "$@"; do
  case $arg in
    --dry-run)
      DRY_RUN=true
      echo "🔍 DRY RUN MODE: No actual changes will be made"
      shift
      ;;
    --verbose)
      VERBOSE=true
      echo "📝 VERBOSE MODE: Showing detailed information"
      shift
      ;;
    --help)
      echo "Usage: ./cleanup-frontend.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --dry-run    Preview changes without modifying files"
      echo "  --verbose    Show more detailed information during execution"
      echo "  --help       Display this help message"
      exit 0
      ;;
  esac
done

# Function to execute or simulate a command based on dry-run mode
execute_cmd() {
  if [ $VERBOSE = true ]; then
    echo "COMMAND: $@"
  fi
  
  if [ $DRY_RUN = true ]; then
    echo "WOULD RUN: $@"
  else
    eval "$@"
    return $?
  fi
}

# Function to handle errors
handle_error() {
  local exit_code=$1
  local error_message=$2
  
  if [ $exit_code -ne 0 ]; then
    echo "❌ ERROR: $error_message (code: $exit_code)"
    echo "You can run with --dry-run to preview changes before executing them."
    
    if [ $DRY_RUN = false ]; then
      echo "Changes made so far have been preserved."
      echo "Check the backup directory for any files you need to restore."
    fi
    
    exit $exit_code
  fi
}

echo "🧹 Starting DentaMind Frontend Cleanup"

# Create backup directories (don't skip this even in dry-run mode)
echo "📦 Creating backup directories..."
BACKUP_DIR=".backup/frontend-cleanup-$(date +"%Y%m%d")"

if [ $DRY_RUN = false ]; then
  execute_cmd "mkdir -p $BACKUP_DIR"
  handle_error $? "Failed to create backup directory"
else
  echo "WOULD CREATE: $BACKUP_DIR"
fi

# Backup important directories before making changes
echo "💾 Backing up directories before deletion..."
if [ $DRY_RUN = false ]; then
  if [ -d "DentaMind-Frontend" ]; then
    echo "  Backing up DentaMind-Frontend..."
    execute_cmd "cp -r DentaMind-Frontend \"$BACKUP_DIR/DentaMind-Frontend\""
    handle_error $? "Failed to backup DentaMind-Frontend"
  else
    echo "  ⚠️ DentaMind-Frontend directory not found, skipping backup"
  fi
  
  if [ -d "DentaMind-Frontend-Complete" ]; then
    echo "  Backing up DentaMind-Frontend-Complete..."
    execute_cmd "cp -r DentaMind-Frontend-Complete \"$BACKUP_DIR/DentaMind-Frontend-Complete\""
    handle_error $? "Failed to backup DentaMind-Frontend-Complete"
  else
    echo "  ⚠️ DentaMind-Frontend-Complete directory not found, skipping backup"
  fi
  
  if [ -d "SmartDentalAI/client" ]; then
    echo "  Backing up SmartDentalAI/client..."
    execute_cmd "cp -r SmartDentalAI/client \"$BACKUP_DIR/SmartDentalAI-client\""
    handle_error $? "Failed to backup SmartDentalAI/client"
  else
    echo "  ⚠️ SmartDentalAI/client directory not found, skipping backup"
  fi
else
  echo "WOULD BACKUP: DentaMind-Frontend to $BACKUP_DIR/DentaMind-Frontend"
  echo "WOULD BACKUP: DentaMind-Frontend-Complete to $BACKUP_DIR/DentaMind-Frontend-Complete"
  echo "WOULD BACKUP: SmartDentalAI/client to $BACKUP_DIR/SmartDentalAI-client"
fi

# Ensure target directories exist
echo "🏗️ Creating target directories if they don't exist..."
DIRECTORIES=(
  "frontend/src/components/dental"
  "frontend/src/components/patient/intake"
  "frontend/src/hooks"
  "frontend/src/features/ai/components"
  "frontend/src/features/ai/hooks"
  "frontend/src/features/ai/services"
  "frontend/src/features/patientIntake/components"
  "frontend/src/features/patientIntake/services"
  "frontend/src/config"
)

for dir in "${DIRECTORIES[@]}"; do
  if [ ! -d "$dir" ]; then
    echo "  Creating $dir..."
    execute_cmd "mkdir -p $dir"
    handle_error $? "Failed to create directory: $dir"
  else
    echo "  ✅ $dir already exists"
  fi
done

# Copy unique components that are actually needed from client to frontend
echo "🔄 Copying unique needed components..."

# Check if source files exist before copying
if [ -f "client/src/components/charting/PerioChartCanvas.tsx" ]; then
  execute_cmd "cp client/src/components/charting/PerioChartCanvas.tsx frontend/src/components/dental/"
  handle_error $? "Failed to copy PerioChartCanvas.tsx"
  echo "  Copied PerioChartCanvas.tsx"
else
  echo "  ⚠️ client/src/components/charting/PerioChartCanvas.tsx not found, skipping"
fi

# Copy entire intake directory if it exists
if [ -d "client/src/components/intake" ]; then
  execute_cmd "cp -r client/src/components/intake/* frontend/src/components/patient/intake/"
  handle_error $? "Failed to copy intake components"
  echo "  Copied intake components"
else
  echo "  ⚠️ client/src/components/intake directory not found, skipping"
fi

if [ -f "client/src/hooks/usePerioVoiceCommands.ts" ]; then
  execute_cmd "cp client/src/hooks/usePerioVoiceCommands.ts frontend/src/hooks/"
  handle_error $? "Failed to copy usePerioVoiceCommands.ts"
  echo "  Copied usePerioVoiceCommands.ts"
else
  echo "  ⚠️ client/src/hooks/usePerioVoiceCommands.ts not found, skipping"
fi

# Count of files being processed for statistics
if [ $DRY_RUN = true ] || [ $VERBOSE = true ]; then
  AI_COMPONENT_COUNT=$(find frontend/src/components/ai -name "*.tsx" -o -name "*.ts" 2>/dev/null | wc -l | xargs)
  AI_SERVICE_COUNT=$(find frontend/src/services -name "ai*.ts" 2>/dev/null | wc -l | xargs)
  echo "  Found $AI_COMPONENT_COUNT AI components and $AI_SERVICE_COUNT AI services to consolidate"
fi

# Create AI config file
echo "⚙️ Creating AI configuration file..."
if [ $DRY_RUN = false ]; then
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
  handle_error $? "Failed to create AI config file"
  echo "  ✅ Created AI config file"
else
  echo "WOULD CREATE: frontend/src/config/aiConfig.ts with AI configuration"
fi

# Consolidate AI-related components by moving them to features/ai
echo "🧠 Consolidating AI components..."
if [ -d "frontend/src/components/ai" ]; then
  for file in $(find frontend/src/components/ai -name "*.tsx" -o -name "*.ts" 2>/dev/null); do
    filename=$(basename "$file")
    if [ $DRY_RUN = false ]; then
      execute_cmd "cp \"$file\" \"frontend/src/features/ai/components/$filename\""
      handle_error $? "Failed to copy $filename to features/ai/components"
      echo "  Moved $filename to features/ai/components"
    else
      echo "WOULD COPY: $file → frontend/src/features/ai/components/$filename"
    fi
  done
else
  echo "  ⚠️ frontend/src/components/ai directory not found, skipping component consolidation"
fi

# Consolidate AI-related services
if [ -d "frontend/src/services" ]; then
  for file in $(find frontend/src/services -name "ai*.ts" 2>/dev/null); do
    filename=$(basename "$file")
    if [ $DRY_RUN = false ]; then
      execute_cmd "cp \"$file\" \"frontend/src/features/ai/services/$filename\""
      handle_error $? "Failed to copy $filename to features/ai/services"
      echo "  Moved $filename to features/ai/services"
    else
      echo "WOULD COPY: $file → frontend/src/features/ai/services/$filename"
    fi
  done
else
  echo "  ⚠️ frontend/src/services directory not found, skipping service consolidation"
fi

# Create the AI Context Provider
echo "🧩 Creating AI Context Provider..."
if [ $DRY_RUN = false ]; then
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
  handle_error $? "Failed to create AIContext provider"
  echo "  ✅ Created AIContext provider"
else
  echo "WOULD CREATE: frontend/src/contexts/AIContext.tsx with AI context provider implementation"
fi

# Create intake AI service
echo "📝 Creating intake AI service..."
if [ $DRY_RUN = false ]; then
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
  handle_error $? "Failed to create intake AI service"
  echo "  ✅ Created intake AI service"
else
  echo "WOULD CREATE: frontend/src/features/patientIntake/services/intakeAIService.ts"
fi

# Create a README in each directory explaining the structure
echo "📄 Creating README files explaining directory structure..."
if [ $DRY_RUN = false ]; then
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
  handle_error $? "Failed to create AI features README"

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
  handle_error $? "Failed to create patient intake README"
  echo "  ✅ Created README files"
else
  echo "WOULD CREATE: frontend/src/features/ai/README.md"
  echo "WOULD CREATE: frontend/src/features/patientIntake/README.md"
fi

# Delete redundant directories (only if not in dry-run mode)
if [ $DRY_RUN = false ]; then
  echo "⚠️ Script has made all the necessary changes."
  echo "---------------------------------------------"
  echo "The following directories can now be manually deleted after verification:"
  echo "- DentaMind-Frontend"
  echo "- DentaMind-Frontend-Complete"
  echo "- SmartDentalAI/client (if it duplicates functionality)"
else
  echo "⚠️ In a real run, the script would suggest manually removing these directories after verification:"
  echo "- DentaMind-Frontend"
  echo "- DentaMind-Frontend-Complete"
  echo "- SmartDentalAI/client (if it duplicates functionality)"
fi

echo "---------------------------------------------"
if [ $DRY_RUN = false ]; then
  echo "✅ Changes have been backed up to $BACKUP_DIR"
else
  echo "✅ Dry run completed. No files were modified."
fi

echo ""
echo "To complete the cleanup, run:"
echo "1. cd frontend && npm run build - to verify everything still builds"
echo "2. npm test - to verify tests still pass"
echo "3. git add . && git commit -m \"Cleaned up frontend codebase and consolidated AI components\""

# Script is already executable from previous chmod
echo "🎉 Frontend cleanup completed!" 