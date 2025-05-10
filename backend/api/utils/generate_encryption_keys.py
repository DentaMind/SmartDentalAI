#!/usr/bin/env python3
"""
Generate encryption keys for DentaMind application.

This script generates a secure encryption key and salt that can be used
for field-level encryption of sensitive patient data.

Usage:
    python generate_encryption_keys.py

The generated keys should be stored securely in environment variables
or a secure key management system.
"""

import os
import base64
import argparse
from pathlib import Path
from encryption import EncryptionService

def main():
    """Generate and display encryption keys."""
    parser = argparse.ArgumentParser(description="Generate encryption keys for DentaMind")
    parser.add_argument("--env-file", "-e", help="Path to .env file to update")
    parser.add_argument("--print", "-p", action="store_true", help="Print keys to console")
    args = parser.parse_args()
    
    # Generate keys
    key = EncryptionService.generate_key()
    salt = EncryptionService.generate_salt()
    
    # Print to console if requested
    if args.print:
        print("\n=== DENTAMIND ENCRYPTION KEYS ===")
        print("WARNING: Store these securely and never commit them to version control!")
        print("\nDENTAMIND_ENCRYPTION_KEY:", key)
        print("DENTAMIND_ENCRYPTION_SALT:", salt)
        print("\nAdd these to your environment variables or .env file")
    
    # Update .env file if provided
    if args.env_file:
        env_path = Path(args.env_file)
        
        # Read existing content if file exists
        if env_path.exists():
            with open(env_path, 'r') as f:
                lines = f.readlines()
            
            # Remove existing encryption key/salt lines
            lines = [line for line in lines 
                     if not line.startswith("DENTAMIND_ENCRYPTION_KEY=") and 
                        not line.startswith("DENTAMIND_ENCRYPTION_SALT=")]
        else:
            lines = []
        
        # Add new keys
        lines.append(f"DENTAMIND_ENCRYPTION_KEY={key}\n")
        lines.append(f"DENTAMIND_ENCRYPTION_SALT={salt}\n")
        
        # Write back to file
        with open(env_path, 'w') as f:
            f.writelines(lines)
            
        print(f"Updated encryption keys in {args.env_file}")
    
    # If neither option was chosen, print to console
    if not args.print and not args.env_file:
        print("\n=== DENTAMIND ENCRYPTION KEYS ===")
        print("WARNING: Store these securely and never commit them to version control!")
        print("\nDENTAMIND_ENCRYPTION_KEY:", key)
        print("DENTAMIND_ENCRYPTION_SALT:", salt)

if __name__ == "__main__":
    main() 