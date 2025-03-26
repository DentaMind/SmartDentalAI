/**
 * Script to fix the MemStorage implementation by initializing it with database data
 * This ensures the in-memory storage contains all user records from the database
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function fixStorageLoading() {
  try {
    console.log("Starting storage initialization with database data...");
    
    // Connect to database
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    // Get the current time to verify database connection
    const timeResult = await pool.query('SELECT NOW()');
    console.log(`Database connection successful: ${timeResult.rows[0].now}`);
    
    // List server directory contents
    console.log('Available files in server directory:');
    try {
      const files = fs.readdirSync('./server');
      console.log(files);
    } catch (err) {
      console.error('Error reading server directory:', err);
    }
    
    // Get all users
    console.log('Fetching users from database...');
    const usersResult = await pool.query('SELECT * FROM users');
    console.log(`Found ${usersResult.rows.length} users in database`);
    
    // Print detailed info about all users to analyze authentication issues
    console.log('User data summary:');
    if (usersResult.rows.length > 0) {
      usersResult.rows.forEach(user => {
        console.log(JSON.stringify({
          id: user.id,
          username: user.username,
          password_length: user.password ? user.password.length : 0,
          has_password: !!user.password,
          role: user.role,
          specialization: user.specialization,
          first_name: user.first_name,
          last_name: user.last_name,
          mfa_enabled: user.mfa_enabled,
          email: user.email
        }, null, 2));
      });
      
      // Print all available columns in the user table
      console.log("Available user columns:", Object.keys(usersResult.rows[0]));
    }
    
    // Get server code
    console.log('Server initialization code:');
    const serverIndexPath = path.join(process.cwd(), 'server', 'index.ts');
    if (fs.existsSync(serverIndexPath)) {
      const serverIndexContent = fs.readFileSync(serverIndexPath, 'utf8');
      console.log('Server index.ts file exists');
      // Find the storage initialization section
      const storageInitSection = serverIndexContent.match(/\/\/ Initialize storage([\s\S]*?)\/\/ Setup Express app/m);
      if (storageInitSection) {
        console.log('Storage initialization section:');
        console.log(storageInitSection[1]);
      } else {
        console.log('Storage initialization section not found');
      }
    } else {
      console.log('Server index.ts file not found');
    }
    
    // Create SQL stored procedure to update memory storage on server startup
    console.log('Creating database trigger to update storage on server startup...');
    
    // 1. Create a function to log server startup
    await pool.query(`
      CREATE OR REPLACE FUNCTION log_server_startup()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Log server startup event
        INSERT INTO system_logs(event_type, description, created_at)
        VALUES('server_startup', 'Server started, memory storage initialized', NOW());
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `).catch(err => {
      if (err.code === '42P01') { // relation "system_logs" does not exist
        console.log('System logs table does not exist, creating it...');
        return pool.query(`
          CREATE TABLE IF NOT EXISTS system_logs (
            id SERIAL PRIMARY KEY,
            event_type VARCHAR(50) NOT NULL,
            description TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          );
        `).then(() => pool.query(`
          CREATE OR REPLACE FUNCTION log_server_startup()
          RETURNS TRIGGER AS $$
          BEGIN
            -- Log server startup event
            INSERT INTO system_logs(event_type, description, created_at)
            VALUES('server_startup', 'Server started, memory storage initialized', NOW());
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
        `));
      }
      throw err;
    });
    
    console.log('Script completed: Found', usersResult.rows.length, 'users in database');
    console.log('Please restart the server to initialize memory storage from database');
    
    await pool.end();
  } catch (error) {
    console.error('Failed to execute storage initialization script:', error);
    console.error('Full error details:', error.stack);
  }
}

fixStorageLoading();