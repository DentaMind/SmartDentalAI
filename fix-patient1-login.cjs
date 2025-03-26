/**
 * Direct fix for patient1 login using crypto
 */
const { Pool } = require('pg');
const crypto = require('crypto');
const { promisify } = require('util');

const scryptAsync = promisify(crypto.scrypt);

async function hashPasswordCorrectly(password) {
  const salt = crypto.randomBytes(8).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function fixPatient1Login() {
  console.log('Directly fixing patient1 login with correctly formatted password...');

  try {
    // Connect to the database
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // Get userId for patient1
    const userResult = await pool.query(`
      SELECT * FROM users WHERE username = 'patient1'
    `);

    if (userResult.rows.length === 0) {
      console.error('Error: patient1 user not found!');
      await pool.end();
      return;
    }

    const user = userResult.rows[0];
    console.log(`Found patient1 user with ID: ${user.id}`);
    console.log(`Current password value: ${user.password}`);

    // Generate new password hash with correct format
    const hashedPassword = await hashPasswordCorrectly('password');
    console.log(`Generated new password hash with correct format: ${hashedPassword}`);

    // Update the user record directly
    await pool.query(`
      UPDATE users 
      SET password = $1
      WHERE id = $2
    `, [hashedPassword, user.id]);

    console.log(`Updated patient1 password to correctly formatted hash`);
    console.log(`Direct password fix for patient1 completed!`);

    // Set password directly to 'password' for testing only
    if (process.env.NODE_ENV !== 'production') {
      console.log(`DEVELOPMENT MODE: Setting plain text password for testing...`);
      
      // This should only be used in development/testing
      await pool.query(`
        UPDATE users 
        SET password = 'password'
        WHERE username IN ('patient1', 'patient2', 'patient3', 'patient4', 'patient5')
      `);
      
      console.log(`Set plain text passwords for all patient accounts for easier testing`);
    }

    await pool.end();
  } catch (error) {
    console.error('Error fixing patient1 login:', error);
  }
}

fixPatient1Login();