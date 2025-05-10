/**
 * Script to fix the login credentials for the test account
 * by directly updating the database with correct field values
 */
const { Pool } = require('pg');
const crypto = require('crypto');
const util = require('util');

// Promisify scrypt function
const scryptAsync = util.promisify(crypto.scrypt);

/**
 * Create a proper password hash with salt
 */
async function hashPassword(password) {
  const salt = crypto.randomBytes(8).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

/**
 * Fix the dentist user login credentials
 */
async function fixUserLogin() {
  try {
    console.log("Starting user login fix...");
    
    // Connect to the database
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    // Let's inspect the users table structure to understand available columns
    const columnsResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    
    console.log("Users table schema:");
    columnsResult.rows.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type}`);
    });
    
    // Create a password hash for 'password'
    const passwordHash = await hashPassword('password');
    
    console.log("Generated password hash:", passwordHash);
    
    // Check if 'password' or 'password_hash' column exists
    const hasPasswordColumn = columnsResult.rows.some(col => col.column_name === 'password');
    const hasPasswordHashColumn = columnsResult.rows.some(col => col.column_name === 'password_hash');
    
    // Get current dentist user info
    const userResult = await pool.query('SELECT * FROM users WHERE username = $1', ['dentist']);
    
    if (userResult.rows.length === 0) {
      console.log("No dentist user found, creating one...");
      
      // Create new user SQL 
      const insertSQL = hasPasswordHashColumn 
        ? 'INSERT INTO users (username, password_hash, role, first_name, last_name, email) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username'
        : 'INSERT INTO users (username, password, role, first_name, last_name, email) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username';
      
      const insertResult = await pool.query(
        insertSQL,
        ['dentist', passwordHash, 'doctor', 'Test', 'Doctor', 'dentist@example.com']
      );
      
      console.log(`Created new dentist user: ${insertResult.rows[0].username} (ID: ${insertResult.rows[0].id})`);
    } else {
      const user = userResult.rows[0];
      console.log("Existing dentist user found:", user.id);
      
      // Update the password in the correct column
      const updateSQL = hasPasswordHashColumn 
        ? 'UPDATE users SET password_hash = $1 WHERE username = $2 RETURNING id, username'
        : 'UPDATE users SET password = $1 WHERE username = $2 RETURNING id, username';
        
      const updateResult = await pool.query(updateSQL, [passwordHash, 'dentist']);
      
      console.log(`Updated password for user: ${updateResult.rows[0].username} (ID: ${updateResult.rows[0].id})`);
      
      // For debugging: Also update any alternate password field that might exist
      if (hasPasswordColumn && hasPasswordHashColumn) {
        console.log("Both password and password_hash columns exist, updating both...");
        
        // Update both fields to ensure compatibility
        await pool.query(
          'UPDATE users SET password = $1, password_hash = $1 WHERE username = $2',
          [passwordHash, 'dentist']
        );
        
        console.log("Updated both password fields");
      }
    }
    
    // Check for any other test users we should update
    const testUsers = ['drabdin', 'patient1', 'maryrdh', 'admin'];
    
    for (const username of testUsers) {
      const userExists = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
      
      if (userExists.rows.length > 0) {
        console.log(`Updating password for test user: ${username}`);
        
        // Update the password in the correct column
        const updateSQL = hasPasswordHashColumn 
          ? 'UPDATE users SET password_hash = $1 WHERE username = $2 RETURNING id'
          : 'UPDATE users SET password = $1 WHERE username = $2 RETURNING id';
          
        const result = await pool.query(updateSQL, [passwordHash, username]);
        
        if (result.rows.length > 0) {
          console.log(`Updated password for ${username} (ID: ${result.rows[0].id})`);
          
          // Update both fields if both exist
          if (hasPasswordColumn && hasPasswordHashColumn) {
            await pool.query(
              'UPDATE users SET password = $1, password_hash = $1 WHERE username = $2',
              [passwordHash, username]
            );
          }
        }
      }
    }
    
    // Close the database connection
    await pool.end();
    
    console.log("User login fix completed successfully");
  } catch (error) {
    console.error("Error fixing user login:", error);
  }
}

fixUserLogin();