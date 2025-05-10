/**
 * Zod to OpenAPI Converter
 * 
 * Utility functions to convert Zod schemas to OpenAPI specification
 */

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  paths: Record<string, any>;
  components?: {
    schemas?: Record<string, any>;
    securitySchemes?: Record<string, any>;
  };
}

/**
 * Convert a collection of Zod schemas organized by endpoint to OpenAPI specification
 */
export function zodsToOpenApi(
  contracts: Record<string, Record<string, any>>, 
  options: {
    title?: string;
    version?: string;
    description?: string;
  } = {}
): OpenAPISpec {
  const schemas: Record<string, any> = {};
  const paths: Record<string, any> = {};

  // Process each endpoint
  Object.entries(contracts).forEach(([endpoint, methods]) => {
    const pathItem: Record<string, any> = {};
    
    // Process each method (GET, POST, etc) for the endpoint
    Object.entries(methods).forEach(([method, definition]) => {
      const methodLower = method.toLowerCase();
      const operation: Record<string, any> = {
        summary: definition.summary || '',
        description: definition.description || '',
        tags: definition.tags || [],
        responses: {}
      };

      // Add request body schema if present
      if (definition.request?.body) {
        const bodySchema = zodToJsonSchema(definition.request.body);
        const schemaName = `${endpoint.replace(/\//g, '_')}_${methodLower}_request_body`;
        schemas[schemaName] = bodySchema;
        
        operation.requestBody = {
          content: {
            'application/json': {
              schema: { $ref: `#/components/schemas/${schemaName}` }
            }
          },
          required: true
        };
      }

      // Add query parameters if present
      if (definition.request?.query) {
        const querySchema = zodToJsonSchema(definition.request.query);
        operation.parameters = operation.parameters || [];
        
        if (querySchema.properties) {
          Object.entries(querySchema.properties).forEach(([paramName, paramSchema]: [string, any]) => {
            operation.parameters.push({
              name: paramName,
              in: 'query',
              description: paramSchema.description || '',
              required: querySchema.required?.includes(paramName) || false,
              schema: paramSchema
            });
          });
        }
      }

      // Add path parameters if present
      if (definition.request?.params) {
        const paramsSchema = zodToJsonSchema(definition.request.params);
        operation.parameters = operation.parameters || [];
        
        if (paramsSchema.properties) {
          Object.entries(paramsSchema.properties).forEach(([paramName, paramSchema]: [string, any]) => {
            operation.parameters.push({
              name: paramName,
              in: 'path',
              description: paramSchema.description || '',
              required: true, // Path parameters are always required
              schema: paramSchema
            });
          });
        }
      }

      // Add response schemas
      if (definition.response) {
        Object.entries(definition.response).forEach(([statusCode, responseSchema]) => {
          if (!responseSchema) return;
          
          const jsonSchema = zodToJsonSchema(responseSchema as z.ZodType);
          const schemaName = `${endpoint.replace(/\//g, '_')}_${methodLower}_response_${statusCode}`;
          schemas[schemaName] = jsonSchema;
          
          operation.responses[statusCode] = {
            description: definition.responseDescriptions?.[statusCode] || `${statusCode} response`,
            content: {
              'application/json': {
                schema: { $ref: `#/components/schemas/${schemaName}` }
              }
            }
          };
        });
      }

      // Add default error responses if not specified
      if (!operation.responses['400']) {
        operation.responses['400'] = {
          description: 'Bad request',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        };
      }
      
      if (!operation.responses['500']) {
        operation.responses['500'] = {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        };
      }

      pathItem[methodLower] = operation;
    });

    paths[endpoint] = pathItem;
  });

  // Add common error schema if not present
  if (!schemas['ErrorResponse']) {
    schemas['ErrorResponse'] = {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
        statusCode: { type: 'integer' }
      },
      required: ['error', 'message', 'statusCode']
    };
  }

  return {
    openapi: '3.0.3',
    info: {
      title: options.title || 'DentaMind API',
      version: options.version || '1.0.0',
      description: options.description || 'DentaMind API generated from Zod schemas'
    },
    paths,
    components: {
      schemas,
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  };
}

/**
 * Generate schema name for a specific endpoint and method
 */
export function generateSchemaName(endpoint: string, method: string, type: 'request' | 'response', statusCode?: string): string {
  const base = `${endpoint.replace(/\//g, '_')}_${method.toLowerCase()}_${type}`;
  return statusCode ? `${base}_${statusCode}` : base;
} 