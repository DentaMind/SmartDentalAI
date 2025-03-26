/**
 * Script to fix test login credentials with dentist/password
 * 
 * This script directly updates the database with properly hashed password
 * using the same crypto mechanism as the main application
 */
const crypto = require('crypto');
const util = require('util');
const { Pool } = require('pg');

// Promisify scrypt function
const scryptAsync = util.promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(8).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function fixTestLogin() {
  try {
    console.log("Fixing test login for dentist account...");
    
    // Connect to the database
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    // Create a simple hashed password
    const passwordHash = await hashPassword("password");
    
    console.log("Checking if dentist user exists...");
    
    // First check if the dentist user exists
    const checkResult = await pool.query(
      'SELECT id, username FROM users WHERE username = $1',
      ['dentist']
    );
    
    if (checkResult.rows.length === 0) {
      console.log("No user found with username 'dentist', creating one...");
      
      // Create the dentist user if it doesn't exist
      const insertResult = await pool.query(
        'INSERT INTO users (username, password, role, first_name, last_name, email) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username',
        ['dentist', passwordHash, 'doctor', 'Test', 'Doctor', 'dentist@example.com']
      );
      
      console.log(`Created new dentist user: ${insertResult.rows[0].username} (ID: ${insertResult.rows[0].id})`);
    } else {
      console.log(`Dentist user exists with ID: ${checkResult.rows[0].id}, updating password...`);
      
      // Update the password for the existing dentist user
      const updateResult = await pool.query(
        'UPDATE users SET password = $1 WHERE username = $2 RETURNING id, username',
        [passwordHash, 'dentist']
      );
      
      console.log(`Updated password for user: ${updateResult.rows[0].username} (ID: ${updateResult.rows[0].id})`);
    }
    
    // Close the connection
    await pool.end();
    
    console.log("Login fix completed successfully");
  } catch (error) {
    console.error("Error fixing test login:", error);
  }
}

fixTestLogin();