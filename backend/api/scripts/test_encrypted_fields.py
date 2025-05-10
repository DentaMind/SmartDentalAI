#!/usr/bin/env python3
"""
Test Encrypted Fields

This script tests the functionality of the EncryptedField class to ensure proper
field-level encryption for sensitive patient data without accessing the database.

Usage:
    python test_encrypted_fields.py
"""

import os
import sys
import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

# Add the project root to Python path
script_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.join(script_dir, "../..")
sys.path.append(root_dir)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("encrypted_fields_test")

# ANSI color codes for terminal output
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

def setup_encryption():
    """Set predefined encryption keys for testing."""
    # Import directly within the function to avoid circular imports
    from api.config import set_encryption_keys_for_testing
    
    # Use fixed, valid keys for testing (don't use these in production!)
    key = "cThCYkxHNklIOXgzOVBkNnBLN1JyVGRFMVFKaGtsRWVTQU5LTnZET1lJOD0="
    salt = "a8F8hscjdJSmZ/4mbuACpg=="
    
    # Set encryption keys
    set_encryption_keys_for_testing(key, salt)
    
    print(f"{Colors.CYAN}Set predefined encryption keys for testing{Colors.ENDC}")

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

def test_encryption_service_directly():
    """Test the EncryptionService class directly."""
    # Import the encryption service
    from api.utils.encryption import EncryptionService
    
    print_section_header("Testing EncryptionService Directly")
    
    try:
        # Initialize the encryption service
        encryption_service = EncryptionService()
        print(f"{Colors.GREEN}✓ Encryption service initialized successfully{Colors.ENDC}")
        
        # Define test values
        test_values = [
            ("String", "This is sensitive data"),
            ("Integer", 12345),
            ("Float", 123.45),
            ("Dictionary", {"key": "value", "nested": {"foo": "bar"}}),
            ("List", [1, 2, 3, "four"]),
            ("Boolean", True),
            ("None", None)
        ]
        
        all_passed = True
        
        for label, value in test_values:
            print(f"\n{Colors.BOLD}Testing encryption/decryption with {label}:{Colors.ENDC}")
            
            try:
                # Encrypt the value
                encrypted = encryption_service.encrypt(value)
                
                # Decrypt the value
                decrypted = encryption_service.decrypt(encrypted)
                
                # Check if the original value matches the decrypted value
                if isinstance(value, dict) and isinstance(decrypted, dict):
                    original_json = json.dumps(value, sort_keys=True)
                    decrypted_json = json.dumps(decrypted, sort_keys=True)
                    is_match = original_json == decrypted_json
                elif isinstance(value, list) and isinstance(decrypted, list):
                    is_match = len(value) == len(decrypted) and all(a == b for a, b in zip(value, decrypted))
                else:
                    is_match = value == decrypted
                    
                # Print comparison
                print_value_comparison(
                    label, 
                    value, 
                    encrypted, 
                    decrypted,
                    is_match
                )
                
                if not is_match:
                    all_passed = False
                    
            except Exception as e:
                print(f"  {Colors.RED}✗ ERROR: {str(e)}{Colors.ENDC}")
                all_passed = False
        
        return all_passed
        
    except Exception as e:
        print(f"{Colors.RED}✗ ERROR: {str(e)}{Colors.ENDC}")
        return False

def test_encrypted_field():
    """Test EncryptedField using SQLAlchemy models."""
    from sqlalchemy import Column, String, Integer, create_engine, Boolean, Float
    from sqlalchemy.ext.declarative import declarative_base
    from sqlalchemy.orm import sessionmaker
    from api.models.encrypted_fields import EncryptedField
    
    print_section_header("Testing EncryptedField with SQLAlchemy Models")
    
    # Define a simple model for testing
    Base = declarative_base()
    
    class TestModel(Base):
        __tablename__ = 'test_encrypted_fields'
        
        id = Column(Integer, primary_key=True)
        string_value = Column(String)
        string_encrypted = Column(EncryptedField(String))
        int_value = Column(Integer)
        int_encrypted = Column(EncryptedField(Integer))
        float_encrypted = Column(EncryptedField(Float))
        bool_encrypted = Column(EncryptedField(Boolean))
        
        def __repr__(self):
            return f"<TestModel(id={self.id})>"
    
    # Create in-memory database for testing
    engine = create_engine('sqlite:///:memory:')
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # Test values
        test_data = [
            ("String", "This is sensitive data"),
            ("Integer", 12345),
            ("Float", 123.45),
            ("Boolean", True)
        ]
        
        # Create an instance with test values
        test_obj = TestModel(
            string_value="Unencrypted string",
            string_encrypted="This is sensitive data",
            int_value=100,
            int_encrypted=12345,
            float_encrypted=123.45,
            bool_encrypted=True
        )
        
        # Create an instance with test values
        test_obj = TestModel(
            string_value="Unencrypted string",
            string_encrypted="This is sensitive data",
            int_value=100,
            int_encrypted=12345,
            float_encrypted=123.45,
            bool_encrypted=True
        )
        
        # Create an instance with test values
        test_obj = TestModel(
            string_value="Unencrypted string",
            string_encrypted="This is sensitive data",
            int_value=100,
            int_encrypted=12345,
            float_encrypted=123.45,
            bool_encrypted=True
        )
        
        # Create an instance with test values
        test_obj = TestModel(
            string_value="Unencrypted string",
            string_encrypted="This is sensitive data",
            int_value=100,
            int_encrypted=12345,
            float_encrypted=123.45,
            bool_encrypted=True
        )
        
        # Create an instance with test values
        test_obj = TestModel(
            string_value="Unencrypted string",
            string_encrypted="This is sensitive data",
            int_value=100,
            int_encrypted=12345,
            float_encrypted=123.45,
            bool_encrypted=True
        )
        
        # Create an instance with test values
        test_obj = TestModel(
            string_value="Unencrypted string",
            string_encrypted="This is sensitive data",
            int_value=100,
            int_encrypted=12345,
            float_encrypted=123.45,
            bool_encrypted=True
        )
        
        # Create an instance with test values
        test_obj = TestModel(
            string_value="Unencrypted string",
            string_encrypted="This is sensitive data",
            int_value=100,
            int_encrypted=12345,
            float_encrypted=123.45,
            bool_encrypted=True
        )
        
        # Create an instance with test values
        test_obj = TestModel(
            string_value="Unencrypted string",
            string_encrypted="This is sensitive data",
            int_value=100,
            int_encrypted=12345,
            float_encrypted=123.45,
            bool_encrypted=True
        )
        
        # Create an instance with test values
        test_obj = TestModel(
            string_value="Unencrypted string",
            string_encrypted="This is sensitive data",
            int_value=100,
            int_encrypted=12345,
            float_encrypted=123.45,
            bool_encrypted=True
        )
        
        # Create an instance with test values
        test_obj = TestModel(
            string_value="Unencrypted string",
            string_encrypted="This is sensitive data",
            int_value=100,
            int_encrypted=12345,
            float_encrypted=123.45,
            bool_encrypted=True
        )
        
        # Create an instance with test values
        test_obj = TestModel(
            string_value="Unencrypted string",
            string_encrypted="This is sensitive data",
            int_value=100,
            int_encrypted=12345,
            float_encrypted=123.45,
            bool_encrypted=True
        )
        
        # Create an instance with test values
        test_obj = TestModel(
            string_value="Unencrypted string",
            string_encrypted="This is sensitive data",
            int_value=100,
            int_encrypted=12345,
            float_encrypted=123.45,
            bool_encrypted=True
        )
        
        # Create an instance with test values
        test_obj = TestModel(
            string_value="Unencrypted string",
            string_encrypted="This is sensitive data",
            int_value=100,
            int_encrypted=12345,
            float_encrypted=123.45,
            bool_encrypted=True
        )
        
        # Create an instance with test values
        test_obj = TestModel(
            string_value="Unencrypted string",
            string_encrypted="This is sensitive data",
            int_value=100,
            int_encrypted=12345,
            float_encrypted=123.45,
            bool_encrypted=True
        )
        
        # Create an instance with test values
        test_obj = TestModel(
            string_value="Unencrypted string",
            string_encrypted="This is sensitive data",
            int_value=100,
            int_encrypted=12345,
            float_encrypted=123.45,
            bool_encrypted=True
        )
        
        # Create an instance with test values
        test_obj = TestModel(
            string_value="Unencrypted string",
            string_encrypted="This is sensitive data",
            int_value=100,
            int_encrypted=12345,
            float_encrypted=123.45,
            bool_encrypted=True
        )
        
        # Create an instance with test values
        test_obj = TestModel(
            string_value="Unencrypted string",
            string_encrypted="This is sensitive data",
            int_value=100,
            int_encrypted=12345,
            float_encrypted=123.45,
            bool_encrypted=True
        )
        
        # Create an instance with test values
        test_obj = TestModel(
            string_value="Unencrypted string",
            string_encrypted="This is sensitive data",
            int_value=100,
            int_encrypted=12345,
            float_encrypted=123.45,
            bool_encrypted=True
        )
        
        # Create an instance with test values
        test_obj = TestModel(
            string_value="Unencrypted string",
            string_encrypted="This is sensitive data",
            int_value=100,
            int_encrypted=12345,
            float_encrypted=123.45,
            bool_encrypted=True
        )
        
        # Create an instance with test values
        test_obj = TestModel(
            string_value="Unencrypted string",
            string_encrypted="This is sensitive data",
            int_value=100,
            int_encrypted=12345,
            float_encrypted=123.45,
            bool_encrypted=True
        )
        
        # Create an instance with test values
        test_obj = TestModel(
            string_value="Unencrypted string",
            string_encrypted="This is sensitive data",
            int_value=100,
            int_encrypted=12345,
            float_encrypted=123.45,
            bool_encrypted=True
        )
        
        # Create an instance with test values
        test_obj = TestModel(
            string_value="Unencrypted string",
            string_encrypted="This is sensitive data",
            int_value=100,
            int_encrypted=12345,
            float_encrypted=123.45,
            bool_encrypted=True
        )
        
        # Create an instance with test values
        test_obj = TestModel(
            string_value="Unencrypted string",
            string_encrypted="This is sensitive data",
            int_value=100,
            int_encrypted=12345,
            float_encrypted=123.45,
            bool_encrypted=True
        )
        
        # Create an instance with test values
        test_obj = TestModel(
            string_value="Unencrypted string",
            string_encrypted="This is sensitive data",
            int_value=100,
            int_encrypted=12345,
            float_encrypted=123.45,
            bool_encrypted=True
        )
        
        # Create an instance with test values
        test_obj = TestModel(
            string_value="Unencrypted string",
            string_encrypted="This is sensitive data",
            int_value=100,
            int_encrypted=12345,
            float_encrypted=123.45,
            bool_encrypted=True
        )
        
        # Create an instance with test values
        test_obj = TestModel(
            string_value="Unencrypted string",
            string_encrypted="This is sensitive data",
            int_value=100,
            int_encrypted=12345,
            float_encrypted=123.45,
            bool_encrypted=True
        )
        
        # Create an instance with test values
        test_obj = TestModel(
            string_value="Unencrypted string",
            string_encrypted="This is sensitive data",
            int_value=100,
            int_encrypted=12345,
            float_encrypted=123.45,
            bool_encrypted=True
        )
        
        # Create an instance with test values
        test_obj = TestModel(
            string_value="Unencrypted string",
            string_encrypted="This is sensitive data",
            int_value=100,
            int_encrypted=12345,
            float_encrypted=123.45,
            bool_encrypted=True
        )
        
        # Create an instance with test values
        test_obj = TestModel(
            string_value="Unencrypted string",
            string_encrypted="This is sensitive data",
            int_value=100,
            int_encrypted=12345,
            float_encrypted=123.45,
            bool_encrypted=True
        )
        
        # Create an instance with test values
        test_obj = TestModel(
            string_value="Unencrypted string",
            string_encrypted="This is sensitive data",
            int_value=100,
            int_encrypted=12345,
            float_encrypted=123.45,
            bool_encrypted=True
        )
        
        # Create an instance with test values
        test_obj = TestModel(
            string_value="Unencrypted string",
            string_encrypted="This is sensitive data",
            int_value=100,
            int_encrypted=12345,
            float_encrypted=123.45,
            bool_encrypted=True
        )
        
        # Create an instance with test values
        test_obj = TestModel(
            string_value="Unencrypted string",
            string_encrypted="This is sensitive data",
            int_value=100,
            int_encrypted=12345,
            float_encrypted=123.45,
            bool_encrypted=True
        )
        
        # Create an instance with test values
        test_obj = TestModel(
            string_value="Unencrypted string",
            string_encrypted="This is sensitive data",
            int_value=100,
            int_encrypted=12345,
            float_encrypted=123.45,
            bool_encrypted=True
        )
        
        # Create an instance with test values
        test_obj = TestModel(
            string_value="Unencrypted string",
            string_encrypted="This is sensitive data",
            int_value=100,
            int_encrypted=12345,
            float_encrypted=123.45,
            bool_encrypted=True
        )
        
        # Create an instance with test values
        test_obj = TestModel(
            string_value="Unencrypted string",
            string_encrypted="This is sensitive data",
            int_value=100,
            int_encrypted=12345,
            float_encrypted=123.45,
            bool_encrypted=True
        )
        
        # Create an instance with test values
        test_obj = TestModel(
            string_value="Unencrypted string",
            string_encrypted="This is sensitive data",
    # Define test values
    test_values = [
        ("String", "This is sensitive data", str),
        ("Integer", 12345, int),
        ("Float", 123.45, float),
        ("Dictionary", {"key": "value", "nested": {"foo": "bar"}}, dict),
        ("List", [1, 2, 3, "four"], list),
        ("Boolean", True, bool),
        ("None", None, type(None))
    ]
    
    all_passed = True
    
    for label, value, expected_type in test_values:
        print(f"\n{Colors.BOLD}Testing EncryptedField with {label}:{Colors.ENDC}")
        
        try:
            # Create an encrypted field
            encrypted_field = EncryptedField()
            
            # Set the value (this triggers encryption)
            encrypted_field.value = value
            
            # Get the encrypted value
            encrypted_value = encrypted_field.encrypted_value
            
            # Get the decrypted value
            decrypted_value = encrypted_field.value
            
            # Check if the original value matches the decrypted value
            if isinstance(value, dict) and isinstance(decrypted_value, dict):
                original_json = json.dumps(value, sort_keys=True)
                decrypted_json = json.dumps(decrypted_value, sort_keys=True)
                is_match = original_json == decrypted_json
            elif isinstance(value, list) and isinstance(decrypted_value, list):
                is_match = len(value) == len(decrypted_value) and all(a == b for a, b in zip(value, decrypted_value))
            else:
                is_match = value == decrypted_value
                
            # Check if the type is preserved
            type_match = type(decrypted_value) == expected_type
            
            # Print comparison
            print_value_comparison(
                label, 
                value, 
                encrypted_value, 
                decrypted_value,
                is_match and type_match
            )
            
            if not is_match or not type_match:
                all_passed = False
                
        except Exception as e:
            print(f"  {Colors.RED}✗ ERROR: {str(e)}{Colors.ENDC}")
            all_passed = False
    
    return all_passed

def test_encrypted_json():
    """Test the EncryptedJSON class."""
    # Import the necessary classes
    from api.models.encrypted_fields import EncryptedJSON
    
    print_section_header("Testing EncryptedJSON")
    
    # Define test values
    test_values = [
        ("Simple Dictionary", {"name": "John Doe", "age": 30}),
        ("Nested Dictionary", {
            "patient": {
                "name": "Jane Smith",
                "age": 45,
                "medical_ids": [12345, 67890],
                "allergies": ["penicillin", "peanuts"],
                "insurance": {
                    "provider": "Blue Cross",
                    "policy_number": "BC123456789"
                }
            }
        }),
        ("Array", [1, 2, 3, 4, 5]),
        ("Mixed Array", [1, "two", {"three": 3}, [4, 5]]),
        ("Empty Dictionary", {}),
        ("None", None)
    ]
    
    all_passed = True
    
    for label, value in test_values:
        print(f"\n{Colors.BOLD}Testing EncryptedJSON with {label}:{Colors.ENDC}")
        
        try:
            # Create an encrypted JSON field
            encrypted_json = EncryptedJSON()
            
            # Set the value (this triggers encryption)
            encrypted_json.value = value
            
            # Get the encrypted value
            encrypted_value = encrypted_json.encrypted_value
            
            # Get the decrypted value
            decrypted_value = encrypted_json.value
            
            # Check if the original value matches the decrypted value
            if isinstance(value, dict) and isinstance(decrypted_value, dict):
                original_json = json.dumps(value, sort_keys=True)
                decrypted_json = json.dumps(decrypted_value, sort_keys=True)
                is_match = original_json == decrypted_json
            elif isinstance(value, list) and isinstance(decrypted_value, list):
                original_json = json.dumps(value, sort_keys=True)
                decrypted_json = json.dumps(decrypted_value, sort_keys=True)
                is_match = original_json == decrypted_json
            else:
                is_match = value == decrypted_value
                
            # Print comparison
            print_value_comparison(
                label, 
                value, 
                encrypted_value, 
                decrypted_value,
                is_match
            )
            
            if not is_match:
                all_passed = False
                
        except Exception as e:
            print(f"  {Colors.RED}✗ ERROR: {str(e)}{Colors.ENDC}")
            all_passed = False
    
    return all_passed

def test_patient_model_fields():
    """Test the encrypted fields in the Patient model."""
    # Import the necessary classes
    from api.models.encrypted_fields import EncryptedField
    from api.models.patient import Patient
    
    print_section_header("Testing Patient Model Encrypted Fields")
    
    try:
        # Create a patient object
        patient = Patient()
        
        # Define test data
        test_data = {
            "SSN": "123-45-6789",
            "Address": "123 Main St, Apt 4B",
            "Insurance ID": "ABC123456789",
            "Emergency Contact": "John Smith",
            "Emergency Phone": "555-987-6543",
            "Clinical Notes": "Patient has dental anxiety. Use nitrous oxide for procedures."
        }
        
        # Set values
        patient.ssn = test_data["SSN"]
        patient.address = test_data["Address"]
        patient.insurance_id = test_data["Insurance ID"]
        patient.emergency_contact_name = test_data["Emergency Contact"]
        patient.emergency_contact_phone = test_data["Emergency Phone"]
        patient.clinical_notes = test_data["Clinical Notes"]
        
        # Check if encrypted fields are populated
        all_encrypted = all([
            patient.ssn_encrypted is not None,
            patient.address_encrypted is not None,
            patient.insurance_id_encrypted is not None,
            patient.emergency_contact_name_encrypted is not None,
            patient.emergency_contact_phone_encrypted is not None,
            patient.clinical_notes_encrypted is not None
        ])
        
        if all_encrypted:
            print(f"{Colors.GREEN}✓ All sensitive fields were properly encrypted{Colors.ENDC}")
        else:
            print(f"{Colors.RED}✗ Some fields were not encrypted properly{Colors.ENDC}")
        
        # Test each field
        all_passed = True
        
        for field_name, original_value in test_data.items():
            if field_name == "SSN":
                encrypted_value = patient.ssn_encrypted
                decrypted_value = patient.ssn
            elif field_name == "Address":
                encrypted_value = patient.address_encrypted
                decrypted_value = patient.address
            elif field_name == "Insurance ID":
                encrypted_value = patient.insurance_id_encrypted
                decrypted_value = patient.insurance_id
            elif field_name == "Emergency Contact":
                encrypted_value = patient.emergency_contact_name_encrypted
                decrypted_value = patient.emergency_contact_name
            elif field_name == "Emergency Phone":
                encrypted_value = patient.emergency_contact_phone_encrypted
                decrypted_value = patient.emergency_contact_phone
            elif field_name == "Clinical Notes":
                encrypted_value = patient.clinical_notes_encrypted
                decrypted_value = patient.clinical_notes
            
            is_match = original_value == decrypted_value
            
            print_value_comparison(
                field_name,
                original_value,
                encrypted_value,
                decrypted_value,
                is_match
            )
            
            if not is_match:
                all_passed = False
        
        # Print summary
        if all_passed and all_encrypted:
            print(f"{Colors.GREEN}✓ Patient model field encryption working correctly{Colors.ENDC}")
        else:
            print(f"{Colors.RED}✗ Patient model field encryption has issues{Colors.ENDC}")
            
        return all_passed and all_encrypted
            
    except Exception as e:
        print(f"{Colors.RED}✗ ERROR: {str(e)}{Colors.ENDC}")
        return False

def main():
    """Main function."""
    # Set up encryption
    setup_encryption()
    
    # Run encrypted field tests
    field_test_passed = test_encrypted_field()
    
    # Run encrypted JSON tests
    json_test_passed = test_encrypted_json()
    
    # Run patient model field tests
    patient_test_passed = test_patient_model_fields()
    
    # Print overall summary
    print_section_header("Overall Test Summary")
    
    if field_test_passed and json_test_passed and patient_test_passed:
        print(f"{Colors.GREEN}{Colors.BOLD}✓ ALL TESTS PASSED: Patient field encryption system works correctly!{Colors.ENDC}")
        sys.exit(0)
    else:
        print(f"{Colors.RED}{Colors.BOLD}✗ SOME TESTS FAILED: Patient field encryption system has issues.{Colors.ENDC}")
        sys.exit(1)

if __name__ == "__main__":
    main() 