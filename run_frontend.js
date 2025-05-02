#!/usr/bin/env node

/**
 * Script to run the DentaMind frontend development server.
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Check if the frontend directory exists
const frontendDir = path.join(__dirname, 'frontend');
if (!fs.existsSync(frontendDir)) {
  console.error('Frontend directory not found! Expected at:', frontendDir);
  process.exit(1);
}

// Set environment variables for the frontend
const env = {
  ...process.env,
  PORT: process.env.FRONTEND_PORT || '3000',
  REACT_APP_API_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
};

console.log('Starting frontend development server...');
console.log(`- Frontend URL: http://localhost:${env.PORT}`);
console.log(`- API URL: ${env.REACT_APP_API_URL}`);

// Start the development server
const frontendProcess = spawn('npm', ['run', 'dev'], {
  cwd: frontendDir,
  env,
  stdio: 'inherit',
});

// Handle process events
frontendProcess.on('error', (err) => {
  console.error('Failed to start frontend server:', err);
  process.exit(1);
});

frontendProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(`Frontend server exited with code ${code}`);
  }
  process.exit(code);
});

// Handle termination signals
process.on('SIGINT', () => {
  console.log('Shutting down frontend server...');
  frontendProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('Shutting down frontend server...');
  frontendProcess.kill('SIGTERM');
}); 