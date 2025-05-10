#!/usr/bin/env python3
"""
Test script for all DentaMind API routes.
Verifies that all endpoints are responding correctly.
"""

import requests
import json
import sys
import time
from datetime import datetime
import argparse

def test_route(base_url, route, description, method="GET"):
    """Test a specific route and print the result"""
    print(f"\n=== Testing {description} ===")
    try:
        if method == "GET":
            response = requests.get(f"{base_url}{route}", timeout=5)
        else:
            # For now, we only have GET endpoints in our tests
            raise ValueError(f"Unsupported method: {method}")
        
        if response.status_code == 200:
            print(f"✅ Success! Status code: {response.status_code}")
            try:
                json_data = response.json()
                # Pretty print with max width to avoid huge outputs
                formatted_data = json.dumps(json_data, indent=2)[:500]
                if len(formatted_data) < len(json.dumps(json_data)):
                    formatted_data += "..."
                print(f"Data snippet: {formatted_data}")
            except:
                print(f"Response: {response.text[:100]}...")
        else:
            print(f"❌ Failed! Status code: {response.status_code}")
            print(f"Response: {response.text[:100]}...")
        
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    """Main function to run tests"""
    parser = argparse.ArgumentParser(description="Test DentaMind API routes")
    parser.add_argument("--host", default="localhost", help="Server host")
    parser.add_argument("--port", default=8090, type=int, help="Server port")
    args = parser.parse_args()
    
    base_url = f"http://{args.host}:{args.port}"
    
    print(f"=== DentaMind API Route Tests ===")
    print(f"Time: {datetime.now().isoformat()}")
    print(f"Server URL: {base_url}")
    
    # Track our test results
    total_tests = 0
    passed_tests = 0
    
    # Test basic routes
    routes_to_test = [
        # Basic endpoints
        ("/", "Server Root"),
        ("/health", "Health Endpoint"),
        ("/api/health", "API Health Endpoint"),
        
        # Knowledge routes
        ("/api/knowledge/categories", "Knowledge Categories"),
        
        # Diagnose routes
        ("/api/diagnose/test", "Diagnose Test Endpoint"),
        ("/api/diagnose/sample", "Diagnose Sample Data"),
        
        # Perio routes
        ("/api/perio/test", "Perio Test Endpoint"),
        ("/api/perio/sample", "Perio Sample Chart"),
        
        # Image routes
        ("/api/image/test", "Image Test Endpoint"),
        ("/api/image/sample", "Image Sample Analysis"),
        
        # Risk routes
        ("/api/risk/test", "Risk Test Endpoint"),
        ("/api/risk/sample/moderate_risk", "Risk Sample Assessment - Moderate"),
        
        # Patient routes
        ("/api/patients/sample", "Sample Patients"),
        ("/api/image/history/TEST123", "Patient X-ray History"),
        ("/api/diagnose/history/TEST123", "Patient Diagnosis History"),
        ("/api/risk/history/TEST123", "Patient Risk History"),
        ("/api/perio/patients/TEST123/charts", "Patient Perio Charts"),
    ]
    
    for route, description in routes_to_test:
        total_tests += 1
        if test_route(base_url, route, description):
            passed_tests += 1
    
    # Print summary
    print(f"\n=== Test Summary ===")
    print(f"Tests Run: {total_tests}")
    print(f"Tests Passed: {passed_tests}")
    print(f"Success Rate: {passed_tests/total_tests*100:.1f}%")
    
    if passed_tests < total_tests:
        print("\nSome tests failed. Please check the logs above for errors.")
        sys.exit(1)
    else:
        print("\nAll tests passed! DentaMind API is working correctly.")
        sys.exit(0)

if __name__ == "__main__":
    main() 