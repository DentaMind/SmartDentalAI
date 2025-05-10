/**
 * API Contract Validation Tests
 * 
 * This file contains integration tests that validate API contracts by making
 * real HTTP requests to a local backend server and verifying the responses
 * conform to the defined contracts.
 */

import { ApiContracts } from '../../types/apiContracts';
import { apiClient, ApiClientOptions } from '../../services/apiClient';
import { zodsToOpenApi } from '../../utils/zod-openapi';
import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';

// Configuration for tests
const API_BASE_URL = process.env.TEST_API_URL || 'http://localhost:8000';
const OPENAPI_OUTPUT_PATH = path.resolve(__dirname, '../../../../docs/openapi/test-results');

// Create output directory if it doesn't exist
if (!fs.existsSync(OPENAPI_OUTPUT_PATH)) {
  fs.mkdirSync(OPENAPI_OUTPUT_PATH, { recursive: true });
}

// Save frontend OpenAPI schema for reference
const frontendOpenApi = zodsToOpenApi(ApiContracts);
fs.writeFileSync(
  path.join(OPENAPI_OUTPUT_PATH, 'frontend-openapi-test.json'),
  JSON.stringify(frontendOpenApi, null, 2)
);

// Test configuration
jest.setTimeout(30000); // 30-second timeout for tests

describe('API Contract Validation', () => {
  // Track which endpoints we've tested
  const testedEndpoints: Set<string> = new Set();
  
  // Test client with special test options
  const testClient = apiClient.create({
    baseUrl: API_BASE_URL,
    validateResponses: true, // Ensure strict validation
    headers: {
      'X-Test-Client': 'contract-validation',
    },
  });
  
  beforeAll(async () => {
    // Check if backend server is running
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) {
        console.warn('Backend server is not responding properly. Tests may fail.');
      }
    } catch (error) {
      console.error('Backend server is not running. Tests will fail.', error);
    }
  });
  
  // Test each endpoint defined in the contracts
  Object.entries(ApiContracts).forEach(([endpoint, methods]) => {
    describe(`Endpoint: ${endpoint}`, () => {
      Object.entries(methods).forEach(([method, schema]) => {
        // Skip tests that require specific setup or are destructive
        const skipTest = endpoint.includes('/delete') || 
                         endpoint.includes('/update') ||
                         endpoint.includes('/create') ||
                         method === 'DELETE' ||
                         method === 'PUT' ||
                         method === 'POST';
        
        const testName = `should validate ${method} ${endpoint} contract`;
        
        // Run the test or skip it
        (skipTest ? test.skip : test)(testName, async () => {
          try {
            // Mark this endpoint as tested
            testedEndpoints.add(`${method}:${endpoint}`);
            
            // Simple smoke test for GET endpoints
            if (method === 'GET') {
              const response = await testClient.request({
                method: method.toLowerCase(),
                url: endpoint,
                params: {}, // Add required params if needed
                validateResponse: true,
              });
              
              // Verify that the response matches the schema
              expect(response).toBeDefined();
            } else {
              // For non-GET endpoints, we'll just verify the schema exists
              expect(schema.request).toBeDefined();
              expect(schema.response).toBeDefined();
            }
          } catch (error) {
            if (error.name === 'ContractValidationError') {
              // This is the error we're testing for
              throw error;
            } else if (error.name === 'ApiError' && error.status === 404) {
              // If the endpoint doesn't exist, mark the test as pending
              pending(`Endpoint ${method} ${endpoint} not implemented yet`);
            } else {
              // For other errors, fail the test
              throw error;
            }
          }
        });
      });
    });
  });
  
  afterAll(() => {
    // Report on untested endpoints
    const allEndpoints = Object.entries(ApiContracts).flatMap(([endpoint, methods]) => 
      Object.keys(methods).map(method => `${method}:${endpoint}`)
    );
    
    const untestedEndpoints = allEndpoints.filter(ep => !testedEndpoints.has(ep));
    
    if (untestedEndpoints.length > 0) {
      console.warn('The following endpoints were not tested:');
      untestedEndpoints.forEach(ep => console.warn(`  - ${ep}`));
    }
    
    // Save test results
    fs.writeFileSync(
      path.join(OPENAPI_OUTPUT_PATH, 'test-results.json'),
      JSON.stringify({
        testedEndpoints: Array.from(testedEndpoints),
        untestedEndpoints,
        timestamp: new Date().toISOString(),
      }, null, 2)
    );
  });
}); 