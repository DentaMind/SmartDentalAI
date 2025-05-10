/**
 * OpenAPI Diff Tool
 * 
 * Compares frontend Zod contracts with backend OpenAPI schema to detect drift
 * This ensures frontend and backend API contracts stay in sync
 */

import * as fs from 'fs';
import * as path from 'path';
import { diff } from 'deep-object-diff';
import { zodToJsonSchema } from 'zod-to-json-schema';
import fetch from 'node-fetch';
import chalk from 'chalk';
import { ApiContracts } from '../types/apiContracts';
import { zodsToOpenApi } from '../utils/zod-openapi';

const OPENAPI_OUTPUT_PATH = path.resolve(__dirname, '../../../docs/openapi');
const BACKEND_OPENAPI_URL = process.env.OPENAPI_URL || 'http://localhost:8000/openapi.json';

async function main() {
  try {
    // Generate OpenAPI from frontend Zod schemas
    console.log(chalk.blue('🔄 Generating OpenAPI schema from frontend Zod contracts...'));
    const frontendOpenApi = zodsToOpenApi(ApiContracts);
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(OPENAPI_OUTPUT_PATH)) {
      fs.mkdirSync(OPENAPI_OUTPUT_PATH, { recursive: true });
    }
    
    // Save generated schema
    fs.writeFileSync(
      path.join(OPENAPI_OUTPUT_PATH, 'frontend-openapi.json'),
      JSON.stringify(frontendOpenApi, null, 2)
    );
    
    // Fetch backend OpenAPI schema
    console.log(chalk.blue('🔄 Fetching backend OpenAPI schema...'));
    const response = await fetch(BACKEND_OPENAPI_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch backend OpenAPI: ${response.statusText}`);
    }
    
    const backendOpenApi = await response.json();
    fs.writeFileSync(
      path.join(OPENAPI_OUTPUT_PATH, 'backend-openapi.json'),
      JSON.stringify(backendOpenApi, null, 2)
    );
    
    // Compare paths and schemas
    console.log(chalk.blue('🔄 Comparing frontend and backend schemas...'));
    const pathsDiff = diff(frontendOpenApi.paths || {}, backendOpenApi.paths || {});
    const schemasDiff = diff(frontendOpenApi.components?.schemas || {}, backendOpenApi.components?.schemas || {});
    
    // Output results
    if (Object.keys(pathsDiff).length === 0 && Object.keys(schemasDiff).length === 0) {
      console.log(chalk.green('✅ Frontend and backend schemas are in sync!'));
      return true;
    }
    
    console.log(chalk.yellow('⚠️ Detected differences between frontend and backend schemas:'));
    
    if (Object.keys(pathsDiff).length > 0) {
      console.log(chalk.yellow('\nPath differences:'));
      console.log(JSON.stringify(pathsDiff, null, 2));
    }
    
    if (Object.keys(schemasDiff).length > 0) {
      console.log(chalk.yellow('\nSchema differences:'));
      console.log(JSON.stringify(schemasDiff, null, 2));
    }
    
    return false;
  } catch (error) {
    console.error(chalk.red('❌ Error comparing OpenAPI schemas:'), error);
    throw error;
  }
}

// Run script directly if called from command line
if (require.main === module) {
  main()
    .then(inSync => {
      process.exit(inSync ? 0 : 1);
    })
    .catch(error => {
      console.error(chalk.red('❌ Script failed:'), error);
      process.exit(1);
    });
}

export default main; 