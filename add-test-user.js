/**
 * Script to add a specific test user to DentaMind for email testing
 * 
 * This script adds Dr. Abdin's test account and associated data
 * for proper testing of the email and intake form functionality.
 */

const { pool } = require('./server/db');
const { hashPassword } = require('./server/auth');
const { users, patients } = require('./shared/schema');
const { db } = require('./server/db');
const { eq } = require('drizzle-orm');

/**
 * Adds a specific test user to the system
 */
async function addTestUser() {
  console.log('Starting to add test user for Dr. Abdin...');
  
  try {
    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, 'aabdin@bu.edu'));
    
    if (existingUser.length > 0) {
      console.log(`Test user with email aabdin@bu.edu already exists. Skipping creation.`);
      return;
    }

    // Create doctor user account
    const doctorPasswordHash = await hashPassword('password');
    
    const [doctorUser] = await db.insert(users).values({
      username: 'drabdin',
      passwordHash: doctorPasswordHash,
      email: 'aabdin@bu.edu',
      firstName: 'Ahmad',
      lastName: 'Abdin',
      role: 'doctor',
      mfaSecret: '',
      mfaEnabled: false,
      specialization: 'General Dentistry',
      licenseNumber: 'DDS12345',
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    console.log(`Created doctor user: Ahmad Abdin (ID: ${doctorUser.id})`);

    // Create test patient with the email address for intake form testing
    const patientPasswordHash = await hashPassword('password');
    
    const [patientUser] = await db.insert(users).values({
      username: 'testpatient',
      passwordHash: patientPasswordHash,
      email: 'aabdin@bu.edu', // Using same email for testing
      firstName: 'Test',
      lastName: 'Patient',
      role: 'patient',
      mfaSecret: '',
      mfaEnabled: false,
      specialization: null,
      licenseNumber: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    // Create patient record
    await db.insert(patients).values({
      userId: patientUser.id,
      dateOfBirth: new Date('1990-01-01'),
      gender: 'male',
      phoneNumber: '617-555-1234', // Test phone number
      address: '123 Main St, Boston, MA 02115',
      insuranceProvider: 'Delta Dental',
      insuranceId: 'DD12345678',
      medicalHistory: JSON.stringify({
        systemicConditions: [],
        medications: [],
        allergies: [],
        smoking: false
      }),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log(`Created test patient: Test Patient (ID: ${patientUser.id})`);

    // Create a hygienist account
    const hygienistPasswordHash = await hashPassword('password');
    
    const [hygienistUser] = await db.insert(users).values({
      username: 'hygienist1',
      passwordHash: hygienistPasswordHash,
      email: 'hygienist@dentamind.example.com',
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'staff',
      mfaSecret: '',
      mfaEnabled: false,
      specialization: 'Dental Hygienist',
      licenseNumber: 'RDH54321',
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    console.log(`Created hygienist user: Sarah Johnson (ID: ${hygienistUser.id})`);

    // Create an admin account
    const adminPasswordHash = await hashPassword('password');
    
    const [adminUser] = await db.insert(users).values({
      username: 'admin',
      passwordHash: adminPasswordHash,
      email: 'dentamind27@gmail.com', // Practice email
      firstName: 'Admin',
      lastName: 'User',
      role: 'staff',
      mfaSecret: '',
      mfaEnabled: false,
      specialization: 'Practice Administrator',
      licenseNumber: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    console.log(`Created admin user: Admin User (ID: ${adminUser.id})`);

    console.log('Successfully added all test users!');
    console.log('Test accounts created:');
    console.log('- Doctor: drabdin / password');
    console.log('- Patient: testpatient / password');
    console.log('- Hygienist: hygienist1 / password');
    console.log('- Admin: admin / password');
    
  } catch (error) {
    console.error('Error adding test users:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Execute the function
addTestUser().catch(console.error);