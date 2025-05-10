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
