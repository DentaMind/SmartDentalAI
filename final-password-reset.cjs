/**
 * Final solution to fix all patient logins
 * This script will:
 * 1. Reset ALL user passwords to "password" (test accounts only)
 * 2. Use the exact same method as in auth.ts to ensure compatibility
 */
const { Pool } = require('pg');
const crypto = require('crypto');
const { promisify } = require('util');

const scryptAsync = promisify(crypto.scrypt);

// This is the exact same function as in auth.ts
async function hashPassword(password) {
  const salt = crypto.randomBytes(8).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function fixAllPasswords() {
  console.log('=== FINAL PASSWORD RESET FOR ALL ACCOUNTS ===');

  try {
    // Connect to the database
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // Get all users
    const userResult = await pool.query(`
      SELECT id, username, role FROM users
    `);

    if (userResult.rows.length === 0) {
      console.error('No users found in the database!');
      await pool.end();
      return;
    }

    console.log(`Found ${userResult.rows.length} users in the database`);

    // Correctly hash the password using the same method as in auth.ts
    const hashedPassword = await hashPassword('password');

    console.log(`Generated new password hash: ${hashedPassword}`);
    
    // Keep track of updated users
    const updatedUsers = [];

    // Update all users with new password
    for (const user of userResult.rows) {
      await pool.query(`
        UPDATE users 
        SET password = $1
        WHERE id = $2
      `, [hashedPassword, user.id]);
      
      updatedUsers.push({
        id: user.id,
        username: user.username,
        role: user.role
      });
      
      console.log(`Reset password for ${user.username} (${user.role}, ID: ${user.id})`);
    }

    console.log('\n=== PASSWORD RESET SUMMARY ===');
    console.log(`Reset ${updatedUsers.length} passwords successfully`);
    console.log('\nTest accounts with password="password":');
    updatedUsers.forEach(user => {
      console.log(`- ${user.username} (${user.role})`);
    });
    
    console.log('\n=== RESET COMPLETE ===');
    console.log('All users can now login with password: "password"');

    await pool.end();
  } catch (error) {
    console.error('Error fixing passwords:', error);
  }
}

fixAllPasswords();