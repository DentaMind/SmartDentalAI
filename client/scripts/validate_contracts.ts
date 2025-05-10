#!/usr/bin/env node
/**
 * API & WebSocket Contract Validator
 * 
 * This script validates that the API and WebSocket contracts between
 * the frontend and backend are consistent and properly typed.
 * 
 * Usage:
 *   npm run validate-contracts
 */

import fs from 'fs';
import path from 'path';
import * as ts from 'typescript';
import { glob } from 'glob';
import { z } from 'zod';
import { WebSocketMessageType } from '../src/types/websocketMessages';
import chalk from 'chalk';

// Configuration
const CONFIG = {
  apiTypesPath: path.resolve(__dirname, '../src/types/api-types.ts'),
  websocketTypesPath: path.resolve(__dirname, '../src/types/websocketMessages.ts'),
  backendApiFolder: path.resolve(__dirname, '../../backend/api'),
  clientApiUsageFolder: path.resolve(__dirname, '../src'),
  outputFile: path.resolve(__dirname, '../reports/contract-validation.json'),
};

// Results tracking
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  apiContracts: {
    frontend: string[];
    backend: string[];
    matching: string[];
    mismatched: Array<{
      endpoint: string;
      frontendType: string;
      backendType: string;
      issues: string[];
    }>;
  };
  websocketMessages: {
    types: string[];
    usage: Array<{
      type: string;
      components: string[];
      handlers: number;
    }>;
    backends: Array<{
      type: string;
      handlerFiles: string[];
    }>;
    issues: Array<{
      type: string;
      issue: string;
    }>;
  };
}

// Initialize results
const results: ValidationResult = {
  valid: true,
  errors: [],
  warnings: [],
  apiContracts: {
    frontend: [],
    backend: [],
    matching: [],
    mismatched: [],
  },
  websocketMessages: {
    types: [],
    usage: [],
    backends: [],
    issues: [],
  },
};

// ===================================================
// Helpers
// ===================================================

/**
 * Add an error to the results
 */
function addError(error: string): void {
  results.errors.push(error);
  results.valid = false;
  console.error(chalk.red(`ERROR: ${error}`));
}

/**
 * Add a warning to the results
 */
function addWarning(warning: string): void {
  results.warnings.push(warning);
  console.warn(chalk.yellow(`WARNING: ${warning}`));
}

/**
 * Add a success message
 */
function addSuccess(message: string): void {
  console.log(chalk.green(`SUCCESS: ${message}`));
}

/**
 * Extract API endpoints from TypeScript files
 */
function extractApiEndpoints(directory: string, pattern: string): string[] {
  const files = glob.sync(pattern, { cwd: directory, absolute: true });
  const endpoints: string[] = [];

  files.forEach((file) => {
    const content = fs.readFileSync(file, 'utf-8');
    // Match route definitions like @router.get("/endpoint")
    const routeMatches = content.match(/@router\.(get|post|put|delete|patch)\(\s*["']([^"']+)["']/g);
    
    if (routeMatches) {
      routeMatches.forEach((match) => {
        // Extract the HTTP method and endpoint path
        const methodMatch = match.match(/@router\.(get|post|put|delete|patch)/);
        const pathMatch = match.match(/["']([^"']+)["']/);
        
        if (methodMatch && pathMatch) {
          const method = methodMatch[1].toUpperCase();
          const path = pathMatch[1];
          endpoints.push(`${method} ${path}`);
        }
      });
    }
  });

  return endpoints;
}

/**
 * Extract WebSocket message types from Python files
 */
function extractWebSocketBackendHandlers(directory: string): Map<string, string[]> {
  const files = glob.sync('**/*.py', { cwd: directory, absolute: true });
  const handlers = new Map<string, string[]>();

  files.forEach((file) => {
    const content = fs.readFileSync(file, 'utf-8');
    // Match websocket message type handlers
    const typeMatches = content.match(/async def handle_(\w+)_message/g);
    
    if (typeMatches) {
      typeMatches.forEach((match) => {
        // Extract the message type from the handler name
        const typeMatch = match.match(/handle_(\w+)_message/);
        
        if (typeMatch) {
          const messageType = typeMatch[1].toUpperCase();
          
          // Convert snake_case to SNAKE_CASE for comparison with TypeScript enums
          const normalizedType = messageType;
          
          if (!handlers.has(normalizedType)) {
            handlers.set(normalizedType, []);
          }
          
          handlers.get(normalizedType)?.push(file);
        }
      });
    }
  });

  return handlers;
}

/**
 * Extract WebSocket message usage from TypeScript files
 */
function extractWebSocketUsage(directory: string): Map<string, string[]> {
  const files = glob.sync('**/*.{ts,tsx}', { 
    cwd: directory, 
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**'] 
  });
  const usage = new Map<string, string[]>();

  files.forEach((file) => {
    const content = fs.readFileSync(file, 'utf-8');
    // Match WebSocketMessageType usage
    const typeMatches = content.match(/WebSocketMessageType\.([A-Z_]+)/g);
    
    if (typeMatches) {
      typeMatches.forEach((match) => {
        // Extract the message type
        const typeMatch = match.match(/WebSocketMessageType\.([A-Z_]+)/);
        
        if (typeMatch) {
          const messageType = typeMatch[1];
          
          if (!usage.has(messageType)) {
            usage.set(messageType, []);
          }
          
          if (!usage.get(messageType)?.includes(file)) {
            usage.get(messageType)?.push(file);
          }
        }
      });
    }
  });

  return usage;
}

// ===================================================
// Validation Functions
// ===================================================

/**
 * Validate API endpoint contracts
 */
async function validateApiContracts(): Promise<void> {
  console.log(chalk.blue('Validating API contracts...'));
  
  // Extract frontend API types
  const apiTypeFile = fs.readFileSync(CONFIG.apiTypesPath, 'utf-8');
  const frontendTypes = apiTypeFile.match(/export interface (\w+Response) {[^}]+}/g) || [];
  
  for (const typeMatch of frontendTypes) {
    const nameMatch = typeMatch.match(/export interface (\w+Response)/);
    if (nameMatch) {
      results.apiContracts.frontend.push(nameMatch[1]);
    }
  }
  
  // Extract backend API endpoints
  const backendEndpoints = extractApiEndpoints(
    CONFIG.backendApiFolder,
    '**/*.py'
  );
  
  results.apiContracts.backend = backendEndpoints;
  
  // Match frontend types with backend endpoints
  for (const endpoint of backendEndpoints) {
    // Convert endpoint to potential type name
    // e.g., "GET /api/admin/ai-metrics" -> "AIMetricsResponse"
    const parts = endpoint.split(' ')[1].split('/').filter(p => p && p !== 'api');
    
    // Convert to PascalCase and add Response suffix
    const typeName = parts
      .map(p => p.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(''))
      .join('') + 'Response';
    
    // Check if the frontend has a matching type
    const matchingType = results.apiContracts.frontend.find(t => 
      t === typeName || 
      t === typeName.replace('Response', 'Result') || 
      t === endpoint.split(' ')[1].replace(/\//g, '_').replace(/-/g, '_').toUpperCase() + '_RESPONSE'
    );
    
    if (matchingType) {
      results.apiContracts.matching.push(endpoint);
    } else {
      results.apiContracts.mismatched.push({
        endpoint,
        frontendType: 'Missing',
        backendType: 'Unknown',
        issues: ['No matching frontend type for this endpoint']
      });
    }
  }
  
  // Report results
  addSuccess(`Found ${results.apiContracts.frontend.length} frontend API response types`);
  addSuccess(`Found ${results.apiContracts.backend.length} backend API endpoints`);
  addSuccess(`Matched ${results.apiContracts.matching.length} API contracts`);
  
  if (results.apiContracts.mismatched.length > 0) {
    addWarning(`Found ${results.apiContracts.mismatched.length} mismatched API contracts`);
  }
}

/**
 * Validate WebSocket message contracts
 */
async function validateWebSocketContracts(): Promise<void> {
  console.log(chalk.blue('Validating WebSocket contracts...'));
  
  // Get all defined WebSocket message types
  results.websocketMessages.types = Object.keys(WebSocketMessageType);
  
  // Extract WebSocket message usage
  const usage = extractWebSocketUsage(CONFIG.clientApiUsageFolder);
  
  // Extract backend WebSocket handlers
  const backendHandlers = extractWebSocketBackendHandlers(CONFIG.backendApiFolder);
  
  // Check for message types with no frontend usage
  for (const type of results.websocketMessages.types) {
    const components = usage.get(type) || [];
    
    results.websocketMessages.usage.push({
      type,
      components: components.map(c => path.relative(CONFIG.clientApiUsageFolder, c)),
      handlers: components.length
    });
    
    if (components.length === 0) {
      results.websocketMessages.issues.push({
        type,
        issue: 'No frontend usage found for this message type'
      });
    }
    
    // Check for backend handlers
    const handlers = backendHandlers.get(type) || [];
    
    if (handlers.length > 0) {
      results.websocketMessages.backends.push({
        type,
        handlerFiles: handlers.map(h => path.relative(CONFIG.backendApiFolder, h))
      });
    } else {
      results.websocketMessages.issues.push({
        type,
        issue: 'No backend handler found for this message type'
      });
    }
  }
  
  // Check for backend handlers with no matching frontend type
  for (const [type, handlers] of backendHandlers.entries()) {
    if (!results.websocketMessages.types.includes(type)) {
      results.websocketMessages.issues.push({
        type,
        issue: 'Backend handler exists but no matching frontend message type is defined'
      });
    }
  }
  
  // Report results
  addSuccess(`Found ${results.websocketMessages.types.length} WebSocket message types`);
  addSuccess(`Found ${results.websocketMessages.usage.reduce((acc, u) => acc + u.handlers, 0)} frontend message usages`);
  addSuccess(`Found ${results.websocketMessages.backends.length} backend message handlers`);
  
  if (results.websocketMessages.issues.length > 0) {
    addWarning(`Found ${results.websocketMessages.issues.length} WebSocket message issues`);
  }
}

// ===================================================
// Main Function
// ===================================================

async function main() {
  console.log(chalk.blue('Starting contract validation...'));
  
  try {
    // Validate API contracts
    await validateApiContracts();
    
    // Validate WebSocket contracts
    await validateWebSocketContracts();
    
    // Output final results
    console.log('\n');
    
    if (results.valid) {
      console.log(chalk.green('✓ All contracts are valid!'));
    } else {
      console.log(chalk.red(`✗ Contract validation failed with ${results.errors.length} errors and ${results.warnings.length} warnings`));
    }
    
    // Write results to file
    const outputDir = path.dirname(CONFIG.outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(
      CONFIG.outputFile,
      JSON.stringify(results, null, 2),
      'utf-8'
    );
    
    console.log(chalk.blue(`Results written to ${CONFIG.outputFile}`));
    
    // Exit with appropriate code
    process.exit(results.valid ? 0 : 1);
  } catch (error) {
    console.error(chalk.red('Validation failed with an error:'), error);
    process.exit(1);
  }
}

// Run main function
main(); 