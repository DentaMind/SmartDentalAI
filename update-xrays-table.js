// Script to update the xrays table to match our schema
import postgres from 'postgres';

async function main() {
  console.log('Connecting to database to update xrays table...');
  
  // Get the DATABASE_URL from environment variables
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  // Connect to the database
  const sql = postgres(connectionString);
  
  try {
    console.log('Connected to database. Adding missing columns to xrays table...');
    
    // Add the missing columns to the xrays table
    // We'll use ALTER TABLE commands to add each column if it doesn't exist
    
    // Add ai_analysis column
    try {
      await sql.unsafe(`
        ALTER TABLE xrays 
        ADD COLUMN IF NOT EXISTS ai_analysis JSONB;
      `);
      console.log('Added ai_analysis column to xrays table');
    } catch (e) {
      console.error('Error adding ai_analysis column:', e);
    }
    
    // Add analysis_date column
    try {
      await sql.unsafe(`
        ALTER TABLE xrays 
        ADD COLUMN IF NOT EXISTS analysis_date TIMESTAMP;
      `);
      console.log('Added analysis_date column to xrays table');
    } catch (e) {
      console.error('Error adding analysis_date column:', e);
    }
    
    // Add pathology_detected column
    try {
      await sql.unsafe(`
        ALTER TABLE xrays 
        ADD COLUMN IF NOT EXISTS pathology_detected BOOLEAN DEFAULT FALSE;
      `);
      console.log('Added pathology_detected column to xrays table');
    } catch (e) {
      console.error('Error adding pathology_detected column:', e);
    }
    
    // Add comparison_result column
    try {
      await sql.unsafe(`
        ALTER TABLE xrays 
        ADD COLUMN IF NOT EXISTS comparison_result JSONB;
      `);
      console.log('Added comparison_result column to xrays table');
    } catch (e) {
      console.error('Error adding comparison_result column:', e);
    }
    
    console.log('Xrays table update completed successfully!');
  } catch (error) {
    console.error('Error during xrays table update:', error);
  } finally {
    // Close the connection
    await sql.end();
    console.log('Database connection closed');
  }
}

main();