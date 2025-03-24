/**
 * Script to add a test admin user to DentaMind and fix login credentials
 */
const { scrypt, randomBytes } = require('crypto');
const { promisify } = require('util');
const { Pool } = require('pg');

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(8).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function addTestAdmin() {
  try {
    console.log("Adding test admin user and fixing login credentials...");
    
    // Connect to the database
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    // Create admin user data
    const adminData = {
      username: "admin",
      password: "password", // Plain text for seeding
      email: "admin@example.com",
      firstName: "Admin",
      lastName: "User",
      role: "doctor",
      phoneNumber: "555-123-9999",
      dateOfBirth: "1990-01-01",
      specialization: "Administrator",
      licenseNumber: "ADMIN1234"
    };
    
    // Check if user already exists
    const existingUserResult = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [adminData.username]
    );
    
    if (existingUserResult.rows.length > 0) {
      console.log(`User ${adminData.username} already exists (ID: ${existingUserResult.rows[0].id})`);
      
      // Update the password for existing user
      const passwordHash = await hashPassword(adminData.password);
      
      await pool.query(
        'UPDATE users SET password = $1 WHERE username = $2',
        [passwordHash, adminData.username]
      );
      
      console.log(`Updated password for user: ${adminData.username}`);
    } else {
      // Hash the password for storage
      const passwordHash = await hashPassword(adminData.password);
      
      // Insert the admin user
      const result = await pool.query(
        `INSERT INTO users 
         (username, password, email, first_name, last_name, role, phone_number, date_of_birth, specialization, license_number, mfa_secret, mfa_enabled, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         RETURNING id`,
        [
          adminData.username,
          passwordHash,
          adminData.email,
          adminData.firstName,
          adminData.lastName,
          adminData.role,
          adminData.phoneNumber,
          adminData.dateOfBirth,
          adminData.specialization,
          adminData.licenseNumber,
          "", // mfa_secret
          false, // mfa_enabled
          new Date(), // created_at
          new Date() // updated_at
        ]
      );
      
      console.log(`Created admin user: ${adminData.username} (ID: ${result.rows[0].id})`);
    }
    
    // Also update all other test users with fresh password hashes
    const testUsers = ['dentist', 'drabdin', 'maryrdh', 'patient1', 'patient2'];
    const testPassword = 'password';
    const patientPassword = 'patient123';
    
    for (const username of testUsers) {
      const password = username.startsWith('patient') ? patientPassword : testPassword;
      const passwordHash = await hashPassword(password);
      
      // Check if user exists
      const userExists = await pool.query(
        'SELECT id FROM users WHERE username = $1',
        [username]
      );
      
      if (userExists.rows.length > 0) {
        await pool.query(
          'UPDATE users SET password = $1 WHERE username = $2',
          [passwordHash, username]
        );
        
        console.log(`Updated password for user: ${username}`);
      } else {
        console.log(`User ${username} not found, skipping password update`);
      }
    }
    
    // Show existing users for reference
    const allUsers = await pool.query('SELECT id, username, role FROM users ORDER BY id');
    console.log("All users in the database:");
    allUsers.rows.forEach(user => {
      console.log(`- ${user.username} (ID: ${user.id}, Role: ${user.role})`);
    });
    
    console.log("Test admin user and password updates completed successfully");
    
    await pool.end();
  } catch (error) {
    console.error("Error fixing login credentials:", error);
  }
}

addTestAdmin();