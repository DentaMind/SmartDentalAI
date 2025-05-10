/**
 * Script to reset all patient passwords to 'password'
 * This ensures all patient accounts use the same password format
 * for consistent authentication
 */
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

async function resetPatientPasswords() {
  try {
    console.log("Resetting patient passwords...");
    
    // Connect to the database
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    // Get database connection time to verify connection
    const timeResult = await pool.query('SELECT NOW()');
    console.log(`Database connection successful at: ${timeResult.rows[0].now}`);
    
    // Get all patient users
    console.log("Fetching patient users from database...");
    const usersResult = await pool.query(`
      SELECT * FROM users 
      WHERE role = 'patient'
    `);
    
    console.log(`Found ${usersResult.rows.length} patient users in database`);
    
    // Hash the standard password
    const standardPassword = 'password';
    const hashedPassword = await hashPassword(standardPassword);
    
    // Update each patient's password
    for (const user of usersResult.rows) {
      console.log(`Updating password for patient: ${user.username} (ID: ${user.id})`);
      
      // Update the password field
      await pool.query(`
        UPDATE users 
        SET password = $1
        WHERE id = $2
      `, [hashedPassword, user.id]);
      
      console.log(`Password updated for ${user.username}`);
    }
    
    console.log("All patient passwords have been reset to 'password'");
    console.log("Patient accounts can now be accessed with their username and the password 'password'");
    
    // Close the database pool
    await pool.end();
    
  } catch (error) {
    console.error("Error resetting patient passwords:", error);
  }
}

resetPatientPasswords();