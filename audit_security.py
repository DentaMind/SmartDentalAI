#!/usr/bin/env python3
"""
DentaMind RBAC Security Audit Script

This script runs a comprehensive security audit on the DentaMind API, 
checking for unprotected routes and RBAC vulnerabilities.

The audit focuses on:
1. Endpoints missing authentication
2. Endpoints with authentication but missing role checks
3. Inconsistent permission patterns across similar endpoints
4. Potential data leaks in patient-related endpoints

The script generates an HTML report with detailed findings.

Usage:
    python audit_security.py
"""

import os
import sys
import subprocess
from pathlib import Path

def main():
    """Run the security audit script"""
    print("Starting DentaMind RBAC Security Audit...")
    
    # Path to the audit runner script
    audit_script = Path("backend/run_security_audit.py")
    
    if not audit_script.exists():
        print(f"Error: Audit script not found at {audit_script}")
        return 1
    
    # Make the script executable
    os.chmod(audit_script, 0o755)
    
    # Run the audit script
    result = subprocess.run([sys.executable, str(audit_script)], check=False)
    
    if result.returncode != 0:
        print("Security audit failed.")
        return result.returncode
        
    return 0

if __name__ == "__main__":
    sys.exit(main()) 