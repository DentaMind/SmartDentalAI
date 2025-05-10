// ***********************************************
// Custom commands for DentaMind
// ***********************************************

// Login command
Cypress.Commands.add('login', (email = 'test@dentamind.ai', password = 'password123') => {
  cy.visit('/login');
  cy.get('[data-cy=email]').type(email);
  cy.get('[data-cy=password]').type(password);
  cy.get('[data-cy=login-button]').click();
  cy.get('[data-cy=dashboard]').should('be.visible');
});

// Navigate to patient intake form
Cypress.Commands.add('navigateToPatientIntake', () => {
  cy.get('[data-cy=patients-nav]').click();
  cy.get('[data-cy=add-patient-button]').click();
  cy.url().should('include', '/patients/new');
  cy.get('[data-cy=intake-form]').should('be.visible');
});

// Fill personal information section
Cypress.Commands.add('fillPersonalInfo', (firstName, lastName, dob) => {
  cy.get('[data-cy=first-name]').type(firstName);
  cy.get('[data-cy=last-name]').type(lastName);
  cy.get('[data-cy=date-of-birth]').type(dob);
});

// Apply AI suggestions
Cypress.Commands.add('applyAISuggestions', () => {
  cy.get('[data-cy=ai-suggestions-card]', { timeout: 10000 }).should('be.visible');
  cy.get('[data-cy=apply-suggestions-button]').click();
});

// Navigate to next section in multistep form
Cypress.Commands.add('nextSection', () => {
  cy.get('[data-cy=next-button]').click();
});

// Submit patient intake form
Cypress.Commands.add('submitIntakeForm', () => {
  cy.get('[data-cy=consent-checkbox]').check();
  cy.get('[data-cy=submit-button]').click();
  cy.get('[data-cy=submission-success]', { timeout: 10000 }).should('be.visible');
});

// AI feedback (positive)
Cypress.Commands.add('givePositiveAIFeedback', () => {
  cy.get('[data-cy=ai-feedback-positive]').click();
  cy.get('[data-cy=feedback-confirmation]').should('be.visible');
});

// AI feedback (negative with comment)
Cypress.Commands.add('giveNegativeAIFeedback', (comment) => {
  cy.get('[data-cy=ai-feedback-negative]').click();
  cy.get('[data-cy=feedback-comments]').type(comment);
  cy.get('[data-cy=submit-feedback]').click();
}); 