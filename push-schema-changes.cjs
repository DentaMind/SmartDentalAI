const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');

const connectionString = process.env.DATABASE_URL;

async function main() {
  try {
    // Create a client
    const sql = postgres(connectionString);
    const db = drizzle(sql);
    
    console.log('Creating diagnoses table...');
    
    // Create diagnoses table
    await sql`
      CREATE TABLE IF NOT EXISTS diagnoses (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER NOT NULL,
        condition TEXT NOT NULL,
        confidence REAL NOT NULL DEFAULT 0,
        explanation TEXT NOT NULL,
        suggested_treatments JSONB,
        ai_source TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        provider_note TEXT,
        accuracy_rating INTEGER,
        modified_diagnosis TEXT,
        modified_explanation TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approved_at TIMESTAMP,
        approved_by INTEGER,
        updated_at TIMESTAMP
      )
    `;
    
    console.log('Updating treatment_plans table...');
    
    // Update treatment_plans table
    await sql`
      ALTER TABLE treatment_plans 
      ADD COLUMN IF NOT EXISTS ai_draft TEXT,
      ADD COLUMN IF NOT EXISTS title TEXT,
      ADD COLUMN IF NOT EXISTS reasoning TEXT,
      ADD COLUMN IF NOT EXISTS confidence REAL,
      ADD COLUMN IF NOT EXISTS total_cost INTEGER,
      ADD COLUMN IF NOT EXISTS approved_plan TEXT,
      ADD COLUMN IF NOT EXISTS approved_by INTEGER,
      ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS created_by INTEGER,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP
    `;
    
    console.log('Schema changes applied successfully!');
    
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('Error applying schema changes:', error);
    process.exit(1);
  }
}

main();