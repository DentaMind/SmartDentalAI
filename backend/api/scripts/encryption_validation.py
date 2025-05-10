#!/usr/bin/env python3
"""
Encryption Validation Script

This script validates that the EncryptionService is working properly for field-level
encryption in the DentaMind system. It tests various data types and reports the results.

Usage:
    python encryption_validation.py
"""

import os
import sys
import json
import logging
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
logger = logging.getLogger("encryption_validation")

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

def print_value_comparison(label: str, original: Any, encrypted: Any, decrypted: Any, success: bool = True):
    """Print a comparison of original, encrypted, and decrypted values."""
    status = f"{Colors.GREEN}✓ MATCH{Colors.ENDC}" if success else f"{Colors.RED}✗ MISMATCH{Colors.ENDC}"
    
    print(f"{Colors.BOLD}{label}:{Colors.ENDC}")
    print(f"  Original:  {original}")
    print(f"  Encrypted: {encrypted[:50]}..." if isinstance(encrypted, str) and len(encrypted) > 50 else f"  Encrypted: {encrypted}")
    print(f"  Decrypted: {decrypted}")
    print(f"  Status:    {status}")
    print()

def test_encryption_service():
    """Test the EncryptionService directly."""
    from api.utils.encryption import EncryptionService
    
    print_section_header("Testing Encryption Service")
    
    try:
        # Initialize the encryption service
        encryption_service = EncryptionService()
        print(f"{Colors.GREEN}✓ Encryption service initialized successfully{Colors.ENDC}")
        
        # Define test values for different data types
        test_values = [
            ("String", "This is a sensitive patient data string", str),
            ("Integer", 12345, int),
            ("Float", 123.45, float),
            ("Boolean", True, bool),
            ("Dictionary", {"name": "John Doe", "age": 45, "active": True}, dict),
            ("List", ["item1", "item2", 123, True], list),
            ("Nested Dict", {
                "patient": {
                    "name": "Jane Smith",
                    "medical_ids": [12345, 67890],
                    "active": True,
                    "insurance": {
                        "provider": "Blue Cross",
                        "policy_number": "BC123456789"
                    }
                }
            }, dict),
            ("None", None, type(None))
        ]
        
        # Test each value
        all_passed = True
        
        for label, value, expected_type in test_values:
            print(f"\n{Colors.BOLD}Testing {label}:{Colors.ENDC}")
            
            try:
                # Encrypt
                encrypted = encryption_service.encrypt(value)
                
                # Decrypt
                decrypted = encryption_service.decrypt(encrypted)
                
                # Check if values match
                if isinstance(value, dict) and isinstance(decrypted, dict):
                    # For dictionaries, compare as JSON
                    is_match = json.dumps(value, sort_keys=True) == json.dumps(decrypted, sort_keys=True)
                elif isinstance(value, list) and isinstance(decrypted, list):
                    # For lists, check each element
                    is_match = len(value) == len(decrypted) and all(a == b for a, b in zip(value, decrypted))
                else:
                    # Direct comparison for other types
                    is_match = value == decrypted
                
                # Check if type is preserved
                type_match = type(decrypted) == expected_type if value is not None else True
                
                # Print results
                print_value_comparison(
                    label,
                    value,
                    encrypted,
                    decrypted,
                    is_match and type_match
                )
                
                if not is_match:
                    print(f"{Colors.RED}✗ Value mismatch{Colors.ENDC}")
                    all_passed = False
                
                if not type_match:
                    print(f"{Colors.RED}✗ Type changed: expected {expected_type.__name__}, got {type(decrypted).__name__}{Colors.ENDC}")
                    all_passed = False
                
            except Exception as e:
                print(f"{Colors.RED}✗ ERROR: {str(e)}{Colors.ENDC}")
                all_passed = False
        
        # Summary
        if all_passed:
            print(f"\n{Colors.GREEN}{Colors.BOLD}✓ ALL ENCRYPTION TESTS PASSED{Colors.ENDC}")
        else:
            print(f"\n{Colors.RED}{Colors.BOLD}✗ SOME ENCRYPTION TESTS FAILED{Colors.ENDC}")
        
        return all_passed
        
    except Exception as e:
        print(f"{Colors.RED}✗ Failed to initialize encryption service: {str(e)}{Colors.ENDC}")
        return False

def main():
    """Main function to run all tests."""
    # Set up encryption
    setup_encryption()
    
    # Test encryption service
    success = test_encryption_service()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main() 