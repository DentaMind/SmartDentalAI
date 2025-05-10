#!/usr/bin/env python3
"""
Test Patient Encryption Cycle

This script validates the entire encryption/decryption cycle for patient records
to ensure field-level encryption is working correctly before using it in production.

It creates test patient records with sensitive data, saves them to the database,
retrieves them, and verifies that encryption/decryption works as expected.

Usage:
    python test_patient_encryption.py [--clean]
"""

import os
import sys
import uuid
import json
import argparse
import logging
from datetime import datetime
from pprint import pprint
from typing import Dict, Any, Optional, List

# Add the project root to Python path
script_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.join(script_dir, "../..")
sys.path.append(root_dir)

# Set temporary encryption keys for testing - remove hardcoded values
# os.environ["DENTAMIND_ENCRYPTION_KEY"] = "LBkqEPuv9tSl_g9puvHxBx8cJ7hGlhS4w1KrG0RJDHY="
# os.environ["DENTAMIND_ENCRYPTION_SALT"] = "vvfjosbh_CiLXTgTzJARbg=="

# Import SQLAlchemy models
from sqlalchemy import create_engine, inspect, text, select
from sqlalchemy.orm import sessionmaker, Session

# Import project modules - use relative imports
from api.models.base import Base
from api.models.patient import Patient, Gender, InsuranceType
from api.utils.encryption import EncryptionService
from api.config import settings, set_encryption_keys_for_testing

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("test_encryption")

# Color codes for terminal output
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    WARNING = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def get_db_session() -> Session:
    """Create a database session."""
    # Use the correct dialect for PostgreSQL
    db_url = "postgresql+psycopg2://postgres:postgres@localhost:5432/smartdental"
    engine = create_engine(db_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal()

def setup_encryption():
    """Set predefined encryption keys for testing."""
    # Use predefined valid keys for testing
    key = "cThCYkxHNklIOXgzOVBkNnBLN1JyVGRFMVFKaGtsRWVTQU5LTnZET1lJOD0="
    salt = "a8F8hscjdJSmZ/4mbuACpg=="
    
    # Set encryption keys
    set_encryption_keys_for_testing(key, salt)
    
    print(f"{Colors.CYAN}Set predefined encryption keys for testing{Colors.ENDC}")
    print(f"Key: {key[:10]}...")
    print(f"Salt: {salt[:10]}...")

def create_test_patient() -> Patient:
    """Create a test patient with sample data for all encrypted fields."""
    patient_id = str(uuid.uuid4())
    
    patient = Patient(
        id=patient_id,
        first_name="TestFirst",
        last_name="TestLast",
        date_of_birth=datetime(1980, 1, 15),
        gender=Gender.MALE,
        email="test.patient@example.com",
        phone="555-123-4567",
        address="123 Main St, Apt 4B", 
        city="Anytown",
        state="CA",
        zip_code="90210",
        insurance_provider="Blue Cross",
        insurance_id="BC123456789",
        insurance_group="GROUP-123",
        insurance_type=InsuranceType.PRIVATE,
        account_number=f"ACC-{patient_id[:8]}",
        ssn="123-45-6789",
        emergency_contact_name="Emergency Contact",
        emergency_contact_phone="555-987-6543",
        clinical_notes="Patient has a history of dental anxiety. Recommend additional time for procedures."
    )
    
    # Make sure encrypted versions are populated
    patient.address = patient.address  # Triggers setter
    patient.ssn = patient.ssn  # Triggers setter
    patient.insurance_id = patient.insurance_id  # Triggers setter
    patient.emergency_contact_name = patient.emergency_contact_name  # Triggers setter
    patient.emergency_contact_phone = patient.emergency_contact_phone  # Triggers setter
    patient.clinical_notes = patient.clinical_notes  # Triggers setter
    
    # Explicitly sync all encrypted fields to ensure they're populated
    patient.sync_encrypted_fields()
    
    return patient

def print_section_header(title: str):
    """Print a formatted section header."""
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'=' * 60}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD} {title} {Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'=' * 60}{Colors.ENDC}\n")

def print_value_comparison(label: str, plaintext: Any, encrypted: Any, decrypted: Any, success: bool = True):
    """Print a comparison of plaintext, encrypted, and decrypted values."""
    status = f"{Colors.GREEN}✓ MATCH{Colors.ENDC}" if success else f"{Colors.RED}✗ MISMATCH{Colors.ENDC}"
    
    print(f"{Colors.BOLD}{label}:{Colors.ENDC}")
    print(f"  Original:  {plaintext}")
    print(f"  Encrypted: {encrypted}")
    print(f"  Decrypted: {decrypted}")
    print(f"  Status:    {status}")
    print()

def get_raw_patient_data(session: Session, patient_id: str) -> Dict[str, Any]:
    """Get raw patient data directly from database, bypassing SQLAlchemy models."""
    result = session.execute(text(f"SELECT * FROM patients WHERE id = '{patient_id}'"))
    columns = result.keys()
    row = result.fetchone()
    
    if not row:
        return {}
    
    return {col: value for col, value in zip(columns, row)}

def check_encryption_service():
    """Verify the encryption service is properly initialized."""
    print_section_header("Testing Encryption Service")
    
    # Create encryption service
    try:
        encryption_service = EncryptionService()
        print(f"{Colors.GREEN}✓ Encryption service initialized successfully{Colors.ENDC}")
        
        # Test simple encryption/decryption
        test_value = "This is a test string"
        encrypted = encryption_service.encrypt(test_value)
        decrypted = encryption_service.decrypt(encrypted)
        
        success = test_value == decrypted
        status = f"{Colors.GREEN}✓ PASSED{Colors.ENDC}" if success else f"{Colors.RED}✗ FAILED{Colors.ENDC}"
        
        print(f"Basic encryption test: {status}")
        print(f"  Original:  {test_value}")
        print(f"  Encrypted: {encrypted}")
        print(f"  Decrypted: {decrypted}")
        
        # Test different data types
        data_types = [
            ("string", "test string"),
            ("integer", 12345),
            ("float", 123.45),
            ("boolean", True),
            ("dictionary", {"key": "value"}),
            ("none", None),
        ]
        
        print("\nTesting encryption with different data types:")
        
        for type_name, value in data_types:
            encrypted = encryption_service.encrypt(value)
            decrypted = encryption_service.decrypt(encrypted)
            success = value == decrypted
            status = f"{Colors.GREEN}✓{Colors.ENDC}" if success else f"{Colors.RED}✗{Colors.ENDC}"
            print(f"  {type_name}: {status} ({'same type' if type(value) == type(decrypted) else 'type changed'})")
        
    except Exception as e:
        print(f"{Colors.RED}✗ Encryption service initialization failed: {str(e)}{Colors.ENDC}")
        sys.exit(1)

def run_patient_encryption_test(session: Session, clean: bool = False):
    """Run the complete patient encryption test cycle."""
    # Step 1: Create and save a test patient
    print_section_header("Creating Test Patient")
    patient = create_test_patient()
    
    print(f"Created test patient with ID: {patient.id}")
    print(f"Name: {patient.first_name} {patient.last_name}")
    print(f"Email: {patient.email}")
    
    # Collect sensitive fields for validation
    test_fields = {
        "Address": patient.address,
        "SSN": patient.ssn,
        "Insurance ID": patient.insurance_id,
        "Emergency Contact": patient.emergency_contact_name,
        "Emergency Phone": patient.emergency_contact_phone,
        "Clinical Notes": patient.clinical_notes
    }
    
    # Step 2: Save to database
    print_section_header("Saving Patient to Database")
    
    try:
        session.add(patient)
        session.commit()
        print(f"{Colors.GREEN}✓ Patient saved successfully{Colors.ENDC}")
    except Exception as e:
        print(f"{Colors.RED}✗ Failed to save patient: {str(e)}{Colors.ENDC}")
        session.rollback()
        sys.exit(1)
    
    # Step 3: Get raw database values
    print_section_header("Raw Database Values")
    
    raw_data = get_raw_patient_data(session, patient.id)
    encrypted_fields = [
        "first_name_encrypted", "last_name_encrypted", "date_of_birth_encrypted",
        "ssn_encrypted", "address_encrypted", "insurance_id_encrypted",
        "emergency_contact_name_encrypted", "emergency_contact_phone_encrypted",
        "clinical_notes_encrypted"
    ]
    
    print("Raw encrypted field values from database:")
    for field in encrypted_fields:
        if field in raw_data:
            print(f"  {field}: {raw_data[field]}")
    
    # Step 4: Clear session and retrieve the patient again
    print_section_header("Retrieving Patient")
    
    # Clear SQLAlchemy session cache
    session.expunge_all()
    
    # Retrieve the patient by ID
    retrieved_patient = session.query(Patient).filter(Patient.id == patient.id).first()
    
    if retrieved_patient:
        print(f"{Colors.GREEN}✓ Patient retrieved successfully{Colors.ENDC}")
        print(f"Retrieved patient: {retrieved_patient.first_name} {retrieved_patient.last_name}")
    else:
        print(f"{Colors.RED}✗ Failed to retrieve patient{Colors.ENDC}")
        sys.exit(1)
    
    # Step 5: Verify encryption/decryption
    print_section_header("Validating Encryption/Decryption")
    
    # Compare original values with encrypted and decrypted values
    print_value_comparison(
        "Address", 
        test_fields["Address"], 
        raw_data.get("address_encrypted"), 
        retrieved_patient.address,
        test_fields["Address"] == retrieved_patient.address
    )
    
    print_value_comparison(
        "SSN", 
        test_fields["SSN"], 
        raw_data.get("ssn_encrypted"), 
        retrieved_patient.ssn,
        test_fields["SSN"] == retrieved_patient.ssn
    )
    
    print_value_comparison(
        "Insurance ID", 
        test_fields["Insurance ID"], 
        raw_data.get("insurance_id_encrypted"), 
        retrieved_patient.insurance_id,
        test_fields["Insurance ID"] == retrieved_patient.insurance_id
    )
    
    print_value_comparison(
        "Emergency Contact", 
        test_fields["Emergency Contact"], 
        raw_data.get("emergency_contact_name_encrypted"), 
        retrieved_patient.emergency_contact_name,
        test_fields["Emergency Contact"] == retrieved_patient.emergency_contact_name
    )
    
    print_value_comparison(
        "Emergency Phone", 
        test_fields["Emergency Phone"], 
        raw_data.get("emergency_contact_phone_encrypted"), 
        retrieved_patient.emergency_contact_phone,
        test_fields["Emergency Phone"] == retrieved_patient.emergency_contact_phone
    )
    
    print_value_comparison(
        "Clinical Notes", 
        test_fields["Clinical Notes"], 
        raw_data.get("clinical_notes_encrypted"), 
        retrieved_patient.clinical_notes,
        test_fields["Clinical Notes"] == retrieved_patient.clinical_notes
    )
    
    # Step 6: Clean up if requested
    if clean:
        print_section_header("Cleaning Up")
        
        try:
            session.delete(retrieved_patient)
            session.commit()
            print(f"{Colors.GREEN}✓ Test patient removed from database{Colors.ENDC}")
        except Exception as e:
            print(f"{Colors.RED}✗ Failed to remove test patient: {str(e)}{Colors.ENDC}")
            session.rollback()
    
    # Step 7: Summary
    print_section_header("Test Summary")
    
    all_matched = all([
        test_fields["Address"] == retrieved_patient.address,
        test_fields["SSN"] == retrieved_patient.ssn,
        test_fields["Insurance ID"] == retrieved_patient.insurance_id,
        test_fields["Emergency Contact"] == retrieved_patient.emergency_contact_name,
        test_fields["Emergency Phone"] == retrieved_patient.emergency_contact_phone,
        test_fields["Clinical Notes"] == retrieved_patient.clinical_notes
    ])
    
    if all_matched:
        print(f"{Colors.GREEN}{Colors.BOLD}✓ ALL TESTS PASSED: Patient encryption/decryption cycle works correctly!{Colors.ENDC}")
    else:
        print(f"{Colors.RED}{Colors.BOLD}✗ TESTS FAILED: Some patient fields did not match after encryption/decryption.{Colors.ENDC}")
    
    # Check for database values
    all_encrypted = all([
        raw_data.get("ssn_encrypted") is not None,
        raw_data.get("address_encrypted") is not None,
        raw_data.get("insurance_id_encrypted") is not None,
        raw_data.get("emergency_contact_name_encrypted") is not None,
        raw_data.get("emergency_contact_phone_encrypted") is not None,
        raw_data.get("clinical_notes_encrypted") is not None
    ])
    
    if all_encrypted:
        print(f"{Colors.GREEN}{Colors.BOLD}✓ ENCRYPTION CONFIRMED: All sensitive fields were stored encrypted in the database.{Colors.ENDC}")
    else:
        print(f"{Colors.RED}{Colors.BOLD}✗ ENCRYPTION ISSUE: Some fields may not have been properly encrypted in the database.{Colors.ENDC}")

def main():
    """Main function."""
    parser = argparse.ArgumentParser(description="Test patient encryption/decryption cycle")
    parser.add_argument("--clean", action="store_true", help="Remove test patient after test")
    args = parser.parse_args()
    
    # Make sure encryption keys are set up
    setup_encryption()
    
    # Verify encryption service
    check_encryption_service()
    
    # Get database session
    session = get_db_session()
    
    try:
        # Run patient encryption test
        run_patient_encryption_test(session, args.clean)
    finally:
        session.close()

if __name__ == "__main__":
    main() 