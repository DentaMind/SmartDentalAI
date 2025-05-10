/**
 * API Contract Types
 * 
 * This file defines the contract between frontend and backend for all API endpoints.
 * Each endpoint has its request and response types defined with Zod validation.
 */

import { z } from 'zod';

// ==========================================================
// Shared schema components
// ==========================================================

/**
 * Common validation schemas that are reused across multiple endpoints
 */
export const CommonSchemas = {
  /**
   * UUID validation
   */
  uuid: z.string().uuid(),
  
  /**
   * Pagination parameters
   */
  paginationParams: z.object({
    page: z.number().int().positive().default(1),
    page_size: z.number().int().positive().max(100).default(20)
  }),
  
  /**
   * Date range parameters
   */
  dateRangeParams: z.object({
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  }).partial(),
  
  /**
   * Search parameter
   */
  searchParam: z.object({
    search: z.string().trim().min(1).max(100)
  }),
  
  /**
   * Success response
   */
  successResponse: z.object({
    success: z.boolean(),
    message: z.string().optional()
  }),
  
  /**
   * Error response
   */
  errorResponse: z.object({
    error: z.string(),
    detail: z.string().optional(),
    field_errors: z.record(z.string(), z.string()).optional()
  })
};

// ==========================================================
// API Endpoint Contracts
// ==========================================================

/**
 * Interface for defining API endpoint contracts
 */
export interface ApiEndpointContract<
  TPathParams = z.ZodTypeAny,
  TQueryParams = z.ZodTypeAny,
  TRequestBody = z.ZodTypeAny,
  TResponse = z.ZodTypeAny
> {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  pathParams?: TPathParams;
  queryParams?: TQueryParams;
  requestBody?: TRequestBody;
  response: TResponse;
  requiresAuth: boolean;
  tags: string[];
}

// ==========================================================
// Authentication Endpoints
// ==========================================================

/**
 * Login endpoint
 */
export const LoginContract = {
  method: 'POST',
  path: '/api/auth/login',
  description: 'Authenticate and login a user',
  requestBody: z.object({
    email: z.string().email(),
    password: z.string().min(8)
  }),
  response: z.object({
    token: z.string(),
    user: z.object({
      id: z.string().uuid(),
      email: z.string().email(),
      full_name: z.string(),
      role: z.enum(['admin', 'dentist', 'assistant', 'patient']),
      practice_id: z.string().uuid().optional()
    })
  }),
  requiresAuth: false,
  tags: ['authentication']
} as const satisfies ApiEndpointContract;

/**
 * Logout endpoint
 */
export const LogoutContract = {
  method: 'POST',
  path: '/api/auth/logout',
  description: 'Logout the currently authenticated user',
  response: CommonSchemas.successResponse,
  requiresAuth: true,
  tags: ['authentication']
} as const satisfies ApiEndpointContract;

/**
 * Current user profile endpoint
 */
export const CurrentUserContract = {
  method: 'GET',
  path: '/api/auth/profile',
  description: 'Get the currently authenticated user profile',
  response: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    full_name: z.string(),
    role: z.enum(['admin', 'dentist', 'assistant', 'patient']),
    practice_id: z.string().uuid().optional(),
    profile_image_url: z.string().url().optional(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
    last_login: z.string().datetime().optional(),
    preferences: z.record(z.string(), z.unknown()).optional()
  }),
  requiresAuth: true,
  tags: ['authentication', 'user']
} as const satisfies ApiEndpointContract;

// ==========================================================
// Patient Endpoints
// ==========================================================

/**
 * Patient schema
 */
export const PatientSchema = z.object({
  id: z.string().uuid(),
  practice_id: z.string().uuid(),
  full_name: z.string(),
  date_of_birth: z.string(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postal_code: z.string().optional(),
    country: z.string().optional()
  }).optional(),
  insurance: z.object({
    provider: z.string().optional(),
    policy_number: z.string().optional(),
    group_number: z.string().optional(),
    primary_holder: z.string().optional(),
    relationship: z.string().optional()
  }).optional(),
  medical_history: z.object({
    allergies: z.array(z.string()).optional(),
    medications: z.array(z.string()).optional(),
    conditions: z.array(z.string()).optional(),
    notes: z.string().optional()
  }).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});

/**
 * Get all patients endpoint
 */
export const GetPatientsContract = {
  method: 'GET',
  path: '/api/patients',
  description: 'Get a list of patients',
  queryParams: z.object({
    ...CommonSchemas.paginationParams.shape,
    ...CommonSchemas.searchParam.shape,
    practice_id: z.string().uuid().optional()
  }).partial(),
  response: z.object({
    items: z.array(PatientSchema),
    total: z.number().int(),
    page: z.number().int(),
    page_size: z.number().int(),
    total_pages: z.number().int()
  }),
  requiresAuth: true,
  tags: ['patients']
} as const satisfies ApiEndpointContract;

/**
 * Get a single patient endpoint
 */
export const GetPatientContract = {
  method: 'GET',
  path: '/api/patients/:id',
  description: 'Get a single patient by ID',
  pathParams: z.object({
    id: z.string().uuid()
  }),
  response: PatientSchema,
  requiresAuth: true,
  tags: ['patients']
} as const satisfies ApiEndpointContract;

/**
 * Create a patient endpoint
 */
export const CreatePatientContract = {
  method: 'POST',
  path: '/api/patients',
  description: 'Create a new patient',
  requestBody: PatientSchema.omit({ 
    id: true, 
    created_at: true, 
    updated_at: true 
  }),
  response: PatientSchema,
  requiresAuth: true,
  tags: ['patients']
} as const satisfies ApiEndpointContract;

/**
 * Update a patient endpoint
 */
export const UpdatePatientContract = {
  method: 'PUT',
  path: '/api/patients/:id',
  description: 'Update an existing patient',
  pathParams: z.object({
    id: z.string().uuid()
  }),
  requestBody: PatientSchema.omit({ 
    id: true, 
    created_at: true, 
    updated_at: true 
  }).partial(),
  response: PatientSchema,
  requiresAuth: true,
  tags: ['patients']
} as const satisfies ApiEndpointContract;

/**
 * Delete a patient endpoint
 */
export const DeletePatientContract = {
  method: 'DELETE',
  path: '/api/patients/:id',
  description: 'Delete a patient',
  pathParams: z.object({
    id: z.string().uuid()
  }),
  response: CommonSchemas.successResponse,
  requiresAuth: true,
  tags: ['patients']
} as const satisfies ApiEndpointContract;

// ==========================================================
// X-ray Analysis Endpoints
// ==========================================================

/**
 * X-ray analysis findings schema
 */
export const XRayFindingSchema = z.object({
  id: z.string().uuid(),
  type: z.enum([
    'caries', 
    'periapical_lesion', 
    'periodontal_disease',
    'impacted_tooth',
    'bone_loss',
    'root_fracture',
    'calculus',
    'other'
  ]),
  tooth_number: z.array(z.number().int().min(1).max(32)).optional(),
  quadrant: z.enum(['upper_right', 'upper_left', 'lower_right', 'lower_left']).optional(),
  confidence: z.number().min(0).max(1),
  severity: z.enum(['mild', 'moderate', 'severe']).optional(),
  location: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number()
  }).optional(),
  notes: z.string().optional()
});

/**
 * X-ray analysis result schema
 */
export const XRayAnalysisSchema = z.object({
  id: z.string().uuid(),
  patient_id: z.string().uuid(),
  image_id: z.string().uuid(),
  image_url: z.string().url(),
  analysis_type: z.enum(['panoramic', 'bitewing', 'periapical', 'cephalometric', 'cbct']),
  findings: z.array(XRayFindingSchema),
  overall_confidence: z.number().min(0).max(1),
  summary: z.string(),
  created_at: z.string().datetime(),
  analyzed_by: z.enum(['ai', 'dentist', 'both']),
  dentist_id: z.string().uuid().optional(),
  dentist_notes: z.string().optional(),
  dentist_reviewed_at: z.string().datetime().optional()
});

/**
 * Submit X-ray for analysis endpoint
 */
export const SubmitXRayAnalysisContract = {
  method: 'POST',
  path: '/api/xray/analyze',
  description: 'Submit an X-ray image for AI analysis',
  requestBody: z.object({
    patient_id: z.string().uuid(),
    image_id: z.string().uuid(),
    analysis_type: z.enum(['panoramic', 'bitewing', 'periapical', 'cephalometric', 'cbct'])
  }),
  response: z.object({
    analysis_id: z.string().uuid(),
    status: z.enum(['queued', 'processing', 'completed', 'failed']),
    estimated_completion_time: z.string().datetime().optional()
  }),
  requiresAuth: true,
  tags: ['x-ray', 'ai']
} as const satisfies ApiEndpointContract;

/**
 * Get X-ray analysis results endpoint
 */
export const GetXRayAnalysisContract = {
  method: 'GET',
  path: '/api/xray/analysis/:id',
  description: 'Get the results of an X-ray analysis',
  pathParams: z.object({
    id: z.string().uuid()
  }),
  response: XRayAnalysisSchema,
  requiresAuth: true,
  tags: ['x-ray', 'ai']
} as const satisfies ApiEndpointContract;

/**
 * Get X-ray analyses for a patient endpoint
 */
export const GetPatientXRayAnalysesContract = {
  method: 'GET',
  path: '/api/patients/:id/xray-analyses',
  description: 'Get all X-ray analyses for a patient',
  pathParams: z.object({
    id: z.string().uuid()
  }),
  queryParams: CommonSchemas.paginationParams,
  response: z.object({
    items: z.array(XRayAnalysisSchema),
    total: z.number().int(),
    page: z.number().int(),
    page_size: z.number().int(),
    total_pages: z.number().int()
  }),
  requiresAuth: true,
  tags: ['patients', 'x-ray', 'ai']
} as const satisfies ApiEndpointContract;

// ==========================================================
// Admin AI Metrics Endpoints
// ==========================================================

/**
 * AI performance metrics schema
 */
export const AIMetricsSchema = z.object({
  totalInferences: z.number().int(),
  averageLatency: z.number(),
  successRate: z.number(),
  averageConfidence: z.number(),
  modelUsage: z.record(z.string(), z.number().int()),
  feedbackSummary: z.object({
    accepted: z.number().int(),
    modified: z.number().int(),
    rejected: z.number().int()
  }),
  inferencesByType: z.record(z.string(), z.number().int()),
  dailyInferences: z.record(z.string(), z.number().int())
});

/**
 * Get AI performance metrics endpoint
 */
export const GetAIMetricsContract = {
  method: 'GET',
  path: '/api/admin/ai-metrics',
  description: 'Get AI system performance metrics',
  queryParams: z.object({
    ...CommonSchemas.dateRangeParams.shape,
    model_type: z.string().optional()
  }).partial(),
  response: AIMetricsSchema,
  requiresAuth: true,
  tags: ['admin', 'ai', 'metrics']
} as const satisfies ApiEndpointContract;

/**
 * Database health schema
 */
export const DbHealthSchema = z.object({
  status: z.enum(['healthy', 'warning', 'unhealthy', 'error']),
  tables: z.object({
    status: z.enum(['ok', 'warning', 'error']),
    expected_tables: z.array(z.string()),
    actual_tables: z.array(z.string()),
    missing_tables: z.array(z.string()),
    unexpected_tables: z.array(z.string())
  }),
  foreign_keys: z.object({
    status: z.enum(['ok', 'warning', 'error']),
    total_foreign_keys: z.number().int(),
    broken_foreign_keys: z.array(z.object({
      table: z.string(),
      column: z.string(),
      ref_table: z.string(),
      ref_column: z.string(),
      issue: z.string().optional()
    }))
  }),
  indexes: z.object({
    status: z.enum(['ok', 'warning', 'error']),
    missing_indexes: z.array(z.object({
      table: z.string(),
      column: z.string(),
      description: z.string().optional(),
      recommended: z.boolean().optional()
    }))
  }),
  issues: z.array(z.string()),
  check_duration_ms: z.number().int(),
  last_check_time: z.string().datetime().nullable(),
  is_stale: z.boolean()
});

/**
 * Get database health endpoint
 */
export const GetDbHealthContract = {
  method: 'GET',
  path: '/api/admin/db-health',
  description: 'Get database health status',
  queryParams: z.object({
    force_refresh: z.boolean().optional()
  }).partial(),
  response: DbHealthSchema,
  requiresAuth: true,
  tags: ['admin', 'database']
} as const satisfies ApiEndpointContract;

// ==========================================================
// All API Contracts
// ==========================================================

/**
 * All API endpoint contracts
 */
export const ApiContracts = {
  // Authentication
  Login: LoginContract,
  Logout: LogoutContract,
  CurrentUser: CurrentUserContract,
  
  // Patients
  GetPatients: GetPatientsContract,
  GetPatient: GetPatientContract,
  CreatePatient: CreatePatientContract,
  UpdatePatient: UpdatePatientContract,
  DeletePatient: DeletePatientContract,
  
  // X-ray Analysis
  SubmitXRayAnalysis: SubmitXRayAnalysisContract,
  GetXRayAnalysis: GetXRayAnalysisContract,
  GetPatientXRayAnalyses: GetPatientXRayAnalysesContract,
  
  // Admin
  GetAIMetrics: GetAIMetricsContract,
  GetDbHealth: GetDbHealthContract
} as const;

// Type helper to extract request and response types from a contract
export type ExtractRequestParams<T extends ApiEndpointContract> = 
  T['pathParams'] extends z.ZodTypeAny ? z.infer<T['pathParams']> : never;

export type ExtractQueryParams<T extends ApiEndpointContract> = 
  T['queryParams'] extends z.ZodTypeAny ? z.infer<T['queryParams']> : never;

export type ExtractRequestBody<T extends ApiEndpointContract> = 
  T['requestBody'] extends z.ZodTypeAny ? z.infer<T['requestBody']> : never;

export type ExtractResponseType<T extends ApiEndpointContract> = 
  z.infer<T['response']>;

// Type helper for endpoint paths
export type ApiEndpointPath = keyof typeof ApiContracts;

// ==========================================================
// API Response Error Types
// ==========================================================

/**
 * HTTP error response
 */
export const HttpErrorSchema = z.object({
  status: z.number().int(),
  error: z.string(),
  message: z.string(),
  path: z.string(),
  timestamp: z.string().datetime()
});

export type HttpError = z.infer<typeof HttpErrorSchema>;

/**
 * Validation error response
 */
export const ValidationErrorSchema = HttpErrorSchema.extend({
  errors: z.array(z.object({
    field: z.string(),
    message: z.string()
  }))
});

export type ValidationError = z.infer<typeof ValidationErrorSchema>; 