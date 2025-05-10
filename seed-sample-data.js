// This script creates test data for the DentaMind system
const { spawn } = require('child_process');
const { writeFileSync, existsSync, mkdirSync } = require('fs');
const path = require('path');

// Sample data for patients
const testPatients = [
  {
    username: 'patient1',
    password: 'password',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@example.com',
    dob: '1980-05-15',
    gender: 'male',
    phoneNumber: '555-123-4567',
    address: '123 Main St, Anytown, CA 90210',
    insuranceProvider: 'Delta Dental',
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
    phoneNumber: '555-987-6543',
    address: '456 Oak Ave, Somewhere, NY 10001',
    insuranceProvider: 'Cigna',
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
    phoneNumber: '555-555-5555',
    address: '789 Elm St, Elsewhere, TX 75001',
    insuranceProvider: 'Aetna',
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
    phoneNumber: '555-789-0123',
    address: '321 Pine St, Nowhere, FL 33101',
    insuranceProvider: 'MetLife',
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
    phoneNumber: '555-456-7890',
    address: '654 Cedar St, Somewhere Else, WA 98101',
    insuranceProvider: 'United Healthcare',
    insuranceId: 'UH789123456',
    medicalHistory: JSON.stringify({
      systemicConditions: ['Coronary Artery Disease', 'Hyperlipidemia'],
      medications: ['Atorvastatin', 'Clopidogrel', 'Aspirin'],
      allergies: ['Sulfa Drugs'],
      smoking: true
    })
  }
];

// Create SQL insertion commands for patients
function generateSQLCommands() {
  const sqlDir = path.join(__dirname, 'sql');
  if (!existsSync(sqlDir)) {
    mkdirSync(sqlDir);
  }

  const sqlFilePath = path.join(sqlDir, 'insert_test_patients.sql');
  let sql = '';

  // Insert users first
  testPatients.forEach((patient, index) => {
    sql += `-- Create user for ${patient.firstName} ${patient.lastName}\n`;
    sql += `INSERT INTO users (username, "passwordHash", email, "firstName", "lastName", role, "mfaSecret", "mfaEnabled", "createdAt", "updatedAt")\n`;
    sql += `VALUES ('${patient.username}', '$2b$10$LqXB9wMxHUVLYG0nGQfRjuKLQX4iKZ0BHLiID22v70iyZXrsiCVvC', '${patient.email}', '${patient.firstName}', '${patient.lastName}', 'patient', '', false, NOW(), NOW())\n`;
    sql += `RETURNING id AS user_id_${index + 1};\n\n`;
  });

  // Then insert patients linked to users
  testPatients.forEach((patient, index) => {
    sql += `-- Create patient record for ${patient.firstName} ${patient.lastName}\n`;
    sql += `INSERT INTO patients ("userId", "dateOfBirth", gender, "phoneNumber", address, "insuranceProvider", "insuranceId", "medicalHistory", "createdAt", "updatedAt")\n`;
    sql += `VALUES ((SELECT user_id_${index + 1} FROM users WHERE username = '${patient.username}' LIMIT 1), '${patient.dob}', '${patient.gender}', '${patient.phoneNumber}', '${patient.address}', '${patient.insuranceProvider}', '${patient.insuranceId}', '${patient.medicalHistory}', NOW(), NOW());\n\n`;
  });

  writeFileSync(sqlFilePath, sql);
  console.log(`SQL commands written to ${sqlFilePath}`);
  
  return sqlFilePath;
}

// Main function to generate sample data
async function generateSampleData() {
  console.log('Generating sample data for DentaMind...');
  
  try {
    // Generate SQL commands
    const sqlFilePath = generateSQLCommands();
    
    // Run SQL commands if a database is available
    console.log('To insert these test patients into your database, run:');
    console.log(`psql -U <username> -d <database_name> -f ${sqlFilePath}`);
    console.log('\nOr use the SQL tool in Replit to execute these SQL commands.');
    
    // Let the user know about the test accounts
    console.log('\nTest patient accounts created:');
    testPatients.forEach(patient => {
      console.log(`- ${patient.firstName} ${patient.lastName} (${patient.username}/password)`);
    });
    
    console.log('\nRemember to also log in with a staff or doctor account to access these patient records.');
    console.log('Default credentials: dentist/password, drabdin/password');
    
  } catch (error) {
    console.error('Error generating sample data:', error);
  }
}

// Run the generator
generateSampleData().catch(console.error);