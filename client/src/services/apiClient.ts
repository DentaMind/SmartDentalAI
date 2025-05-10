/**
 * Contract-Aware API Client
 * 
 * This service provides a strongly-typed API client that validates requests and responses
 * according to the contracts defined in apiContracts.ts.
 */

import { 
  ApiEndpointContract,
  ApiContracts, 
  ExtractPathParams,
  ExtractQueryParams,
  ExtractRequestBody,
  ExtractResponseType,
  ApiEndpointPath,
  HttpErrorSchema, 
  ValidationErrorSchema
} from '../types/apiContracts';
import { getApiBaseUrl } from '../config/environment';

/**
 * API request options
 */
interface ApiRequestOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
  cacheStrategy?: 'default' | 'no-cache' | 'reload' | 'force-cache' | 'only-if-cached';
}

/**
 * API error with parsed error details
 */
export class ApiError extends Error {
  public status: number;
  public details?: unknown;
  public validationErrors?: Array<{ field: string; message: string }>;
  public path?: string;
  
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    
    // Try to parse validation errors if present
    if (details && typeof details === 'object' && 'errors' in details) {
      this.validationErrors = (details as any).errors;
    }
    
    if (details && typeof details === 'object' && 'path' in details) {
      this.path = (details as any).path;
    }
  }
  
  /**
   * Helper to check if error is a specific HTTP status
   */
  public isStatus(status: number): boolean {
    return this.status === status;
  }
  
  /**
   * Helper to check if error is unauthorized (401)
   */
  public isUnauthorized(): boolean {
    return this.status === 401;
  }
  
  /**
   * Helper to check if error is forbidden (403)
   */
  public isForbidden(): boolean {
    return this.status === 403;
  }
  
  /**
   * Helper to check if error is not found (404)
   */
  public isNotFound(): boolean {
    return this.status === 404;
  }
  
  /**
   * Helper to check if error is a validation error (400)
   */
  public isValidationError(): boolean {
    return this.status === 400 && Boolean(this.validationErrors);
  }
  
  /**
   * Helper to check if error is a server error (5xx)
   */
  public isServerError(): boolean {
    return this.status >= 500;
  }
}

/**
 * Process a path with parameters
 * e.g. /api/patients/:id -> /api/patients/123
 */
function processPath(path: string, params?: Record<string, string | number>): string {
  if (!params) return path;
  
  return path.replace(/:([a-zA-Z0-9_]+)/g, (_, key) => {
    if (params[key] === undefined) {
      throw new Error(`Missing path parameter: ${key}`);
    }
    return String(params[key]);
  });
}

/**
 * Process query parameters
 */
function processQueryParams(
  params?: Record<string, string | number | boolean | string[] | undefined>
): string {
  if (!params) return '';
  
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined) return;
    
    if (Array.isArray(value)) {
      value.forEach(v => searchParams.append(key, String(v)));
    } else {
      searchParams.append(key, String(value));
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Get authentication token
 */
function getAuthToken(): string | null {
  return localStorage.getItem('token');
}

/**
 * Contract-aware API client
 */
export class ContractApiClient {
  private baseUrl: string;
  
  constructor(baseUrl: string = getApiBaseUrl()) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }
  
  /**
   * Make a request to an API endpoint
   */
  public async request<
    TContract extends ApiEndpointContract,
    TResponse = ExtractResponseType<TContract>
  >(
    contract: TContract,
    {
      pathParams,
      queryParams,
      body,
      options = {}
    }: {
      pathParams?: ExtractPathParams<TContract>;
      queryParams?: ExtractQueryParams<TContract>;
      body?: ExtractRequestBody<TContract>;
      options?: ApiRequestOptions;
    }
  ): Promise<TResponse> {
    // Process the path with parameters
    const path = processPath(contract.path, pathParams as Record<string, string | number>);
    
    // Process query parameters
    const query = processQueryParams(queryParams as Record<string, string | number | boolean | string[] | undefined>);
    
    // Prepare request options
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');
    
    // Add authentication if required
    if (contract.requiresAuth) {
      const token = getAuthToken();
      if (!token) {
        throw new ApiError('Authentication required', 401);
      }
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    // Prepare the request
    const requestOptions: RequestInit = {
      method: contract.method,
      headers,
      cache: options.cacheStrategy ? options.cacheStrategy as RequestCache : undefined,
      signal: options.signal
    };
    
    // Add body for non-GET requests
    if (contract.method !== 'GET' && body !== undefined) {
      requestOptions.body = JSON.stringify(body);
    }
    
    // Make the request
    let response: Response;
    
    try {
      response = await fetch(`${this.baseUrl}${path}${query}`, requestOptions);
    } catch (error) {
      // Handle network errors
      if (error instanceof Error) {
        throw new ApiError(
          `Network error: ${error.message}`,
          0,
          { originalError: error }
        );
      }
      throw new ApiError('Unknown network error', 0);
    }
    
    // Check if the response is JSON
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    
    // Parse the response
    let data: unknown;
    
    if (isJson) {
      try {
        data = await response.json();
      } catch (error) {
        throw new ApiError(
          'Failed to parse response as JSON',
          response.status,
          { responseText: await response.text() }
        );
      }
    } else {
      data = await response.text();
    }
    
    // Handle error responses
    if (!response.ok) {
      // Try to parse as error response
      if (isJson) {
        // Try to parse as HTTP error
        const httpErrorResult = HttpErrorSchema.safeParse(data);
        if (httpErrorResult.success) {
          throw new ApiError(
            httpErrorResult.data.message,
            response.status,
            httpErrorResult.data
          );
        }
        
        // Try to parse as validation error
        const validationErrorResult = ValidationErrorSchema.safeParse(data);
        if (validationErrorResult.success) {
          throw new ApiError(
            validationErrorResult.data.message,
            response.status,
            validationErrorResult.data
          );
        }
      }
      
      // Fallback error
      throw new ApiError(
        `Request failed with status ${response.status}`,
        response.status,
        data
      );
    }
    
    // Parse response data with the contract schema
    try {
      if (contract.response) {
        // Validate response against the contract schema
        const parseResult = contract.response.safeParse(data);
        
        if (!parseResult.success) {
          console.error(
            `Response validation error for ${contract.path}:`,
            parseResult.error
          );
          
          throw new ApiError(
            'Response validation failed',
            500,
            { zodError: parseResult.error }
          );
        }
        
        return parseResult.data as TResponse;
      }
      
      return data as TResponse;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(
        'Response validation error',
        500,
        { originalError: error }
      );
    }
  }
  
  // Helper methods for common API operations
  
  /**
   * GET request with contract validation
   */
  public get<T extends ApiEndpointPath>(
    endpoint: T,
    {
      pathParams,
      queryParams,
      options
    }: {
      pathParams?: ExtractPathParams<typeof ApiContracts[T]>;
      queryParams?: ExtractQueryParams<typeof ApiContracts[T]>;
      options?: ApiRequestOptions;
    } = {}
  ): Promise<ExtractResponseType<typeof ApiContracts[T]>> {
    const contract = ApiContracts[endpoint];
    
    if (contract.method !== 'GET') {
      throw new Error(`Contract ${endpoint} is not a GET endpoint`);
    }
    
    return this.request(contract, {
      pathParams,
      queryParams,
      options
    });
  }
  
  /**
   * POST request with contract validation
   */
  public post<T extends ApiEndpointPath>(
    endpoint: T,
    {
      pathParams,
      queryParams,
      body,
      options
    }: {
      pathParams?: ExtractPathParams<typeof ApiContracts[T]>;
      queryParams?: ExtractQueryParams<typeof ApiContracts[T]>;
      body?: ExtractRequestBody<typeof ApiContracts[T]>;
      options?: ApiRequestOptions;
    } = {}
  ): Promise<ExtractResponseType<typeof ApiContracts[T]>> {
    const contract = ApiContracts[endpoint];
    
    if (contract.method !== 'POST') {
      throw new Error(`Contract ${endpoint} is not a POST endpoint`);
    }
    
    return this.request(contract, {
      pathParams,
      queryParams,
      body,
      options
    });
  }
  
  /**
   * PUT request with contract validation
   */
  public put<T extends ApiEndpointPath>(
    endpoint: T,
    {
      pathParams,
      queryParams,
      body,
      options
    }: {
      pathParams?: ExtractPathParams<typeof ApiContracts[T]>;
      queryParams?: ExtractQueryParams<typeof ApiContracts[T]>;
      body?: ExtractRequestBody<typeof ApiContracts[T]>;
      options?: ApiRequestOptions;
    } = {}
  ): Promise<ExtractResponseType<typeof ApiContracts[T]>> {
    const contract = ApiContracts[endpoint];
    
    if (contract.method !== 'PUT') {
      throw new Error(`Contract ${endpoint} is not a PUT endpoint`);
    }
    
    return this.request(contract, {
      pathParams,
      queryParams,
      body,
      options
    });
  }
  
  /**
   * DELETE request with contract validation
   */
  public delete<T extends ApiEndpointPath>(
    endpoint: T,
    {
      pathParams,
      queryParams,
      options
    }: {
      pathParams?: ExtractPathParams<typeof ApiContracts[T]>;
      queryParams?: ExtractQueryParams<typeof ApiContracts[T]>;
      options?: ApiRequestOptions;
    } = {}
  ): Promise<ExtractResponseType<typeof ApiContracts[T]>> {
    const contract = ApiContracts[endpoint];
    
    if (contract.method !== 'DELETE') {
      throw new Error(`Contract ${endpoint} is not a DELETE endpoint`);
    }
    
    return this.request(contract, {
      pathParams,
      queryParams,
      options
    });
  }
  
  /**
   * PATCH request with contract validation
   */
  public patch<T extends ApiEndpointPath>(
    endpoint: T,
    {
      pathParams,
      queryParams,
      body,
      options
    }: {
      pathParams?: ExtractPathParams<typeof ApiContracts[T]>;
      queryParams?: ExtractQueryParams<typeof ApiContracts[T]>;
      body?: ExtractRequestBody<typeof ApiContracts[T]>;
      options?: ApiRequestOptions;
    } = {}
  ): Promise<ExtractResponseType<typeof ApiContracts[T]>> {
    const contract = ApiContracts[endpoint];
    
    if (contract.method !== 'PATCH') {
      throw new Error(`Contract ${endpoint} is not a PATCH endpoint`);
    }
    
    return this.request(contract, {
      pathParams,
      queryParams,
      body,
      options
    });
  }
}

/**
 * Create an API client instance
 */
export function createApiClient(baseUrl?: string): ContractApiClient {
  return new ContractApiClient(baseUrl);
}

/**
 * Default API client instance
 */
export const apiClient = createApiClient();

export default apiClient; 