/**
 * Script to seed test patients into the DentaMind system
 * 
 * This will create a set of test patients with various dental conditions
 * to allow for testing of the periodontal chart and other features.
 */

const { pool } = require('./server/db');
const { hashPassword } = require('./server/auth');
const { users, patients } = require('./shared/schema');
const { db } = require('./server/db');
const { eq } = require('drizzle-orm');

/**
 * Main seeding function
 */
async function seedTestPatients() {
  console.log('Starting to seed test patients...');
  
  try {
    // Check if patients already exist
    const existingPatients = await db.select().from(patients);
    
    if (existingPatients.length > 0) {
      console.log(`Database already has ${existingPatients.length} patients. Skipping seeding.`);
      console.log('Existing patients:');
      for (const patient of existingPatients) {
        const user = await db.select().from(users).where(eq(users.id, patient.userId));
        console.log(`- ${user[0]?.firstName} ${user[0]?.lastName} (ID: ${patient.id})`);
      }
      return;
    }

    // Create test patient users
    const testPatients = [
      {
        username: 'patient1',
        password: 'password',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@example.com',
        dob: '1980-05-15',
        gender: 'male',
        phone: '555-123-4567',
        address: '123 Main St, Anytown, CA 90210',
        insurance: 'Delta Dental',
        insuranceId: 'DD123456789',
        medicalHistory: JSON.stringify({
          systemicConditions: ['Hypertension', 'Type 2 Diabetes'],
          medications: ['Lisinopril', 'Metformin'],
          allergies: ['Penicillin'],
          smoking: true
        })
      },
      {
        username: 'patient2',
        password: 'password',
        firstName: 'Emily',
        lastName: 'Johnson',
        email: 'emily.johnson@example.com',
        dob: '1992-11-23',
        gender: 'female',
        phone: '555-987-6543',
        address: '456 Oak Ave, Somewhere, NY 10001',
        insurance: 'Cigna',
        insuranceId: 'CG987654321',
        medicalHistory: JSON.stringify({
          systemicConditions: ['Asthma'],
          medications: ['Albuterol'],
          allergies: ['Latex', 'Aspirin'],
          smoking: false
        })
      },
      {
        username: 'patient3',
        password: 'password',
        firstName: 'Robert',
        lastName: 'Garcia',
        email: 'robert.garcia@example.com',
        dob: '1975-03-28',
        gender: 'male',
        phone: '555-555-5555',
        address: '789 Elm St, Elsewhere, TX 75001',
        insurance: 'Aetna',
        insuranceId: 'AE567891234',
        medicalHistory: JSON.stringify({
          systemicConditions: ['Osteoporosis'],
          medications: ['Alendronate'],
          allergies: [],
          smoking: false
        })
      },
      {
        username: 'patient4',
        password: 'password',
        firstName: 'Sophia',
        lastName: 'Martinez',
        email: 'sophia.martinez@example.com',
        dob: '1988-09-12',
        gender: 'female',
        phone: '555-789-0123',
        address: '321 Pine St, Nowhere, FL 33101',
        insurance: 'MetLife',
        insuranceId: 'ML654321987',
        medicalHistory: JSON.stringify({
          systemicConditions: ['Pregnancy'],
          medications: ['Prenatal Vitamins'],
          allergies: ['Codeine'],
          smoking: false
        })
      },
      {
        username: 'patient5',
        password: 'password',
        firstName: 'David',
        lastName: 'Lee',
        email: 'david.lee@example.com',
        dob: '1965-07-30',
        gender: 'male',
        phone: '555-456-7890',
        address: '654 Cedar St, Somewhere Else, WA 98101',
        insurance: 'United Healthcare',
        insuranceId: 'UH789123456',
        medicalHistory: JSON.stringify({
          systemicConditions: ['Coronary Artery Disease', 'Hyperlipidemia'],
          medications: ['Atorvastatin', 'Clopidogrel', 'Aspirin'],
          allergies: ['Sulfa Drugs'],
          smoking: true
        })
      }
    ];

    // Insert patients into database
    for (const patientData of testPatients) {
      const { username, password, firstName, lastName, email, dob, gender, phone, address, insurance, insuranceId, medicalHistory } = patientData;
      
      // Create user account
      const passwordHash = await hashPassword(password);
      
      const [user] = await db.insert(users).values({
        username,
        passwordHash,
        email,
        firstName,
        lastName,
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
        userId: user.id,
        dateOfBirth: new Date(dob),
        gender,
        phoneNumber: phone,
        address,
        insuranceProvider: insurance,
        insuranceId,
        medicalHistory,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log(`Created patient: ${firstName} ${lastName}`);
    }

    console.log('Successfully seeded test patients!');
  } catch (error) {
    console.error('Error seeding test patients:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Execute the seeding function
seedTestPatients().catch(console.error);