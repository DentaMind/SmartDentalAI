/**
 * Script to fix the MemStorage implementation by initializing it with database data
 * This ensures the in-memory storage contains all user records from the database
 */
import { Pool } from 'pg';
import { storage } from './server/storage.js';

async function fixStorageLoading() {
  try {
    console.log("Starting storage fix script...");
    
    // Connect to the database
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    // Get all users from the database
    console.log("Fetching users from database...");
    const usersResult = await pool.query('SELECT * FROM users');
    console.log(`Found ${usersResult.rows.length} users in the database`);
    
    // Initialize the database with the users
    console.log("Initializing in-memory storage with database users...");
    for (const dbUser of usersResult.rows) {
      // Convert database user to User object with proper camelCase properties
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
        metadata: dbUser.metadata || null
      };
      
      // Add the user to the storage
      await storage.initializeUserFromDb(user);
      console.log(`Added user ${user.username} (ID: ${user.id}) to in-memory storage`);
    }
    
    console.log("Fetching patients from database...");
    const patientsResult = await pool.query('SELECT * FROM patients');
    console.log(`Found ${patientsResult.rows.length} patients in the database`);
    
    // Initialize patients in storage
    console.log("Adding patients to in-memory storage...");
    for (const dbPatient of patientsResult.rows) {
      // Convert database patient to Patient object
      const patient = {
        id: dbPatient.id,
        userId: dbPatient.user_id,
        // Add other patient fields as needed
        homeAddress: dbPatient.home_address || null,
        emergencyContactName: dbPatient.emergency_contact_name || null,
        emergencyContactPhone: dbPatient.emergency_contact_phone || null,
        emergencyContactRelationship: dbPatient.emergency_contact_relationship || null,
        insuranceProvider: dbPatient.insurance_provider || null,
        insuranceNumber: dbPatient.insurance_number || null,
        allergies: dbPatient.allergies || null,
        currentMedications: dbPatient.current_medications || null,
        medicalHistory: dbPatient.medical_history || null,
        // Add any other patient fields
      };
      
      // Add the patient to the storage
      await storage.initializePatientFromDb(patient);
      console.log(`Added patient ID: ${patient.id} (User ID: ${patient.userId}) to in-memory storage`);
    }
    
    await pool.end();
    console.log("Storage fix completed successfully");
  } catch (error) {
    console.error("Storage fix failed:", error);
  }
}

fixStorageLoading();