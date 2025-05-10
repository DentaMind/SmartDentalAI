-- SQL script to add encrypted fields to the patients table
-- This should be run after the patients table has been created
-- Usage: psql -U postgres -d smartdental -f add_encrypted_fields.sql

-- First, create the patients table if it doesn't exist
CREATE TABLE IF NOT EXISTS patients (
    id VARCHAR PRIMARY KEY,
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    date_of_birth TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    gender VARCHAR,
    email VARCHAR,
    phone VARCHAR,
    address VARCHAR,
    city VARCHAR,
    state VARCHAR,
    zip_code VARCHAR,
    insurance_provider VARCHAR,
    insurance_id VARCHAR,
    insurance_group VARCHAR,
    insurance_type VARCHAR,
    account_number VARCHAR UNIQUE,
    registration_date TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT TRUE,
    preferred_language VARCHAR DEFAULT 'English',
    preferred_contact_method VARCHAR DEFAULT 'email',
    emergency_contact_name VARCHAR,
    emergency_contact_phone VARCHAR,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    last_visit TIMESTAMP WITHOUT TIME ZONE
);

-- Create indexes that might not exist
CREATE INDEX IF NOT EXISTS ix_patients_id ON patients (id);
CREATE UNIQUE INDEX IF NOT EXISTS ix_patients_email ON patients (email);

-- Add encrypted fields if they don't exist
DO $$
BEGIN
    -- First name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patients' AND column_name = 'first_name_encrypted') THEN
        ALTER TABLE patients ADD COLUMN first_name_encrypted VARCHAR;
    END IF;
    
    -- Last name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patients' AND column_name = 'last_name_encrypted') THEN
        ALTER TABLE patients ADD COLUMN last_name_encrypted VARCHAR;
    END IF;
    
    -- Date of birth
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patients' AND column_name = 'date_of_birth_encrypted') THEN
        ALTER TABLE patients ADD COLUMN date_of_birth_encrypted VARCHAR;
    END IF;
    
    -- SSN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patients' AND column_name = 'ssn_encrypted') THEN
        ALTER TABLE patients ADD COLUMN ssn_encrypted VARCHAR;
    END IF;
    
    -- Address
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patients' AND column_name = 'address_encrypted') THEN
        ALTER TABLE patients ADD COLUMN address_encrypted VARCHAR;
    END IF;
    
    -- Insurance ID
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patients' AND column_name = 'insurance_id_encrypted') THEN
        ALTER TABLE patients ADD COLUMN insurance_id_encrypted VARCHAR;
    END IF;
    
    -- Emergency contact name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patients' AND column_name = 'emergency_contact_name_encrypted') THEN
        ALTER TABLE patients ADD COLUMN emergency_contact_name_encrypted VARCHAR;
    END IF;
    
    -- Emergency contact phone
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patients' AND column_name = 'emergency_contact_phone_encrypted') THEN
        ALTER TABLE patients ADD COLUMN emergency_contact_phone_encrypted VARCHAR;
    END IF;
    
    -- Clinical notes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patients' AND column_name = 'clinical_notes_encrypted') THEN
        ALTER TABLE patients ADD COLUMN clinical_notes_encrypted TEXT;
    END IF;
    
    -- Create index for SSN if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'patients' AND indexname = 'ix_patients_ssn_encrypted') THEN
        CREATE INDEX ix_patients_ssn_encrypted ON patients (ssn_encrypted);
    END IF;
    
END$$; 