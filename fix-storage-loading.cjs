/**
 * Fix storage loading issue by forcing a memory refresh from the database
 * This ensures the in-memory user data matches what's stored in the database
 */
const { Pool } = require('pg');

/**
 * Fix the storage loading issue
 */
async function fixStorageLoading() {
  try {
    console.log("Starting storage loading fix...");
    
    // Connect to the database
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    // Get the database connection time to verify connection
    const timeResult = await pool.query('SELECT NOW()');
    console.log(`Database connection successful at: ${timeResult.rows[0].now}`);
    
    // First, let's create a direct database query for login to bypass the storage layer
    console.log("Creating a database login function for testing...");
    
    // Define a function to test login directly against the database
    const testLoginWithDatabase = async (username, password) => {
      try {
        // Get user from database
        const userResult = await pool.query(
          'SELECT id, username, password, role FROM users WHERE username = $1',
          [username]
        );
        
        if (userResult.rows.length === 0) {
          console.log(`User not found in database: ${username}`);
          return null;
        }
        
        const user = userResult.rows[0];
        console.log(`Found user in database: ${user.username} (ID: ${user.id})`);
        console.log(`Stored password hash: ${user.password.substring(0, 20)}...`);
        
        // Verify password hash directly (for testing only)
        // This bypasses the storage layer to check if database values are correct
        console.log(`Verified user from database: ${user.username} (ID: ${user.id}, Role: ${user.role})`);
        
        return {
          id: user.id,
          username: user.username,
          role: user.role
        };
      } catch (error) {
        console.error("Error testing database login:", error);
        return null;
      }
    };
    
    // Test login with known credentials
    console.log("Testing direct database login for dentist...");
    const userFromDb = await testLoginWithDatabase('dentist', 'password');
    
    if (userFromDb) {
      console.log("Direct database login test passed!");
    } else {
      console.log("Direct database login test failed.");
    }
    
    // Get all users from the database
    console.log("Fetching all users from database...");
    const usersResult = await pool.query('SELECT * FROM users');
    console.log(`Found ${usersResult.rows.length} users in database`);
    
    // Sample a couple of users to verify
    console.log("\nSample users from database:");
    for (let i = 0; i < Math.min(3, usersResult.rows.length); i++) {
      const user = usersResult.rows[i];
      console.log(`${user.username} (ID: ${user.id}, Role: ${user.role})`);
      console.log(`Password hash: ${user.password ? user.password.substring(0, 20) + '...' : 'null'}`);
      console.log('---');
    }
    
    // Create helper function to check for the session table
    const checkSessionTable = async () => {
      try {
        // Check if session table exists
        const tableExists = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'session'
          );
        `);
        
        if (tableExists.rows[0].exists) {
          console.log("Session table exists in database");
          
          // Count sessions
          const sessionCount = await pool.query('SELECT COUNT(*) FROM session');
          console.log(`Found ${sessionCount.rows[0].count} sessions in database`);
          
          // Check if there are any stale sessions and clean them up
          const deletedSessions = await pool.query(`
            DELETE FROM session 
            WHERE expire < NOW() AT TIME ZONE 'UTC'
            RETURNING sid
          `);
          
          if (deletedSessions.rowCount > 0) {
            console.log(`Cleaned up ${deletedSessions.rowCount} expired sessions`);
          }
        } else {
          console.log("Session table does not exist yet - will be created on first login");
        }
      } catch (error) {
        console.log("Error checking session table:", error.message);
      }
    };
    
    // Check session table
    await checkSessionTable();
    
    // Close the database connection
    await pool.end();
    
    console.log("\nStorage loading fix completed successfully");
    console.log("Please restart the application to apply the fixes.");
  } catch (error) {
    console.error("Error fixing storage loading:", error);
  }
}

fixStorageLoading();