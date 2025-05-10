#!/usr/bin/env python3
"""
Migrate Patient Data to Encrypted Format

This script synchronizes plaintext patient data to encrypted fields,
providing a one-way migration path to enhanced security.

IMPORTANT: Run this script after applying the 'add_encrypted_patient_fields' migration.

Usage:
    python migrate_patient_data_to_encrypted.py --dry-run
    python migrate_patient_data_to_encrypted.py --execute
"""

import sys
import os
import argparse
import logging
from datetime import datetime
from pathlib import Path

# Add the project root to the Python path
script_path = os.path.dirname(os.path.abspath(__file__))
root_path = os.path.join(script_path, "../..")
sys.path.append(root_path)

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Import from backend modules
from backend.api.models.patient import Patient
from backend.api.utils.encryption import EncryptionService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("migrate_data")

def get_db_url():
    """Get database URL from environment or config."""
    from backend.api.config import settings
    
    # Try to load from environment
    db_url = os.environ.get("DATABASE_URL")
    
    # If not found, use the settings module
    if not db_url:
        db_url = settings.DATABASE_URL
    
    return db_url

def setup_encryption_keys():
    """
    Ensure encryption keys are set up.
    Will generate new keys if needed and output them.
    """
    # Check if environment variables exist
    key = os.environ.get("DENTAMIND_ENCRYPTION_KEY")
    salt = os.environ.get("DENTAMIND_ENCRYPTION_SALT")
    
    # Generate and display keys if they don't exist
    if not key or not salt:
        logger.warning("No encryption keys found in environment.")
        
        key = EncryptionService.generate_key()
        salt = EncryptionService.generate_salt()
        
        print("\n=== DENTAMIND ENCRYPTION KEYS ===")
        print("WARNING: Store these securely and never commit them to version control!")
        print("\nDENTAMIND_ENCRYPTION_KEY:", key)
        print("DENTAMIND_ENCRYPTION_SALT:", salt)
        print("\nAdd these to your environment variables or .env file and restart the script.")
        
        # Set environment variables for this session
        os.environ["DENTAMIND_ENCRYPTION_KEY"] = key
        os.environ["DENTAMIND_ENCRYPTION_SALT"] = salt

def migrate_patient_data(dry_run=True):
    """
    Migrate patient data from plaintext to encrypted fields.
    
    Args:
        dry_run: If True, don't commit changes
    """
    # Initialize SQLAlchemy engine and session
    db_url = get_db_url()
    engine = create_engine(db_url)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # Count total patients
        patient_count = session.query(Patient).count()
        logger.info(f"Found {patient_count} patients to process")
        
        # Process in batches to avoid memory issues
        batch_size = 100
        processed = 0
        
        for i in range(0, patient_count, batch_size):
            batch = session.query(Patient).offset(i).limit(batch_size).all()
            
            for patient in batch:
                # Sync plaintext fields to encrypted fields
                patient.sync_encrypted_fields()
                
                # Handle fields that might not have plaintext equivalents
                if hasattr(patient, 'address'):
                    patient.address_encrypted = patient.address
                
                if hasattr(patient, 'insurance_id'):
                    patient.insurance_id_encrypted = patient.insurance_id
                
                if hasattr(patient, 'emergency_contact_name'):
                    patient.emergency_contact_name_encrypted = patient.emergency_contact_name
                
                if hasattr(patient, 'emergency_contact_phone'):
                    patient.emergency_contact_phone_encrypted = patient.emergency_contact_phone
                
                # Log the first few for verification
                if processed < 5:
                    logger.info(f"Patient {patient.id}: Encrypted name: {patient.first_name} -> {patient.first_name_encrypted}")
            
            processed += len(batch)
            logger.info(f"Processed {processed}/{patient_count} patients")
            
            # Commit changes for this batch
            if not dry_run:
                session.commit()
                logger.info(f"Committed batch {i//batch_size + 1}")
            else:
                logger.info(f"Dry run - not committing changes for batch {i//batch_size + 1}")
                session.rollback()
        
        if dry_run:
            logger.info("Dry run complete. No changes were committed.")
            logger.info("Run with --execute to commit changes.")
        else:
            logger.info("Migration complete. All patient data has been encrypted.")
    
    except Exception as e:
        logger.error(f"Error migrating data: {str(e)}")
        session.rollback()
        raise
    
    finally:
        session.close()

def main():
    """Main function to run the data migration script."""
    parser = argparse.ArgumentParser(description="Migrate patient data to encrypted format")
    parser.add_argument("--dry-run", action="store_true", help="Run without committing changes")
    parser.add_argument("--execute", action="store_true", help="Execute migration and commit changes")
    args = parser.parse_args()
    
    # Ensure we have encryption keys
    setup_encryption_keys()
    
    # Validate arguments
    if not args.dry_run and not args.execute:
        parser.error("Must specify either --dry-run or --execute")
    
    if args.dry_run and args.execute:
        parser.error("Cannot specify both --dry-run and --execute")
    
    # Determine dry run mode
    dry_run = args.dry_run or not args.execute
    
    # Run migration
    logger.info("Starting patient data migration to encrypted format")
    logger.info(f"Mode: {'Dry run' if dry_run else 'Execute'}")
    
    migrate_patient_data(dry_run=dry_run)

if __name__ == "__main__":
    main() 