/**
 * Script to reset login access for the dentist account
 */
const bcrypt = require('bcrypt');
const { db } = require('./server/db');
const { users } = require('./shared/schema');
const { eq } = require('drizzle-orm');

async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

async function resetLoginTest() {
  try {
    console.log('Resetting test login for dentist account...');
    
    // Hash the password
    const hashedPassword = await hashPassword('password');
    
    // Update the dentist account with username 'dentist'
    const result = await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.username, 'dentist'))
      .returning({ id: users.id, username: users.username });
    
    if (result.length > 0) {
      console.log(`Successfully reset password for user: ${result[0].username} (ID: ${result[0].id})`);
    } else {
      console.log('No user found with username "dentist"');
    }
    
    console.log('Test login reset completed');
  } catch (error) {
    console.error('Error resetting test login:', error);
  }
}

resetLoginTest();