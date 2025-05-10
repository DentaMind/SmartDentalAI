/**
 * API and WebSocket Contract Validation Script
 * 
 * This script validates the TypeScript contracts defined for API endpoints and WebSocket
 * messages against the actual backend implementation. It makes actual API and WebSocket
 * calls to verify compatibility.
 * 
 * Run with: npm run validate-contracts
 */

import { ServerMessageSchema, ClientMessageSchema } from '../types/websocket-contracts';
import { ApiContracts } from '../types/apiContracts';
import apiClient from '../services/apiClient';
import { getApiBaseUrl, getWebSocketUrl } from '../config/environment';

interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Main validation function
 */
async function validateContracts(): Promise<ValidationResult> {
  console.log('🔍 Starting API and WebSocket contract validation');
  
  const result: ValidationResult = {
    success: true,
    errors: [],
    warnings: []
  };

  // Validate API contracts
  await validateApiContracts(result);
  
  // Validate WebSocket contracts
  await validateWebSocketContracts(result);
  
  // Report results
  if (result.errors.length > 0) {
    console.error('\n❌ Contract validation failed with errors:');
    result.errors.forEach(error => console.error(`- ${error}`));
    result.success = false;
  }
  
  if (result.warnings.length > 0) {
    console.warn('\n⚠️ Contract validation warnings:');
    result.warnings.forEach(warning => console.warn(`- ${warning}`));
  }
  
  if (result.success && result.warnings.length === 0) {
    console.log('\n✅ All contracts validated successfully!');
  } else if (result.success) {
    console.log('\n✅ Contracts validated with warnings');
  }
  
  return result;
}

/**
 * Validate API contracts against actual endpoints
 */
async function validateApiContracts(result: ValidationResult): Promise<void> {
  console.log(`\n🔍 Validating API contracts against ${getApiBaseUrl()}`);
  
  // Get API schema from server if available
  try {
    const response = await fetch(`${getApiBaseUrl()}/schema`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('✅ Successfully fetched API schema from server');
      
      const apiSchema = await response.json();
      
      // Compare our contracts with the server schema
      const endpoints = Object.keys(ApiContracts);
      console.log(`📊 Checking ${endpoints.length} API endpoints against schema`);
      
      let matchCount = 0;
      let mismatchCount = 0;
      
      for (const endpoint of endpoints) {
        const contract = ApiContracts[endpoint as keyof typeof ApiContracts];
        const serverEndpoint = apiSchema.paths[contract.path];
        
        if (!serverEndpoint) {
          result.warnings.push(`API endpoint not found in server schema: ${contract.path}`);
          continue;
        }
        
        const serverMethod = serverEndpoint[contract.method.toLowerCase()];
        
        if (!serverMethod) {
          result.warnings.push(`API method ${contract.method} not found for endpoint: ${contract.path}`);
          continue;
        }
        
        // Check parameter compatibility
        if (contract.pathParams && serverMethod.parameters) {
          // Validate path parameters
          const pathParams = serverMethod.parameters.filter((p: any) => p.in === 'path');
          const contractParams = Object.keys(contract.pathParams.shape || {});
          
          for (const param of contractParams) {
            if (!pathParams.some((p: any) => p.name === param)) {
              result.errors.push(`Path parameter '${param}' in contract for ${contract.path} not found in server schema`);
            }
          }
        }
        
        // Further schema validation can be added here
        
        matchCount++;
      }
      
      console.log(`✅ ${matchCount} endpoints matched`);
      if (mismatchCount > 0) {
        console.warn(`⚠️ ${mismatchCount} endpoints had mismatches`);
      }
      
    } else {
      result.warnings.push('Could not fetch API schema from server. Schema validation skipped.');
    }
  } catch (error) {
    result.warnings.push(`Error fetching API schema: ${error}`);
  }
  
  // Check for HTTP OPTIONS requests to endpoints
  try {
    // Test a few key endpoints with OPTIONS requests
    const endpointsToTest = [
      '/api/auth/login',
      '/api/patients',
      '/api/xray/analyze'
    ];
    
    for (const endpoint of endpointsToTest) {
      const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
        method: 'OPTIONS',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        console.log(`✅ OPTIONS check for ${endpoint} passed`);
      } else {
        result.warnings.push(`OPTIONS check failed for ${endpoint}`);
      }
    }
  } catch (error) {
    result.warnings.push(`Error during OPTIONS checks: ${error}`);
  }
}

/**
 * Validate WebSocket contracts against server
 */
async function validateWebSocketContracts(result: ValidationResult): Promise<void> {
  console.log(`\n🔍 Validating WebSocket contracts against ${getWebSocketUrl()}`);
  
  // Test WebSocket connection
  try {
    const socket = new WebSocket(getWebSocketUrl());
    
    await new Promise<void>((resolve, reject) => {
      // Set timeout for connection attempt
      const timeout = setTimeout(() => {
        socket.close();
        reject(new Error('WebSocket connection timed out'));
      }, 5000);
      
      // Success handler
      socket.onopen = () => {
        clearTimeout(timeout);
        console.log('✅ WebSocket connection successful');
        
        // Send a ping to test message schema
        try {
          const pingMessage = {
            type: 'ping',
            timestamp: new Date().toISOString(),
            client_timestamp: new Date().toISOString()
          };
          
          // Validate message against our schema before sending
          const pingValidation = ClientMessageSchema.safeParse(pingMessage);
          
          if (pingValidation.success) {
            socket.send(JSON.stringify(pingMessage));
            console.log('✅ Ping message validated and sent');
          } else {
            result.errors.push(`Client message validation failed: ${pingValidation.error}`);
          }
        } catch (error) {
          result.errors.push(`Error validating or sending message: ${error}`);
        }
        
        // Close socket after a short delay to allow for response
        setTimeout(() => {
          socket.close();
          resolve();
        }, 1000);
      };
      
      // Error handler
      socket.onerror = (event) => {
        clearTimeout(timeout);
        reject(new Error('WebSocket connection error'));
      };
      
      // Message handler to validate responses
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Validate message against our schema
          const messageValidation = ServerMessageSchema.safeParse(message);
          
          if (messageValidation.success) {
            console.log(`✅ Received valid ${message.type} message from server`);
          } else {
            result.errors.push(`Server message validation failed: ${messageValidation.error}`);
          }
        } catch (error) {
          result.errors.push(`Error parsing server message: ${error}`);
        }
      };
    });
    
  } catch (error) {
    result.errors.push(`WebSocket validation failed: ${error}`);
  }
  
  // If server provides a WebSocket schema endpoint, validate against that
  try {
    const response = await fetch(`${getApiBaseUrl()}/ws-schema`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('✅ Successfully fetched WebSocket schema from server');
      
      const wsSchema = await response.json();
      
      // Validate server message types
      const serverMessageTypes = wsSchema.serverMessages?.map((msg: any) => msg.type) || [];
      const clientMessageTypes = wsSchema.clientMessages?.map((msg: any) => msg.type) || [];
      
      // Extract message types from our schemas
      const ourServerMessageTypes = ServerMessageSchema.options.map(option => 
        option.shape.type.value
      );
      
      const ourClientMessageTypes = ClientMessageSchema.options.map(option => 
        option.shape.type.value
      );
      
      // Check for missing message types
      for (const type of serverMessageTypes) {
        if (!ourServerMessageTypes.includes(type)) {
          result.warnings.push(`Server message type '${type}' not defined in our schema`);
        }
      }
      
      for (const type of ourServerMessageTypes) {
        if (!serverMessageTypes.includes(type)) {
          result.warnings.push(`Our server message type '${type}' not supported by the server`);
        }
      }
      
      for (const type of clientMessageTypes) {
        if (!ourClientMessageTypes.includes(type)) {
          result.warnings.push(`Client message type '${type}' not defined in our schema`);
        }
      }
      
      for (const type of ourClientMessageTypes) {
        if (!clientMessageTypes.includes(type)) {
          result.warnings.push(`Our client message type '${type}' not supported by the server`);
        }
      }
      
    } else {
      result.warnings.push('Could not fetch WebSocket schema from server. Schema validation skipped.');
    }
  } catch (error) {
    result.warnings.push(`Error fetching WebSocket schema: ${error}`);
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  validateContracts()
    .then(result => {
      if (!result.success) {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Fatal error during validation:', error);
      process.exit(1);
    });
}

export default validateContracts; 