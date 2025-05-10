#!/usr/bin/env node

/**
 * CI Contract Validation Script
 * 
 * Validates API contracts for CI/CD pipeline integration
 * Generates OpenAPI schema from frontend Zod contracts and compares with backend
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Configuration
const REPORT_PATH = path.resolve(__dirname, '../../reports/contract-validation');
const TIMESTAMP = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
const REPORT_FILE = path.join(REPORT_PATH, `contract-validation-${TIMESTAMP}.json`);

/**
 * Main execution function
 */
async function main() {
  console.log(chalk.blue('🔍 Running API contract validation for CI pipeline'));
  
  try {
    // Create report directory if it doesn't exist
    if (!fs.existsSync(REPORT_PATH)) {
      fs.mkdirSync(REPORT_PATH, { recursive: true });
    }
    
    // Build TypeScript files first
    console.log(chalk.blue('📦 Building TypeScript files...'));
    execSync('npm run build', { stdio: 'inherit' });
    
    // Run OpenAPI diff
    console.log(chalk.blue('🔄 Running OpenAPI diff...'));
    try {
      execSync('node ./dist/scripts/openapi-diff.js', { stdio: 'inherit' });
      console.log(chalk.green('✅ OpenAPI schemas are in sync!'));
    } catch (error) {
      console.error(chalk.red('❌ OpenAPI schemas are not in sync!'));
      
      // Create failure report
      const report = {
        timestamp: new Date().toISOString(),
        success: false,
        error: 'OpenAPI schemas are not in sync',
        details: error.message || 'See logs for details'
      };
      
      fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
      
      // Exit with error code
      process.exit(1);
    }
    
    // Run contract tests
    console.log(chalk.blue('🧪 Running contract validation tests...'));
    try {
      execSync('npm run test:contracts', { stdio: 'inherit' });
      console.log(chalk.green('✅ Contract validation tests passed!'));
    } catch (error) {
      console.error(chalk.red('❌ Contract validation tests failed!'));
      
      // Create failure report
      const report = {
        timestamp: new Date().toISOString(),
        success: false,
        error: 'Contract validation tests failed',
        details: error.message || 'See logs for details'
      };
      
      fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
      
      // Exit with error code
      process.exit(1);
    }
    
    // Create success report
    const report = {
      timestamp: new Date().toISOString(),
      success: true
    };
    
    fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
    console.log(chalk.green('✅ API contract validation completed successfully!'));
    
  } catch (error) {
    console.error(chalk.red('❌ CI contract validation failed:'), error);
    
    // Create failure report
    const report = {
      timestamp: new Date().toISOString(),
      success: false,
      error: 'CI contract validation failed',
      details: error.message || 'See logs for details'
    };
    
    fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
    
    // Exit with error code
    process.exit(1);
  }
}

// Run the main function
main(); 