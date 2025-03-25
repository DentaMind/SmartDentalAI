/**
 * Script to reset passwords for all test users in DentaMind
 */
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import pg from 'pg';

const { Pool } = pg;
const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(8).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function resetAllPasswords() {
  try {
    console.log("Resetting passwords for all test users...");
    
    // Connect to the database
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    // List of all test users with their passwords
    const users = [
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
    
    // Update password for each user
    for (const user of users) {
      // Hash the password
      const passwordHash = await hashPassword(user.password);
      
      // Update user's password
      await pool.query(
        'UPDATE users SET password = $1 WHERE username = $2',
        [passwordHash, user.username]
      );
      
      console.log(`Updated password for user: ${user.username}`);
    }
    
    console.log("All passwords reset successfully");
    
    await pool.end();
  } catch (error) {
    console.error("Error resetting passwords:", error);
  }
}

resetAllPasswords();