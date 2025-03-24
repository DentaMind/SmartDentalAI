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
    
    // Update passwords for specific test users
    const updates = [
      { username: 'dentist', password: 'password' },
      { username: 'drabdin', password: 'password' },
      { username: 'maryrdh', password: 'password' },
      { username: 'patient1', password: 'patient123' },
      { username: 'patient2', password: 'patient123' },
      { username: 'admin', password: 'password' }
    ];
    
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
    
    // Show all users for reference
    console.log("\nAll users in the database:");
    existingUsers.rows.forEach(user => {
      console.log(`- ${user.username} (ID: ${user.id}, Role: ${user.role})`);
    });
    
    console.log("\nPassword reset completed successfully!");
    
    await pool.end();
  } catch (error) {
    console.error("Error resetting passwords:", error);
  }
}

resetPasswords();