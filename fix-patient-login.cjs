/**
 * Script to fix the patient1 login credentials
 */
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function fixPatientLogin() {
  console.log('Fixing patient login credentials...');

  try {
    // Connect to the database
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // Get userId for patient1
    const userResult = await pool.query(`
      SELECT id FROM users WHERE username = 'patient1'
    `);

    if (userResult.rows.length === 0) {
      console.error('Error: patient1 user not found!');
      await pool.end();
      return;
    }

    const userId = userResult.rows[0].id;
    console.log(`Found patient1 user with ID: ${userId}`);

    // Hash the password
    const hashedPassword = await hashPassword('password');
    console.log(`Generated new password hash for patient1`);

    // Update the user record with the new hashed password
    await pool.query(`
      UPDATE users 
      SET password = $1 
      WHERE id = $2
    `, [hashedPassword, userId]);

    console.log(`Password hash updated for patient1 (user ID: ${userId})`);

    // Check if patient record exists
    const patientResult = await pool.query(`
      SELECT id FROM patients WHERE user_id = $1
    `, [userId]);

    if (patientResult.rows.length === 0) {
      console.log('No patient record found for patient1, user might be staff/admin');
    } else {
      console.log(`Found patient record for patient1: ${patientResult.rows[0].id}`);
    }

    console.log('Patient login credentials fixed successfully!');
    await pool.end();
  } catch (error) {
    console.error('Error fixing patient login:', error);
  }
}

fixPatientLogin();