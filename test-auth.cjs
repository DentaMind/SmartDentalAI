/**
 * Auth Test Script
 * This script tests the password authentication logic to verify it matches
 * the implementation in auth.ts
 */
const crypto = require('crypto');
const util = require('util');

const scryptAsync = util.promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(8).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied, stored) {
  try {
    // Make sure we have a valid stored password format
    if (!stored || !stored.includes(".")) {
      console.error("Invalid stored password format, missing salt separator");
      return false;
    }

    const [hashed, salt] = stored.split(".");
    
    // Validate both parts exist before attempting comparison
    if (!hashed || !salt) {
      console.error("Invalid stored password parts, either hash or salt is missing");
      return false;
    }

    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = await scryptAsync(supplied, salt, 64);
    
    // Debug info
    console.log('Original stored password:', stored);
    console.log('Extracted hash part:', hashed.substring(0, 20) + '...');
    console.log('Extracted salt part:', salt);
    console.log('Calculated hash from supplied password:', suppliedBuf.toString("hex").substring(0, 20) + '...');
    
    // Compare using timingSafeEqual
    const result = crypto.timingSafeEqual(hashedBuf, suppliedBuf);
    console.log('Comparison result:', result);
    return result;
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
}

async function testAuth() {
  try {
    // Test with the currently stored password from the database
    const storedPassword = "113609f63514587d7aad4544659d3b89e1bc1470ff68b5292e8ed39f0b8a0caff4a021e1bfe641e0e052efe38f490acad788395775be9237993230ddb6d23d1c.71a10a97abce2cef";
    
    console.log("Testing with stored password hash from db");
    console.log("---------------------------------------");
    
    // Test with the actual password
    const isValid = await comparePasswords("password", storedPassword);
    console.log("Is password valid?", isValid);
    
    // Generate a new hash for reference
    console.log("\nGenerating a new hash for reference:");
    console.log("---------------------------------------");
    const newHash = await hashPassword("password");
    console.log("New hash for 'password':", newHash);
    
    // Test with the new hash
    console.log("\nTesting with newly generated hash:");
    console.log("---------------------------------------");
    const isValidNew = await comparePasswords("password", newHash);
    console.log("Is password valid with new hash?", isValidNew);
    
  } catch (error) {
    console.error("Auth test failed:", error);
  }
}

testAuth();