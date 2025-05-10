// @ts-check
/**
 * Script to fix the MemStorage implementation by initializing it with database data
 * This ensures the in-memory storage contains all user records from the database
 */
import pg from 'pg';
const { Pool } = pg;
import { storage } from './server/storage.js';

// Log available paths for debugging
import fs from 'fs';
console.log('Available files in server directory:');
try {
  const files = fs.readdirSync('./server');
  console.log(files);
} catch (err) {
  console.error('Error reading server directory:', err);
}

async function fixStorageLoading() {
  try {
    console.log("Starting storage initialization with database data...");
    
    // Connect to database
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    // Get the current time to verify database connection
    const timeResult = await pool.query('SELECT NOW()');
    console.log(`Database connection successful: ${timeResult.rows[0].now}`);
    
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
        mfaSecret: '',
        mfaEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {}
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
        
        // Medical information
        allergies: dbPatient.allergies || null,
        currentMedications: dbPatient.current_medications || null,
        medicalHistory: dbPatient.medical_history || null,
        
        // Include other fields as needed
      };
      
      // Add the patient to storage
      await storage.initializePatientFromDb(patient);
      console.log(`Loaded patient ID: ${patient.id} (User ID: ${patient.userId}) into memory storage`);
    }
    
    await pool.end();
    console.log('Successfully loaded database data into memory storage');
    console.log('Storage initialization complete!');
  } catch (error) {
    console.error('Failed to load database data into memory storage:', error);
    console.error('Full error details:', error.stack);
  }
}

fixStorageLoading();