/**
 * Script to reset all test user passwords in DentaMind
 */
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import pg from 'pg';

const { Pool } = pg;
const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function resetTestPasswords() {
  try {
    console.log("Resetting test user passwords...");
    
    // Connect to the database
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    // Define all test users and their passwords
    const testUsers = [
      { username: 'admin', password: 'password' },
      { username: 'dentist', password: 'password' },
      { username: 'drabdin', password: 'password' },
      { username: 'maryrdh', password: 'password' },
      { username: 'patient1', password: 'password' },
      { username: 'patient2', password: 'password' },
      { username: 'patient3', password: 'password' },
      { username: 'patient4', password: 'password' },
      { username: 'patient5', password: 'password' }
    ];
    
    // Reset password for each test user
    for (const user of testUsers) {
      // Check if user exists
      const existingUserResult = await pool.query(
        'SELECT * FROM users WHERE username = $1',
        [user.username]
      );
      
      if (existingUserResult.rows.length === 0) {
        console.log(`User ${user.username} does not exist - creating new user`);
        
        // Create a new user if it doesn't exist
        const passwordHash = await hashPassword(user.password);
        const role = user.username.includes('patient') ? 'patient' : 
                    (user.username === 'maryrdh' ? 'staff' : 'doctor');
        
        await pool.query(
          `INSERT INTO users 
           (username, password, email, first_name, last_name, role, phone_number, 
            mfa_secret, mfa_enabled, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            user.username,
            passwordHash,
            `${user.username}@example.com`,
            user.username.charAt(0).toUpperCase() + user.username.slice(1),
            'User',
            role,
            '555-123-4567',
            '', // mfa_secret
            false, // mfa_enabled
            new Date(), // created_at
            new Date() // updated_at
          ]
        );
        
        console.log(`Created new user: ${user.username} with role: ${role}`);
      } else {
        // Update existing user's password
        const passwordHash = await hashPassword(user.password);
        
        await pool.query(
          'UPDATE users SET password = $1 WHERE username = $2',
          [passwordHash, user.username]
        );
        
        console.log(`Updated password for existing user: ${user.username}`);
      }
    }
    
    console.log("Test user password reset completed successfully");
    await pool.end();
  } catch (error) {
    console.error("Error resetting test user passwords:", error);
  }
}

resetTestPasswords();