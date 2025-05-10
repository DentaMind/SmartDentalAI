/**
 * Auth Test Script
 * This script tests the password authentication logic to verify it matches
 * the implementation in auth.ts
 */
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import pg from 'pg';

const { Pool } = pg;
const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

async function testAuth() {
  try {
    console.log("Testing auth functionality with database passwords...");
    
    // Connect to the database
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    // Get a test user
    const result = await pool.query(
      'SELECT username, password FROM users WHERE username = $1',
      ['admin']
    );
    
    if (result.rows.length === 0) {
      console.log("Test user 'admin' not found!");
      return;
    }
    
    const testUser = result.rows[0];
    console.log(`Testing for user: ${testUser.username}`);
    console.log(`Stored password hash: ${testUser.password}`);
    console.log(`Hash length: ${testUser.password.length}`);
    
    // Test authentication with correct password
    const correctPassword = 'password';
    const correctResult = await comparePasswords(correctPassword, testUser.password);
    console.log(`Auth test with correct password '${correctPassword}': ${correctResult ? 'SUCCESS' : 'FAILED'}`);
    
    // Test authentication with incorrect password
    const incorrectPassword = 'wrongpassword';
    const incorrectResult = await comparePasswords(incorrectPassword, testUser.password);
    console.log(`Auth test with incorrect password '${incorrectPassword}': ${incorrectResult ? 'FAILED (should be false)' : 'SUCCESS (correctly rejected)'}`);
    
    // Generate a new hash for test comparison
    const newHash = await hashPassword('password');
    console.log(`\nNew hash for 'password': ${newHash}`);
    console.log(`New hash length: ${newHash.length}`);
    
    // Split parts for verification
    const [hashedPart, saltPart] = newHash.split('.');
    console.log(`Hash part: ${hashedPart} (length: ${hashedPart.length})`);
    console.log(`Salt part: ${saltPart} (length: ${saltPart.length})`);
    
    // Verify the new hash
    const verifyResult = await comparePasswords('password', newHash);
    console.log(`Verification of new hash: ${verifyResult ? 'SUCCESS' : 'FAILED'}`);
    
    await pool.end();
  } catch (error) {
    console.error("Error during auth test:", error);
  }
}

testAuth();