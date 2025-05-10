// Patient Intake Form with AI Assistance Test
describe('Patient Intake Form with AI Assistance', () => {
  // Login before each test
  beforeEach(() => {
    // Visit the login page
    cy.visit('/login');
    
    // Login as a staff user
    cy.get('[data-cy=email]').type('test@dentamind.ai');
    cy.get('[data-cy=password]').type('password123');
    cy.get('[data-cy=login-button]').click();
    
    // Verify we're logged in by checking for dashboard element
    cy.get('[data-cy=dashboard]').should('be.visible');
  });
  
  it('Should navigate to patient intake form', () => {
    // Navigate to patients section
    cy.get('[data-cy=patients-nav]').click();
    
    // Click on add new patient button
    cy.get('[data-cy=add-patient-button]').click();
    
    // Verify we're on the intake form page
    cy.url().should('include', '/patients/new');
    cy.get('[data-cy=intake-form]').should('be.visible');
  });
  
  it('Should fill out personal information section', () => {
    // Navigate to intake form
    cy.get('[data-cy=patients-nav]').click();
    cy.get('[data-cy=add-patient-button]').click();
    
    // Fill out personal information fields
    cy.get('[data-cy=first-name]').type('John');
    cy.get('[data-cy=last-name]').type('Smith');
    cy.get('[data-cy=date-of-birth]').type('1980-01-01');
    cy.get('[data-cy=email]').type('john.smith@example.com');
    cy.get('[data-cy=phone]').type('555-123-4567');
    
    // Address fields
    cy.get('[data-cy=street]').type('123 Main St');
    cy.get('[data-cy=city]').type('Boston');
    cy.get('[data-cy=state]').select('MA');
    cy.get('[data-cy=zip-code]').type('02108');
    
    // Move to next section
    cy.get('[data-cy=next-button]').click();
    
    // Verify we've moved to the next section (insurance info)
    cy.get('[data-cy=insurance-info-section]').should('be.visible');
  });
  
  it('Should show AI suggestions and apply them', () => {
    // Navigate to intake form
    cy.get('[data-cy=patients-nav]').click();
    cy.get('[data-cy=add-patient-button]').click();
    
    // Fill out minimal information to trigger AI suggestions
    cy.get('[data-cy=first-name]').type('Jane');
    cy.get('[data-cy=last-name]').type('Doe');
    cy.get('[data-cy=date-of-birth]').type('1985-05-15');
    
    // Wait for AI suggestions to appear
    cy.get('[data-cy=ai-suggestions-card]', { timeout: 10000 }).should('be.visible');
    
    // Apply AI suggestions
    cy.get('[data-cy=apply-suggestions-button]').click();
    
    // Verify fields were filled in by AI
    cy.get('[data-cy=email]').should('not.have.value', '');
    cy.get('[data-cy=phone]').should('not.have.value', '');
    
    // Provide AI feedback (positive)
    cy.get('[data-cy=ai-feedback-positive]').click();
    
    // Verify feedback was accepted
    cy.get('[data-cy=feedback-confirmation]').should('be.visible');
  });
  
  it('Should complete entire intake form with AI assistance', () => {
    // Navigate to intake form
    cy.get('[data-cy=patients-nav]').click();
    cy.get('[data-cy=add-patient-button]').click();
    
    // Personal Information Section
    cy.get('[data-cy=first-name]').type('Robert');
    cy.get('[data-cy=last-name]').type('Johnson');
    cy.get('[data-cy=date-of-birth]').type('1975-08-22');
    
    // Apply AI suggestions for personal info
    cy.get('[data-cy=ai-suggestions-card]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-cy=apply-suggestions-button]').click();
    
    // Continue to insurance section
    cy.get('[data-cy=next-button]').click();
    
    // Insurance Information Section
    // Wait for AI suggestions for insurance info
    cy.get('[data-cy=ai-suggestions-card]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-cy=apply-suggestions-button]').click();
    
    // Continue to medical history section
    cy.get('[data-cy=next-button]').click();
    
    // Medical History Section
    // Wait for AI suggestions for medical history
    cy.get('[data-cy=ai-suggestions-card]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-cy=apply-suggestions-button]').click();
    
    // Continue to dental history section
    cy.get('[data-cy=next-button]').click();
    
    // Dental History Section
    // Wait for AI suggestions for dental history
    cy.get('[data-cy=ai-suggestions-card]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-cy=apply-suggestions-button]').click();
    
    // Complete form
    cy.get('[data-cy=consent-checkbox]').check();
    cy.get('[data-cy=submit-button]').click();
    
    // Verify submission was successful
    cy.get('[data-cy=submission-success]').should('be.visible');
    cy.url().should('include', '/patients/');
  });
  
  it('Should handle AI suggestion rejection and manual entry', () => {
    // Navigate to intake form
    cy.get('[data-cy=patients-nav]').click();
    cy.get('[data-cy=add-patient-button]').click();
    
    // Fill minimal information
    cy.get('[data-cy=first-name]').type('Alice');
    cy.get('[data-cy=last-name]').type('Brown');
    cy.get('[data-cy=date-of-birth]').type('1990-12-10');
    
    // Wait for AI suggestions
    cy.get('[data-cy=ai-suggestions-card]', { timeout: 10000 }).should('be.visible');
    
    // Reject suggestions with feedback
    cy.get('[data-cy=ai-feedback-negative]').click();
    cy.get('[data-cy=feedback-comments]').type('The suggestions weren\'t relevant to my situation');
    cy.get('[data-cy=submit-feedback]').click();
    
    // Manually fill remaining fields
    cy.get('[data-cy=email]').type('alice.custom@example.com');
    cy.get('[data-cy=phone]').type('555-987-6543');
    cy.get('[data-cy=street]').type('456 Oak Avenue');
    cy.get('[data-cy=city]').type('San Francisco');
    cy.get('[data-cy=state]').select('CA');
    cy.get('[data-cy=zip-code]').type('94101');
    
    // Continue to next section
    cy.get('[data-cy=next-button]').click();
    
    // Verify we moved to next section
    cy.get('[data-cy=insurance-info-section]').should('be.visible');
  });
}); 