// ***********************************************************
// This support file is loaded automatically before all tests
// It's a great place to add custom commands and behaviors
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Avoid uncaught exceptions from failing tests
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test when an uncaught exception occurs
  return false;
});

// Log all Cypress requests to console
Cypress.on('log:added', (attrs, log) => {
  if (attrs.name === 'request') {
    console.log(`${attrs.name} ${attrs.method} to ${attrs.url} with ${attrs.numAttachments} attachments`);
  }
}); 