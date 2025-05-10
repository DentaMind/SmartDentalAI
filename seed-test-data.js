import postgres from 'postgres';
import bcrypt from 'bcrypt';

async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

async function main() {
  console.log('Connecting to database for seeding test data...');
  
  // Get the DATABASE_URL from environment variables
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  // Connect to the database
  const sql = postgres(connectionString);
  
  try {
    console.log('Connected to database. Starting to seed data...');
    
    // Create a test provider/doctor user
    const passwordHash = await hashPassword('password123');
    
    // Check if user already exists
    const existingUsers = await sql`SELECT id FROM users WHERE username = 'testdoctor'`;
    let userId;
    
    if (existingUsers.length > 0) {
      userId = existingUsers[0].id;
      console.log(`Test user already exists with id: ${userId}`);
    } else {
      // Create the test user
      const newUser = await sql`
        INSERT INTO users (
          username, password, role, language, first_name, last_name, 
          email, specialization, license_number
        ) VALUES (
          'testdoctor', ${passwordHash}, 'doctor', 'en', 'Test', 'Doctor', 
          'doctor@example.com', 'General Dentist', 'DDS123456'
        ) RETURNING id
      `;
      
      userId = newUser[0].id;
      console.log(`Created test user with id: ${userId}`);
    }
    
    // Check if patient already exists
    const existingPatients = await sql`SELECT id FROM patients WHERE user_id = ${userId}`;
    
    if (existingPatients.length > 0) {
      console.log(`Test patient already exists with id: ${existingPatients[0].id}`);
    } else {
      // Create a test patient
      const newPatient = await sql`
        INSERT INTO patients (
          user_id, medical_history, allergies, blood_type,
          emergency_contact, insurance_primary_holder, 
          insurance_holder_relation
        ) VALUES (
          ${userId}, 
          '{"systemicConditions": ["Hypertension"], "medications": ["Lisinopril"], "allergies": ["Penicillin"], "smoking": false}', 
          '["Penicillin", "Latex"]', 
          'O+',
          '{"name": "Emergency Contact", "phone": "555-1234", "relationship": "Spouse"}',
          'Self',
          'Self'
        ) RETURNING id
      `;
      
      console.log(`Created test patient with id: ${newPatient[0].id}`);
    }
    
    console.log('Test data seeding completed successfully!');
  } catch (error) {
    console.error('Error during data seeding:', error);
  } finally {
    // Close the connection
    await sql.end();
    console.log('Database connection closed');
  }
}

main();