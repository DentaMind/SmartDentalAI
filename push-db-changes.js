import postgres from 'postgres';

async function main() {
  console.log('Connecting to database...');
  
  // Get the DATABASE_URL from environment variables
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  // Connect to the database
  const sql = postgres(connectionString);
  
  try {
    console.log('Connected to database. Pushing changes...');
    
    // Don't need to directly load schema for SQL-based migration
    console.log('Starting SQL-based migration...');
    
    // Create tables that don't exist
    console.log('Creating new tables...');
    
    // Lab cases table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS lab_cases (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER NOT NULL,
        doctor_id INTEGER NOT NULL,
        case_number TEXT NOT NULL,
        lab_id INTEGER NOT NULL,
        status TEXT NOT NULL,
        submission_date TIMESTAMP DEFAULT NOW(),
        due_date TIMESTAMP NOT NULL,
        received_date TIMESTAMP,
        completed_date TIMESTAMP,
        rush_order BOOLEAN DEFAULT FALSE,
        case_type TEXT NOT NULL,
        shade TEXT,
        material TEXT,
        impression_type TEXT,
        teeth_involved JSONB,
        special_instructions TEXT,
        attachments JSONB,
        cost INTEGER,
        tracking_number TEXT,
        shipping_provider TEXT,
        quality_rating INTEGER,
        remake_required BOOLEAN DEFAULT FALSE,
        remake_reason TEXT,
        notes TEXT,
        ai_estimated_completion_time TEXT,
        treatment_plan_id INTEGER
      );
    `);
    console.log('Created lab_cases table');
    
    // Supply items table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS supply_items (
        id SERIAL PRIMARY KEY,
        item_name TEXT NOT NULL,
        sku TEXT,
        description TEXT,
        category TEXT NOT NULL,
        current_stock INTEGER NOT NULL DEFAULT 0,
        minimum_stock_level INTEGER NOT NULL DEFAULT 1,
        reorder_point INTEGER NOT NULL DEFAULT 5,
        unit_of_measure TEXT NOT NULL,
        unit_price INTEGER,
        preferred_vendor_id INTEGER,
        alternative_vendor_ids JSONB,
        location_in_office TEXT,
        expiration_date DATE,
        batch_number TEXT,
        lot_number TEXT,
        last_order_date TIMESTAMP,
        tags JSONB,
        image_url TEXT,
        item_weight INTEGER,
        item_dimensions TEXT,
        auto_reorder BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        notes TEXT,
        usage_frequency TEXT,
        usage_history JSONB,
        ai_reorder_recommendation BOOLEAN DEFAULT FALSE
      );
    `);
    console.log('Created supply_items table');
    
    // Supply orders table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS supply_orders (
        id SERIAL PRIMARY KEY,
        order_number TEXT NOT NULL,
        vendor_id INTEGER NOT NULL,
        ordered_by INTEGER NOT NULL,
        order_date TIMESTAMP DEFAULT NOW(),
        status TEXT NOT NULL,
        items JSONB NOT NULL,
        total_amount INTEGER NOT NULL,
        discount_amount INTEGER DEFAULT 0,
        tax_amount INTEGER DEFAULT 0,
        shipping_amount INTEGER DEFAULT 0,
        final_amount INTEGER NOT NULL,
        payment_method TEXT,
        payment_terms TEXT,
        payment_status TEXT DEFAULT 'unpaid',
        shipping_method TEXT,
        tracking_number TEXT,
        estimated_delivery_date DATE,
        actual_delivery_date DATE,
        shipping_address TEXT NOT NULL,
        billing_address TEXT NOT NULL,
        notes TEXT,
        attachments JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        is_bulk_order BOOLEAN DEFAULT FALSE,
        is_recurring_order BOOLEAN DEFAULT FALSE,
        recurring_schedule TEXT,
        is_ai_generated BOOLEAN DEFAULT FALSE
      );
    `);
    console.log('Created supply_orders table');
    
    // Supply receipts table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS supply_receipts (
        id SERIAL PRIMARY KEY,
        uploaded_by INTEGER NOT NULL,
        upload_date TIMESTAMP DEFAULT NOW(),
        receipt_image TEXT NOT NULL,
        ocr_processed BOOLEAN DEFAULT FALSE,
        extracted_text TEXT,
        extracted_data JSONB,
        total_amount INTEGER,
        receipt_date DATE,
        vendor_name TEXT,
        vendor_id INTEGER,
        categories JSONB,
        items JSONB,
        verified BOOLEAN DEFAULT FALSE,
        linked_to_order BOOLEAN DEFAULT FALSE,
        supply_order_id INTEGER,
        notes TEXT,
        tags JSONB
      );
    `);
    console.log('Created supply_receipts table');
    
    // Vendor profiles table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS vendor_profiles (
        id SERIAL PRIMARY KEY,
        vendor_name TEXT NOT NULL,
        vendor_type TEXT NOT NULL,
        contact_person TEXT,
        email TEXT,
        phone TEXT,
        website TEXT,
        address TEXT,
        account_number TEXT,
        tax_id TEXT,
        payment_terms TEXT,
        discount_terms TEXT,
        shipping_terms TEXT,
        return_policy TEXT,
        preferred_vendor BOOLEAN DEFAULT FALSE,
        rating INTEGER,
        categories JSONB,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        logos TEXT,
        active BOOLEAN DEFAULT TRUE,
        api_integration_enabled BOOLEAN DEFAULT FALSE,
        api_credentials JSONB,
        api_endpoints JSONB
      );
    `);
    console.log('Created vendor_profiles table');
    
    // Orthodontic cases table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS orthodontic_cases (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER NOT NULL,
        doctor_id INTEGER NOT NULL,
        case_number TEXT NOT NULL,
        status TEXT NOT NULL,
        start_date TIMESTAMP DEFAULT NOW(),
        estimated_completion_date DATE,
        actual_completion_date DATE,
        treatment_type TEXT NOT NULL,
        treatment_plan JSONB,
        current_aligner INTEGER,
        total_aligners INTEGER,
        aligner_change_frequency INTEGER,
        last_alignment_change TIMESTAMP,
        next_alignment_change TIMESTAMP,
        initial_scans JSONB,
        progression_scans JSONB,
        reminder_settings JSONB,
        patient_compliance TEXT,
        compliance_data JSONB,
        notes TEXT,
        attachments JSONB,
        ai_progress_analysis JSONB,
        next_checkup_required BOOLEAN DEFAULT FALSE,
        is_in_person BOOLEAN DEFAULT TRUE,
        is_telehealth BOOLEAN DEFAULT FALSE,
        treatment_plan_id INTEGER,
        lab_case_id INTEGER
      );
    `);
    console.log('Created orthodontic_cases table');
    
    // Orthodontic telehealth sessions table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS orthodontic_telehealth_sessions (
        id SERIAL PRIMARY KEY,
        orthodontic_case_id INTEGER NOT NULL,
        patient_id INTEGER NOT NULL,
        doctor_id INTEGER NOT NULL,
        session_date TIMESTAMP NOT NULL,
        status TEXT NOT NULL DEFAULT 'scheduled',
        session_type TEXT NOT NULL,
        patient_submitted_images JSONB,
        patient_reported_issues TEXT,
        doctor_notes TEXT,
        ai_analysis_results JSONB,
        aligner_fit TEXT,
        treatment_progress TEXT,
        adjustments_required BOOLEAN DEFAULT FALSE,
        adjustment_details TEXT,
        in_person_visit_required BOOLEAN DEFAULT FALSE,
        next_session_date TIMESTAMP,
        video_chat_url TEXT,
        video_chat_recording TEXT,
        session_duration INTEGER,
        follow_up_actions JSONB,
        reminder_sent BOOLEAN DEFAULT FALSE,
        feedback JSONB
      );
    `);
    console.log('Created orthodontic_telehealth_sessions table');
    
    console.log('Database migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    // Close the connection
    await client.end();
    console.log('Database connection closed');
  }
}

main();