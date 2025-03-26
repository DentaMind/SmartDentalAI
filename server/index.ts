import http from 'http';
import { setupWebSocketServer } from './websocket';
import dotenv from 'dotenv';
import app from './app';
import { setupVite, log } from "./vite";
import { securityService } from "./services/security";
import { schedulerService } from "./services/scheduler";
import { seedDatabase } from "./seed-data";
import { pool } from './db';
import { storage } from './storage';

dotenv.config();

const startServer = async () => {
  try {
    console.log('Starting server initialization...');

    // Check file integrity before starting
    const integrityCheck = await securityService.performIntegrityCheck();
    if (integrityCheck.status === 'compromised') {
      console.error('CRITICAL SECURITY ALERT: File integrity check failed before startup!');
      console.error('Compromised files:', integrityCheck.compromisedFiles);

      if (process.env.NODE_ENV === 'production') {
        console.error('Refusing to start server due to security concerns.');
        process.exit(1);
      } else {
        console.warn('Starting anyway because we are in development mode');
      }
    }

    console.log('Creating HTTP server...');
    // Create HTTP server from Express app
    const httpServer = http.createServer(app);

    console.log('Setting up WebSocket server...');
    // Setup WebSocket server
    const wsServer = setupWebSocketServer(httpServer);

    // Start the server first
    const PORT = Number(process.env.PORT) || 5000;
    console.log(`Attempting to start server on port ${PORT}...`);

    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`Server listening on port ${PORT}`);
      console.log(`http://localhost:${PORT}`);
      console.log(`WebSocket server available at ws://localhost:${PORT}`);
    });

    // After server is listening, setup Vite in development
    if (process.env.NODE_ENV !== 'production') {
      try {
        log("Setting up Vite development server...");
        await setupVite(app);
        console.log('Vite development server setup complete');
      } catch (error) {
        console.error("Vite setup error:", error);
        console.error("Full error details:", error instanceof Error ? error.stack : error);
        // Don't exit on Vite error, just log it
        console.warn("Continuing without Vite development server");
      }
    }
    
    // Initialize automated appointment reminders
    try {
      console.log('Initializing automated appointment reminders...');
      const reminderSetup = await schedulerService.setupAutomatedReminders();
      console.log(`Appointment reminders initialized: ${reminderSetup.message}`);
    } catch (error) {
      console.error('Failed to set up appointment reminders:', error);
      console.error('Full error details:', error instanceof Error ? error.stack : error);
      // Don't exit on reminder setup error, just log it
      console.warn('Continuing without automated reminders');
    }
    
    // Seed the database with test data if in development mode
    if (process.env.NODE_ENV !== 'production') {
      try {
        console.log('Seeding database with test data...');
        const seedData = await seedDatabase();
        console.log('Database seeding completed. Test credentials:');
        console.log('Dentist:', seedData.dentist);
        console.log('Dr. Abdin:', seedData.drAbdin);
        console.log('Mary RDH:', seedData.maryRdh);
        console.log('Patients:', seedData.patients);
        
        // Now initialize the in-memory storage with data from the database
        try {
          console.log('Loading users from database into memory storage...');
          
          // Using the already imported modules
          // Get all users
          console.log('Fetching users from database...');
          const usersResult = await pool.query('SELECT * FROM users');
          console.log(`Found ${usersResult.rows.length} users in database`);
          
          // Initialize users in storage
          for (const dbUser of usersResult.rows) {
            // Convert database column names to camelCase for the User object
            const user = {
              id: dbUser.id,
              username: dbUser.username,
              password: dbUser.password,
              email: dbUser.email || '',
              firstName: dbUser.first_name || '',
              lastName: dbUser.last_name || '',
              role: dbUser.role || 'patient',
              language: dbUser.language || 'en',
              phoneNumber: dbUser.phone_number || null,
              dateOfBirth: dbUser.date_of_birth || null,
              insuranceProvider: dbUser.insurance_provider || null,
              insuranceNumber: dbUser.insurance_number || null,
              specialization: dbUser.specialization || null,
              licenseNumber: dbUser.license_number || null,
              officeName: dbUser.office_name || null,
              officeEmail: dbUser.office_email || null,
              mfaSecret: dbUser.mfa_secret || '',
              mfaEnabled: dbUser.mfa_enabled || false,
              createdAt: dbUser.created_at || new Date(),
              updatedAt: dbUser.updated_at || new Date(),
              metadata: dbUser.metadata || {}
            };
            
            // Add the user to storage
            await storage.initializeUserFromDb(user);
            console.log(`Loaded user ${user.username} (ID: ${user.id}) into memory storage`);
          }
          
          // Get all patients
          console.log('Fetching patients from database...');
          const patientsResult = await pool.query('SELECT * FROM patients');
          console.log(`Found ${patientsResult.rows.length} patients in database`);
          
          // Initialize patients in storage
          for (const dbPatient of patientsResult.rows) {
            // Convert database column names to camelCase for the Patient object
            const patient = {
              id: dbPatient.id,
              userId: dbPatient.user_id,
              firstName: dbPatient.first_name || null,
              lastName: dbPatient.last_name || null,
              email: dbPatient.email || null,
              phoneNumber: dbPatient.phone_number || null,
              dateOfBirth: dbPatient.date_of_birth || null,
              
              // Include all relevant fields from the database schema
              homeAddress: dbPatient.home_address || null,
              emergencyContactName: dbPatient.emergency_contact_name || null,
              emergencyContactPhone: dbPatient.emergency_contact_phone || null,
              emergencyContactRelationship: dbPatient.emergency_contact_relationship || null,
              insuranceProvider: dbPatient.insurance_provider || null,
              insuranceNumber: dbPatient.insurance_number || null,
              allergies: dbPatient.allergies || null,
              currentMedications: dbPatient.current_medications || null,
              medicalHistory: dbPatient.medical_history || null,
              
              // Dental-specific fields
              dentalHistory: dbPatient.dental_history || null,
              lastVisitDate: dbPatient.last_visit_date || null,
              
              // Consent and compliance fields
              consentFormSigned: dbPatient.consent_form_signed || false,
              hipaaFormSigned: dbPatient.hipaa_form_signed || false,
              officePolicy: dbPatient.office_policy || false
            };
            
            // Add the patient to storage
            await storage.initializePatientFromDb(patient);
            console.log(`Loaded patient ID: ${patient.id} (User ID: ${patient.userId}) into memory storage`);
          }
          
          console.log('Successfully loaded database data into memory storage');
        } catch (loadError) {
          console.error('Failed to load database data into memory storage:', loadError);
          console.error('Full error details:', loadError instanceof Error ? loadError.stack : loadError);
          console.warn('Continuing with empty memory storage');
        }
      } catch (error) {
        console.error('Failed to seed database:', error);
        console.error('Full error details:', error instanceof Error ? error.stack : error);
        // Don't exit on seeding error, just log it
        console.warn('Continuing without seeding database');
      }
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    console.error('Full error details:', error instanceof Error ? error.stack : error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer().catch(error => {
  console.error('Unhandled startup error:', error);
  console.error('Full error details:', error instanceof Error ? error.stack : error);
  process.exit(1);
});