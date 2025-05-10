#!/usr/bin/env python3
"""
Encryption Service Test Script

This script tests the field-level encryption service functionality without
relying on complex database models. It validates that encryption/decryption
works correctly for various data types.

Usage:
    python encryption_test.py
"""

import os
import sys
import json
import argparse
import logging
from datetime import datetime
from typing import Dict, Any, Optional, List

# Add the project root to Python path
script_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.join(script_dir, "../..")
sys.path.append(root_dir)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("encryption_test")

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
    print(f"Key: {key[:10]}...")
    print(f"Salt: {salt[:10]}...")

def print_section_header(title: str):
    """Print a formatted section header."""
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'=' * 60}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD} {title} {Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'=' * 60}{Colors.ENDC}\n")

def run_encryption_tests():
    """Run a series of encryption/decryption tests."""
    # Import the encryption service
    from api.utils.encryption import EncryptionService
    
    print_section_header("Basic Encryption Service Tests")
    
    try:
        # Initialize the encryption service
        encryption_service = EncryptionService()
        print(f"{Colors.GREEN}✓ Encryption service initialized successfully{Colors.ENDC}")
        
        # Define test values for different data types
        test_values = [
            ("String", "This is a test string with special characters: !@#$%^&*()"),
            ("Integer", 12345),
            ("Float", 123.45),
            ("Boolean", True),
            ("Dictionary", {"name": "John Doe", "age": 30, "active": True}),
            ("List", ["item1", "item2", 123, True]),
            ("Date String", "2025-05-15"),
            ("Complex Nested", {
                "patient": {
                    "name": "Jane Smith",
                    "medical_ids": [12345, 67890],
                    "active": True,
                    "insurance": {
                        "provider": "Blue Cross",
                        "policy_number": "BC123456789"
                    }
                }
            }),
            ("None", None)
        ]
        
        # Test each value
        all_passed = True
        
        for label, value in test_values:
            print(f"\n{Colors.BOLD}Testing {label}:{Colors.ENDC}")
            print(f"  Original: {value}")
            
            # Encrypt the value
            try:
                encrypted = encryption_service.encrypt(value)
                print(f"  Encrypted: {encrypted[:50]}..." if encrypted and len(str(encrypted)) > 50 else f"  Encrypted: {encrypted}")
                
                # Decrypt the value
                decrypted = encryption_service.decrypt(encrypted)
                print(f"  Decrypted: {decrypted}")
                
                # Verify the original value matches the decrypted value
                if isinstance(value, dict) and isinstance(decrypted, dict):
                    # For dictionaries, convert to JSON for comparison
                    original_json = json.dumps(value, sort_keys=True)
                    decrypted_json = json.dumps(decrypted, sort_keys=True)
                    is_match = original_json == decrypted_json
                elif isinstance(value, list) and isinstance(decrypted, list):
                    # For lists, check length and elements
                    is_match = len(value) == len(decrypted) and all(a == b for a, b in zip(value, decrypted))
                else:
                    # For other types, direct comparison
                    is_match = value == decrypted
                
                status = f"{Colors.GREEN}✓ MATCH{Colors.ENDC}" if is_match else f"{Colors.RED}✗ MISMATCH{Colors.ENDC}"
                type_match = f"(same type: {type(value).__name__})" if type(value) == type(decrypted) else f"(type changed: {type(value).__name__} → {type(decrypted).__name__})"
                
                print(f"  Status: {status} {type_match}")
                
                if not is_match:
                    all_passed = False
                    
            except Exception as e:
                print(f"  {Colors.RED}✗ ERROR: {str(e)}{Colors.ENDC}")
                all_passed = False
        
        # Print summary
        print_section_header("Test Summary")
        
        if all_passed:
            print(f"{Colors.GREEN}{Colors.BOLD}✓ ALL TESTS PASSED: Encryption/decryption works correctly for all data types!{Colors.ENDC}")
        else:
            print(f"{Colors.RED}{Colors.BOLD}✗ TESTS FAILED: Some values did not match after encryption/decryption.{Colors.ENDC}")
            
    except Exception as e:
        print(f"{Colors.RED}✗ Encryption service initialization failed: {str(e)}{Colors.ENDC}")
        return False
        
    return all_passed

def main():
    """Main function."""
    # Set up encryption keys
    setup_encryption()
    
    # Run encryption tests
    success = run_encryption_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main() 