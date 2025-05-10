#!/usr/bin/env python3
"""
Test script for DentaMind Knowledge Server routes.
"""

import requests
import json
import sys
import time
from datetime import datetime

# Base URL for the server
BASE_URL = "http://localhost:8091"

def test_route(route, description):
    """Test a specific route and print the result"""
    print(f"\n=== Testing {description} ===")
    try:
        response = requests.get(f"{BASE_URL}{route}", timeout=5)
        if response.status_code == 200:
            print(f"✅ Success! Status code: {response.status_code}")
            try:
                json_data = response.json()
                print(f"Data snippet: {json.dumps(json_data, indent=2)[:200]}...")
            except:
                print(f"Response: {response.text[:100]}...")
        else:
            print(f"❌ Failed! Status code: {response.status_code}")
            print(f"Response: {response.text[:100]}...")
    except Exception as e:
        print(f"❌ Error: {e}")

def main():
    """Main function to run tests"""
    print(f"=== DentaMind Knowledge Server Tests ===")
    print(f"Time: {datetime.now().isoformat()}")
    print(f"Server URL: {BASE_URL}")
    
    # Test server root
    test_route("/", "Server Root")
    
    # Test health endpoint
    test_route("/health", "Health Endpoint")
    
    # Test diagnose endpoints
    test_route("/api/diagnose/test", "Diagnose Test Endpoint")
    test_route("/api/diagnose/sample", "Diagnose Sample Data")
    
    # Test perio endpoints
    test_route("/api/perio/test", "Perio Test Endpoint")
    test_route("/api/perio/sample", "Perio Sample Data")
    
    # Test knowledge endpoints
    test_route("/api/knowledge/categories", "Knowledge Categories")
    
    print("\n=== Tests Complete ===")
    
if __name__ == "__main__":
    main() 