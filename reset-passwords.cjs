/**
 * Script to reset passwords for existing users in DentaMind
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

async function resetPasswords() {
  try {
    console.log("Resetting passwords for existing users...");
    
    // Connect to the database
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    // Get all existing users first
    const existingUsers = await pool.query('SELECT id, username, role FROM users ORDER BY id');
    
    console.log(`Found ${existingUsers.rows.length} users in the database.`);
    
    // Update passwords for existing test users
    const updates = [
      { username: 'drabdin', password: 'password' },
      { username: 'testdoctor', password: 'password' },
      { username: 'testpatient', password: 'password' },
      { username: 'patient1', password: 'password' },
      { username: 'patient2', password: 'password' },
      { username: 'patient3', password: 'password' },
      { username: 'patient4', password: 'password' },
      { username: 'patient5', password: 'password' }
    ];
    
    // Add missing test users if needed
    const usersToAdd = [
      { username: 'admin', password: 'password', role: 'admin', firstName: 'Admin', lastName: 'User', email: 'admin@dentamind.com' },
      { username: 'dentist', password: 'password', role: 'doctor', firstName: 'Test', lastName: 'Dentist', email: 'dentist@dentamind.com' },
      { username: 'maryrdh', password: 'password', role: 'hygienist', firstName: 'Mary', lastName: 'RDH', email: 'mary@dentamind.com' }
    ];
    
    // Update passwords for existing users
    for (const update of updates) {
      // Check if user exists
      const userExists = existingUsers.rows.find(u => u.username === update.username);
      
      if (userExists) {
        // Hash the new password
        const passwordHash = await hashPassword(update.password);
        
        // Update the password
        await pool.query(
          'UPDATE users SET password = $1 WHERE username = $2',
          [passwordHash, update.username]
        );
        
        console.log(`Updated password for user: ${update.username} (ID: ${userExists.id})`);
      } else {
        console.log(`User ${update.username} not found, skipping update.`);
      }
    }
    
    // Add missing test users
    console.log("\nAdding missing test users...");
    for (const user of usersToAdd) {
      // Check if user already exists
      const userExists = existingUsers.rows.find(u => u.username === user.username);
      
      if (!userExists) {
        // Hash the password
        const passwordHash = await hashPassword(user.password);
        
        // Insert the user
        await pool.query(
          'INSERT INTO users (username, password, role, first_name, last_name, email) VALUES ($1, $2, $3, $4, $5, $6)',
          [user.username, passwordHash, user.role, user.firstName, user.lastName, user.email]
        );
        
        console.log(`Added new user: ${user.username} (Role: ${user.role})`);
      } else {
        console.log(`User ${user.username} already exists, skipping creation.`);
      }
    }
    
    // Get updated list of all users
    const allUsers = await pool.query('SELECT id, username, role FROM users ORDER BY id');
    
    // Show all users for reference
    console.log("\nAll users in the database:");
    allUsers.rows.forEach(user => {
      console.log(`- ${user.username} (ID: ${user.id}, Role: ${user.role})`);
    });
    
    console.log("\nPassword reset completed successfully!");
    
    await pool.end();
  } catch (error) {
    console.error("Error resetting passwords:", error);
  }
}

resetPasswords();