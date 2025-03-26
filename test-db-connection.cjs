/**
 * Test database connection and authentication
 */
const pg = require('pg');
const { Pool } = pg;
const crypto = require('crypto');
const { scrypt, randomBytes, timingSafeEqual } = crypto;
const { promisify } = require('util');

const scryptAsync = promisify(scrypt);

// Password comparison function
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

async function testDbConnection() {
  try {
    console.log("Testing database connection...");
    
    // Connect to the database
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    // Test the connection
    const result = await pool.query('SELECT NOW()');
    console.log(`Database connection successful: ${result.rows[0].now}`);
    
    // Get all users to check if they exist
    const usersResult = await pool.query('SELECT * FROM users');
    console.log(`Found ${usersResult.rows.length} users in the database`);
    
    // Display important information (without sensitive details)
    usersResult.rows.forEach(user => {
      console.log(`User: ${user.username}, ID: ${user.id}, Role: ${user.role}`);
      console.log(`  Password hash length: ${user.password?.length || 0}`);
    });
    
    // Test authentication for a specific user
    const testUser = 'dentist';
    const testPassword = 'password';
    
    const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [testUser]);
    if (userResult.rows.length === 0) {
      console.error(`Test user "${testUser}" not found in database`);
    } else {
      const user = userResult.rows[0];
      console.log(`Found test user: ${user.username} (ID: ${user.id})`);
      
      // Test password
      const isMatch = await comparePasswords(testPassword, user.password);
      console.log(`Password match for ${testUser}: ${isMatch}`);
    }
    
    await pool.end();
    console.log("Database connection test completed");
  } catch (error) {
    console.error("Database connection test failed:", error);
  }
}

testDbConnection();